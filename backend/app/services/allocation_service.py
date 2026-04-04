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
    def allocate(slot: str, semester: str, rows: int, cols: int, db: Session):
        """
        Allocate seating for a specific semester + slot.
        This prevents mixing students from different semesters (e.g., S4 Slot A and S5 Slot A).
        """

        # ------------------------------------------------------------------ #
        # STEP 1: FETCH ELIGIBLE STUDENTS FOR GIVEN SEMESTER + SLOT
        # ------------------------------------------------------------------ #
        entries = (
            db.query(
                Seating.student_id,
                Seating.course_id,
                Seating.exam_id,
                Student.reg_no,
                Student.name,
                Exam.event_name,
                Exam.date,
                Exam.session,
            )
            .join(Student, Seating.student_id == Student.id)
            .join(Exam, Seating.exam_id == Exam.id)
            .filter(
                Seating.slot == slot,
                Exam.event_name.contains(f" {semester} "),  # ← replaces Exam.semester == semester
                Seating.is_eligible == True,
                Exam.event_name.regexp_match(r'\((R|S)[,)]'),
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
                detail=f"No eligible students found for {semester} Slot '{slot}'"
            )

        # ------------------------------------------------------------------ #
        # STEP 1B: OVERWRITE EXISTING ALLOCATION IF ANY
        # ------------------------------------------------------------------ #
        existing = (
            db.query(Allocation)
            .filter(Allocation.slot == slot,Allocation.semester == semester)
            .first()
        )

        if existing:
            db.query(SeatAllocation).filter(
                SeatAllocation.allocation_id == existing.id
            ).delete()
            db.query(Allocation).filter(Allocation.id == existing.id).delete()
            db.flush()

        # ------------------------------------------------------------------ #
        # STEP 2: GROUP BY EXAM → COURSE, SORT BY (DEPT, YEAR, NUM)
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
            supply = defaultdict(lambda: defaultdict(list))
            for e in entries:
                if "(R)" in e.event_name:
                    regular[e.exam_id][e.course_id].append(e)
                else:
                    supply[e.exam_id][e.course_id].append(e)

            regular = {
                eid: {
                    cid: deque(sorted(sts, key=lambda x: extract_sort_key(x.reg_no)))
                    for cid, sts in courses.items()
                }
                for eid, courses in regular.items()
            }
            supply = {
                eid: {
                    cid: deque(sorted(sts, key=lambda x: extract_sort_key(x.reg_no)))
                    for cid, sts in courses.items()
                }
                for eid, courses in supply.items()
            }
            return regular, supply

        regular_groups, supply_groups = group_and_split(entries)

        # ------------------------------------------------------------------ #
        # STEP 3: BUILD STUDENT MAP + SINGLE COMBINED HEAP
        # ------------------------------------------------------------------ #
        student_map = {}
        heap = []

        # Regular — flatten by course_id
        flat_regular = defaultdict(deque)
        for eid, courses in regular_groups.items():
            for cid, students in courses.items():
                flat_regular[cid].extend(students)

        for cid, students in flat_regular.items():
            student_map[cid] = students
            heapq.heappush(heap, (-len(students), 0, cid))

        # Supply — keep (eid, course_id) as key
        for eid, courses in supply_groups.items():
            for cid, students in courses.items():
                key = (eid, cid)
                student_map[key] = students
                heapq.heappush(heap, (-len(students), 1, key))

        # ------------------------------------------------------------------ #
        # STEP 4A: FETCH ROOMS
        # ------------------------------------------------------------------ #
        # Get current exam's date and session from first entry
        current_date = entries[0].date
        current_session = entries[0].session

        # Find allocations on the same date + session but different semester
        conflicting_allocation_ids = (
            db.query(Allocation.id)
            .join(Exam, Allocation.exam_id == Exam.id)
            .filter(
                Exam.date == current_date,
                Exam.session == current_session,
                Allocation.semester != semester,
            )
            .all()
        )
        conflicting_ids = [a.id for a in conflicting_allocation_ids]

        if conflicting_ids:
            # Same date + session → exclude already used rooms
            used_room_ids = (
                db.query(SeatAllocation.room_id)
                .filter(SeatAllocation.allocation_id.in_(conflicting_ids))
                .distinct()
                .all()
            )
            used_room_ids = {r[0] for r in used_room_ids}

            rooms = (
                db.query(Room)
                .filter(Room.id.notin_(used_room_ids))
                .order_by(Room.id)
                .all()
            )
        else:
            # Different date or session → use all rooms
            rooms = db.query(Room).order_by(Room.id).all()

        if not rooms:
            raise HTTPException(
                status_code=400,
                detail=f"No available rooms for {semester} Slot '{slot}'. "
                       f"All rooms are occupied by another semester on the same date and session."
            )

        # ------------------------------------------------------------------ #
        # STEP 4B: CREATE ALLOCATION ENTRY
        # ------------------------------------------------------------------ #
        allocation_exam_id = entries[0].exam_id
        allocation = Allocation(exam_id=allocation_exam_id, slot=slot, semester=semester)
        db.add(allocation)
        db.flush()

        # ------------------------------------------------------------------ #
        # STEP 5: ALLOCATION LOOP (unchanged from your original)
        # ------------------------------------------------------------------ #
        seat_objects = []
        room_index = 0

        active_primary = None
        active_secondary = None

        def pop_from_heap(exclude_key=None):
            skipped = []
            result = None
            while heap:
                entry = heapq.heappop(heap)
                key = entry[2]
                students = student_map.get(key)
                if not students:
                    continue
                if key == exclude_key:
                    skipped.append(entry)
                    continue
                result = key
                break
            for e in skipped:
                heapq.heappush(heap, e)
            return result

        def refill():
            nonlocal active_primary, active_secondary

            if active_primary is not None and not student_map.get(active_primary):
                active_primary = None
            if active_secondary is not None and not student_map.get(active_secondary):
                active_secondary = None

            if active_primary is None:
                active_primary = pop_from_heap(exclude_key=active_secondary)

            if active_secondary is None:
                active_secondary = pop_from_heap(exclude_key=active_primary)

            # Fallback scan
            if active_primary is None:
                for key, q in student_map.items():
                    if q and key != active_secondary:
                        active_primary = key
                        break

            if active_secondary is None:
                for key, q in student_map.items():
                    if q and key != active_primary:
                        active_secondary = key
                        break

        # Initial fill
        refill()

        while (active_primary is not None or active_secondary is not None) and room_index < len(rooms):
            room = rooms[room_index]
            room_index += 1

            if active_primary is not None and active_secondary is not None:
                cnt_p = len(student_map.get(active_primary, []))
                cnt_s = len(student_map.get(active_secondary, []))
                if cnt_s > cnt_p:
                    active_primary, active_secondary = active_secondary, active_primary
                primary = active_primary
                secondary = active_secondary
            elif active_primary is not None:
                primary = active_primary
                secondary = None
            else:
                primary = active_secondary
                secondary = None

            last_col_subject = None

            for col in range(cols):
                if secondary is None:
                    col_subject = primary
                    other_subject = None
                else:
                    natural = primary if col % 2 == 0 else secondary
                    natural_other = secondary if col % 2 == 0 else primary

                    if last_col_subject == natural:
                        if student_map.get(natural_other):
                            col_subject = natural_other
                            other_subject = natural
                        else:
                            fresh = pop_from_heap(exclude_key=natural)
                            if fresh is not None:
                                col_subject = fresh
                                other_subject = natural
                                secondary = fresh
                                active_secondary = fresh
                            else:
                                col_subject = natural
                                other_subject = None
                    else:
                        col_subject = natural
                        other_subject = natural_other

                cur_subject = col_subject
                last_row_subj = col_subject

                for row in range(rows):
                    students = student_map.get(cur_subject)

                    if not students:
                        remaining_seats = rows - row
                        if remaining_seats < 3:
                            break

                        new_subject = pop_from_heap(exclude_key=cur_subject)
                        if new_subject is None:
                            break

                        cur_subject = new_subject
                        secondary = new_subject
                        active_secondary = new_subject
                        students = student_map.get(cur_subject)

                        if not students:
                            break

                    last_row_subj = cur_subject

                    e = students.popleft()
                    seat_objects.append(
                        SeatAllocation(
                            allocation_id=allocation.id,
                            room_id=room.id,
                            row=row,
                            col=col,
                            student_id=e.student_id,
                            course_id=e.course_id,
                        )
                    )

                last_col_subject = last_row_subj

            # After room
            active_primary = primary if student_map.get(primary) else None
            active_secondary = secondary if student_map.get(secondary) else None
            refill()

        # ------------------------------------------------------------------ #
        # STEP 6: FINAL CHECK
        # ------------------------------------------------------------------ #
        remaining = sum(len(q) for q in student_map.values())

        if remaining > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Not enough rooms. {remaining} student(s) unallocated."
            )

        # ------------------------------------------------------------------ #
        # STEP 7: SAVE
        # ------------------------------------------------------------------ #
        db.bulk_save_objects(seat_objects)
        db.commit()

        return {
            "success": True,
            "message": f"Allocation completed for {semester} Slot {slot}. "
                       f"Total students seated: {len(seat_objects)}",
            "allocation_id": allocation.id,
            "total_rooms_used": room_index,
        }