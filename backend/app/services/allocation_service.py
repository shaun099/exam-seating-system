from collections import defaultdict, deque
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case
import heapq

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
        # STEP 1: FETCH ELIGIBLE STUDENTS FOR THE GIVEN SLOT                 #
        # ------------------------------------------------------------------ #
        entries = (
            db.query(
                Seating.student_id,
                Seating.course_id,
                Seating.exam_id,
                Student.reg_no,
                Student.name,
                Exam.event_name,
            )
            .join(Student, Seating.student_id == Student.id)
            .join(Exam, Seating.exam_id == Exam.id)
            .filter(
                Seating.slot == slot,
                Seating.is_eligible == True,
                Exam.event_name.regexp_match(r'\((R|S)\)'),
            )
            .order_by(
                case(
                    (Exam.event_name.contains("(R)"), 0),
                    (Exam.event_name.contains("(S)"), 1),
                ),
                Student.reg_no,
            )
            .all()
        )

        if not entries:
            raise HTTPException(
                status_code=404,
                detail=f"No eligible students found for slot '{slot}'"
            )

        # ------------------------------------------------------------------ #
        # STEP 1B: OVERWRITE EXISTING ALLOCATION IF ANY                      #
        # ------------------------------------------------------------------ #
        existing = (
            db.query(Allocation)
            .filter(Allocation.slot == slot)
            .first()
        )

        if existing:
            db.query(SeatAllocation).filter(SeatAllocation.allocation_id == existing.id).delete()
            db.query(Allocation).filter(Allocation.id == existing.id).delete()
            db.flush()

        # ------------------------------------------------------------------ #
        # STEP 2: GROUP BY EXAM → COURSE, SORT EACH GROUP BY (DEPT,YEAR,NUM)#
        # ------------------------------------------------------------------ #

        def extract_sort_key(reg_no: str):
            i = 0
            while i < len(reg_no) and not reg_no[i].isdigit():
                i += 1
            if i >= len(reg_no):
                return (reg_no, 0, 0)
            year = int(reg_no[i:i+2])
            i += 2
            j = i
            while j < len(reg_no) and reg_no[j].isalpha():
                j += 1
            dept = reg_no[i:j]
            num = int(reg_no[j:]) if j < len(reg_no) else 0
            return (dept, year, num)

        def group_and_split(entries):
            regular = defaultdict(lambda: defaultdict(list))
            supply  = defaultdict(lambda: defaultdict(list))

            for e in entries:
                if "(R)" in e.event_name:
                    regular[e.exam_id][e.course_id].append(e)
                else:
                    supply[e.exam_id][e.course_id].append(e)

            regular = {
                exam_id: {
                    course_id: deque(sorted(students, key=lambda x: extract_sort_key(x.reg_no)))
                    for course_id, students in courses.items()
                }
                for exam_id, courses in regular.items()
            }

            supply = {
                exam_id: {
                    course_id: deque(sorted(students, key=lambda x: extract_sort_key(x.reg_no)))
                    for course_id, students in courses.items()
                }
                for exam_id, courses in supply.items()
            }

            return regular, supply

        regular_groups, supply_groups = group_and_split(entries)

        # ------------------------------------------------------------------ #
        # STEP 3A: FLATTEN REGULAR BY COURSE_ID                              #
        # Keys: int (course_id)                                               #
        # ------------------------------------------------------------------ #
        flat_regular = defaultdict(deque)
        for eid, courses in regular_groups.items():
            for course_id, students in courses.items():
                flat_regular[course_id].extend(students)

        # ------------------------------------------------------------------ #
        # STEP 3B: BUILD REGULAR HEAP                                         #
        # ------------------------------------------------------------------ #
        regular_heap = []
        for course_id, students in flat_regular.items():
            heapq.heappush(regular_heap, (-len(students), course_id))

        # ------------------------------------------------------------------ #
        # STEP 3C: FLATTEN SUPPLY BY (EID, COURSE_ID) + BUILD SUPPLY HEAP    #
        # Keys: tuple (eid, course_id)                                        #
        # ------------------------------------------------------------------ #
        flat_supply = {}
        supply_heap = []
        for eid, courses in supply_groups.items():
            for course_id, students in courses.items():
                flat_supply[(eid, course_id)] = students
                heapq.heappush(supply_heap, (-len(students), eid, course_id))

        # ------------------------------------------------------------------ #
        # STEP 4A: FETCH ROOMS                                                #
        # ------------------------------------------------------------------ #
        rooms = db.query(Room).order_by(Room.id).all()

        if not rooms:
            raise HTTPException(
                status_code=400,
                detail="No rooms available for allocation"
            )

        # ------------------------------------------------------------------ #
        # STEP 4B: CREATE ALLOCATION ENTRY                                    #
        # ------------------------------------------------------------------ #
        allocation_exam_id = entries[0].exam_id
        allocation = Allocation(exam_id=allocation_exam_id, slot=slot)
        db.add(allocation)
        db.flush()

        # ------------------------------------------------------------------ #
        # STEP 5: ALLOCATION LOOP                                             #
        #                                                                     #
        # Single unified run — regular heap has priority.                     #
        # When regular exhausts, supply fills remaining seats in same room.   #
        # Room is filled to max capacity before moving to next room.          #
        # Regular keys: int (course_id)                                       #
        # Supply keys:  tuple (eid, course_id)                                #
        # ------------------------------------------------------------------ #
        seat_objects = []
        room_index   = 0

        # Combined student map — regular keys are int, supply keys are tuple
        combined_map = {}
        combined_map.update(flat_regular)   # { course_id: deque }
        combined_map.update(flat_supply)    # { (eid, course_id): deque }

        def run_allocation():
            nonlocal room_index

            active_primary   = None
            active_secondary = None

            def _pop_next_from_heap(heap, exclude_key=None):
                """
                Pops the next non-empty, non-excluded key from the heap.
                Exhausted entries are discarded. Skipped-due-to-exclude are
                pushed back. Returns the key or None if heap is empty.
                """
                skipped = []
                result  = None
                while heap:
                    entry    = heapq.heappop(heap)
                    key      = entry[1] if len(entry) == 2 else (entry[1], entry[2])
                    students = combined_map.get(key)
                    if not students:
                        continue                     # exhausted — discard
                    if key == exclude_key:
                        skipped.append(entry)        # wrong subject — skip
                        continue
                    result = key
                    break
                for e in skipped:
                    heapq.heappush(heap, e)
                return result

            def refill_active():
                """
                Ensures active_primary and active_secondary are filled
                (if students remain) using regular heap first, supply heap
                second. Never double-assigns the same key to both slots.
                """
                nonlocal active_primary, active_secondary

                # Drop exhausted slots
                if active_primary is not None and not combined_map.get(active_primary):
                    active_primary = None
                if active_secondary is not None and not combined_map.get(active_secondary):
                    active_secondary = None

                # Fill primary from regular heap if empty
                if active_primary is None:
                    active_primary = _pop_next_from_heap(regular_heap)

                # Fill secondary from regular heap (exclude primary to avoid duplicate)
                if active_secondary is None:
                    active_secondary = _pop_next_from_heap(regular_heap, exclude_key=active_primary)

                # Still need primary? Try supply
                if active_primary is None:
                    active_primary = _pop_next_from_heap(supply_heap)

                # Still need secondary? Try supply (exclude primary)
                if active_secondary is None:
                    active_secondary = _pop_next_from_heap(supply_heap, exclude_key=active_primary)

            refill_active()

            while (active_primary or active_secondary) and room_index < len(rooms):
                room = rooms[room_index]
                room_index += 1

                # ---------------------------------------------------------- #
                # Lock primary/secondary ONCE per room.                       #
                # primary (more students) → even cols                         #
                # secondary (fewer students) → odd cols                       #
                # ---------------------------------------------------------- #
                if active_primary and active_secondary:
                    cnt_p = len(combined_map.get(active_primary, []))
                    cnt_s = len(combined_map.get(active_secondary, []))
                    if cnt_s > cnt_p:
                        active_primary, active_secondary = active_secondary, active_primary
                    primary   = active_primary
                    secondary = active_secondary
                elif active_primary:
                    primary   = active_primary
                    secondary = None
                else:
                    primary   = active_secondary
                    secondary = None

                for col in range(cols):

                    if secondary is None:
                        col_subject   = primary
                        other_subject = None
                    else:
                        col_subject   = primary if col % 2 == 0 else secondary
                        other_subject = secondary if col % 2 == 0 else primary

                    for row in range(rows):
                        students = combined_map.get(col_subject)

                        # Current column subject exhausted mid-column
                        if not students:
                            if other_subject and combined_map.get(other_subject):
                                # Switch to the other subject for remaining rows
                                col_subject   = other_subject
                                other_subject = None
                                students      = combined_map.get(col_subject)
                            else:
                                # Both exhausted — refill and continue in same room
                                active_primary   = None
                                active_secondary = None
                                refill_active()
                                if not active_primary and not active_secondary:
                                    break
                                # Update local locks for remaining cols/rows
                                primary       = active_primary or active_secondary
                                secondary     = active_secondary if active_primary else None
                                col_subject   = primary
                                other_subject = None
                                students      = combined_map.get(col_subject)

                        if not students:
                            break

                        e = students.popleft()
                        seat_objects.append(
                            SeatAllocation(
                                allocation_id = allocation.id,
                                room_id       = room.id,
                                row           = row,
                                col           = col,
                                student_id    = e.student_id,
                                course_id     = e.course_id,
                            )
                        )

                # ---------------------------------------------------------- #
                # After entire room — carry forward whatever primary/secondary#
                # were locked at end of room (may have been updated mid-room) #
                # then refill any exhausted slots                             #
                # ---------------------------------------------------------- #
                active_primary   = primary   if combined_map.get(primary)   else None
                active_secondary = secondary if combined_map.get(secondary) else None
                refill_active()

        # ------------------------------------------------------------------ #
        # SINGLE RUN — regular priority, supply fills remaining seats         #
        # ------------------------------------------------------------------ #
        run_allocation()

        # ------------------------------------------------------------------ #
        # STEP 6: FINAL CHECK                                                 #
        # ------------------------------------------------------------------ #
        remaining  = sum(len(q) for q in flat_regular.values())
        remaining += sum(len(q) for q in flat_supply.values())

        if remaining > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Not enough rooms. {remaining} student(s) unallocated."
            )

        # ------------------------------------------------------------------ #
        # STEP 7: SAVE                                                        #
        # ------------------------------------------------------------------ #
        db.bulk_save_objects(seat_objects)
        db.commit()

        return {
            "success": True,
            "message": f"Allocation completed. Total students seated: {len(seat_objects)}",
            "allocation_id": allocation.id,
            "total_rooms_used": room_index,
        }