import heapq
from collections import defaultdict, deque

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case

from app.models.seating import Seating
from app.models.room import Room
from app.models.allocation import Allocation
from app.models.seat_allocation import SeatAllocation
from app.models.student import Student
from app.models.exam import Exam


class AllocationService:

    @staticmethod
    def allocate(slot: str, rows: int, cols: int, db: Session):

        # ------------------------------------------------------------------ #
        # 1. FETCH STUDENTS                                                   #
        # Only the three fields we use — avoids hydrating the full ORM object #
        # ------------------------------------------------------------------ #
        entries = (
            db.query(
                Seating.student_id,
                Seating.course_id,
                Seating.exam_id,
            )
            .join(Student, Seating.student_id == Student.id)
            .join(Exam, Seating.exam_id == Exam.id)
            .filter(Seating.slot == slot, Seating.is_eligible == True)
            .order_by(
                case(
                    (Exam.event_name.contains("(R)"), 0),
                    (Exam.event_name.contains("(S)"), 1),
                    else_=2
                ),
                case(
                    (Student.reg_no.like("S%"), 0),
                    (Student.reg_no.like("L%"), 1),
                    else_=2
                ),
                Student.reg_no
            )
            .all()
        )

        if not entries:
            raise HTTPException(status_code=404, detail="No students found")

        # ------------------------------------------------------------------ #
        # 2. GROUP BY COURSE                                                  #
        # deque gives O(1) popleft(); list.pop(0) is O(n).                   #
        # ------------------------------------------------------------------ #
        subject_map: dict[str, deque] = defaultdict(deque)
        exam_id = entries[0].exam_id

        for e in entries:
            subject_map[e.course_id].append(e)

        # ------------------------------------------------------------------ #
        # 3. FAIL-FAST: ROOMS CHECK                                           #
        # Check before any DB write so no orphaned Allocation row is created. #
        # ------------------------------------------------------------------ #
        rooms = db.query(Room.id).all()
        if not rooms:
            raise HTTPException(status_code=400, detail="No rooms available")

        # ------------------------------------------------------------------ #
        # 4. CREATE ALLOCATION ENTRY                                          #
        # flush() gets allocation.id without committing; everything commits   #
        # in one shot at the end (or rolls back on failure).                  #
        # ------------------------------------------------------------------ #
        allocation = Allocation(exam_id=exam_id, slot=slot)
        db.add(allocation)
        db.flush()

        # ------------------------------------------------------------------ #
        # 5. BUILD MAX-HEAP                                                   #
        # Negative count so Python's min-heap yields the largest group first. #
        # ------------------------------------------------------------------ #
        heap: list[tuple[int, str]] = []
        for course_id, students in subject_map.items():
            heapq.heappush(heap, (-len(students), course_id))

        # ------------------------------------------------------------------ #
        # 6. ACTIVE QUEUE — always holds up to 2 live course_ids             #
        # ------------------------------------------------------------------ #
        active: deque[str] = deque()

        def pop_heap() -> str | None:
            """Return the course_id with the most remaining students."""
            while heap:
                _, cid = heapq.heappop(heap)
                if subject_map[cid]:        # skip if somehow empty
                    return cid
            return None

        def fill_active() -> None:
            """Top up the active queue to 2 subjects (or 1 if heap is empty)."""
            while len(active) < 2:
                nxt = pop_heap()
                if nxt is None:
                    break
                active.append(nxt)

        fill_active()

        # ------------------------------------------------------------------ #
        # 7. COLUMN LAYOUT                                                    #
        #                                                                     #
        # 1-indexed  :  col 1   col 2   col 3   col 4   col 5               #
        # 0-indexed  :  col 0   col 1   col 2   col 3   col 4               #
        # type       :  PRI     SEC     PRI     SEC     PRI                  #
        #                                                                     #
        # PRIMARY   (0-indexed even) → subject with MORE students            #
        # SECONDARY (0-indexed odd)  → subject with FEWER students           #
        #                                                                     #
        # If only 1 subject remains it fills PRIMARY cols only.              #
        # ------------------------------------------------------------------ #

        # ------------------------------------------------------------------ #
        # 8. ROOM ALLOCATION LOOP                                            #
        # ------------------------------------------------------------------ #
        seat_objects: list[SeatAllocation] = []

        def get_pri_sec() -> tuple[str | None, str | None]:
            """
            Return (primary_course_id, secondary_course_id) based on current
            student counts.  secondary is None when only 1 subject is active.
            """
            if len(active) == 0:
                return None, None
            if len(active) == 1:
                return active[0], None
            a, b = active[0], active[1]
            return (a, b) if len(subject_map[a]) >= len(subject_map[b]) else (b, a)

        def allocate_room(room_id: int) -> None:
            # Lock primary / secondary at the START of the room.
            # Sizes are fixed here; we do NOT re-evaluate per column
            # (that would cause the assignment to flip mid-room as counts
            # change, leading to same-subject adjacency violations).
            pri, sec = get_pri_sec()

            for col in range(cols):
                is_primary_col = (col % 2 == 0)

                # The subject assigned to this column type for the whole column.
                col_subject   = pri if is_primary_col else sec
                # The subject filling the adjacent col type (used to prevent
                # placing the same subject in neighbouring columns).
                other_subject = sec if is_primary_col else pri

                if col_subject is None:
                    continue   # no subject for this col type (e.g. last subject → skip SEC cols)

                for row in range(rows):

                    # If this column's subject is exhausted, pull the next one
                    # from the heap.  The replacement must differ from the
                    # subject in adjacent columns to maintain the alternating rule.
                    while col_subject is not None and not subject_map[col_subject]:
                        if col_subject in active:
                            active.remove(col_subject)
                        fill_active()

                        # Find a replacement that won't create an adjacency clash.
                        replacement = None
                        for cid in list(active):
                            if cid != other_subject and subject_map[cid]:
                                replacement = cid
                                break

                        col_subject = replacement

                        # Re-lock pri/sec so subsequent columns in this room
                        # stay consistent after the refill.
                        pri, sec = get_pri_sec()
                        if is_primary_col:
                            pri = col_subject if col_subject else pri
                        else:
                            sec = col_subject if col_subject else sec

                    if col_subject is None:
                        break   # nothing left for this col type

                    e = subject_map[col_subject].popleft()
                    seat_objects.append(
                        SeatAllocation(
                            allocation_id=allocation.id,
                            room_id=room_id,
                            row=row,
                            col=col,
                            student_id=e.student_id,
                            course_id=e.course_id,
                        )
                    )

        for room in rooms:
            if not active:
                break
            allocate_room(room.id)
            # Carry-over: subjects that still have students remain in `active`.
            # Top up to 2 for the next room in case one was exhausted.
            fill_active()

        # ------------------------------------------------------------------ #
        # 9. FINAL CHECK                                                      #
        # ------------------------------------------------------------------ #
        remaining = sum(len(q) for q in subject_map.values())
        if remaining > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough rooms to allocate all students. "
                    f"{remaining} student(s) unallocated."
                ),
            )

        # ------------------------------------------------------------------ #
        # 10. SAVE — single commit                                            #
        # bulk_save_objects issues one multi-row INSERT, much faster than     #
        # adding ORM objects one by one.                                      #
        # ------------------------------------------------------------------ #
        db.bulk_save_objects(seat_objects)
        db.commit()

        return {
            "success": True,
            "message": f"Allocation completed. Total students: {len(seat_objects)}",
        }