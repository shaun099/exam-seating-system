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
            db.query(SeatAllocation).filter(
                SeatAllocation.allocation_id == existing.id
            ).delete()
            db.query(Allocation).filter(Allocation.id == existing.id).delete()
            db.flush()

        # ------------------------------------------------------------------ #
        # STEP 2: GROUP BY EXAM → COURSE, SORT BY (DEPT, YEAR, NUM)         #
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
            num  = int(reg_no[j:]) if j < len(reg_no) else 0
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
        # STEP 3: BUILD STUDENT MAP + SINGLE COMBINED HEAP                   #
        #                                                                     #
        # One heap with priority tag:                                         #
        #   regular → priority 0 (comes first)                               #
        #   supply  → priority 1 (comes after)                               #
        #                                                                     #
        # Heap entry: (-count, priority, key)                                 #
        #   regular key → course_id (int)                                     #
        #   supply key  → (eid, course_id) (tuple)                           #
        #                                                                     #
        # student_map: { key → deque([entry, ...]) }                         #
        # ------------------------------------------------------------------ #
        student_map = {}
        heap        = []

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
        allocation         = Allocation(exam_id=allocation_exam_id, slot=slot)
        db.add(allocation)
        db.flush()

        # ------------------------------------------------------------------ #
        # STEP 5: ALLOCATION LOOP                                             #
        #                                                                     #
        # active_primary   → subject filling even cols (more students)        #
        # active_secondary → subject filling odd cols (fewer students)        #
        #                                                                     #
        # Both are popped from heap once and stay active until exhausted.     #
        # Heap is only consulted when an active slot becomes None.            #
        # ------------------------------------------------------------------ #
        seat_objects = []
        room_index   = 0

        active_primary   = None
        active_secondary = None

        def pop_from_heap(exclude_key=None):
            """
            Pops next non-empty subject from heap.
            Skips exhausted entries (discards them).
            Skips exclude_key entries (pushes them back).
            Returns key or None if heap is empty.
            """
            skipped = []
            result  = None
            while heap:
                entry    = heapq.heappop(heap)
                # entry = (-count, priority, key)
                key      = entry[2]
                students = student_map.get(key)
                if not students:
                    continue                     # exhausted — discard
                if key == exclude_key:
                    skipped.append(entry)        # wrong slot — push back
                    continue
                result = key
                break
            for e in skipped:
                heapq.heappush(heap, e)
            return result

        def refill():
            """
            Tops up active_primary and active_secondary.
            First tries heap, then falls back to scanning student_map directly
            in case heap is empty but students still remain.
            """
            nonlocal active_primary, active_secondary

            # Drop exhausted
            if active_primary is not None and not student_map.get(active_primary):
                active_primary = None
            if active_secondary is not None and not student_map.get(active_secondary):
                active_secondary = None

            # Fill primary from heap
            if active_primary is None:
                active_primary = pop_from_heap(exclude_key=active_secondary)

            # Fill secondary from heap (exclude primary)
            if active_secondary is None:
                active_secondary = pop_from_heap(exclude_key=active_primary)

            # ---------------------------------------------------------- #
            # Fallback: heap empty but student_map still has students    #
            # Scan student_map directly and pick any non-empty subject   #
            # ---------------------------------------------------------- #
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

        while (active_primary is not None or active_secondary is not None) \
                and room_index < len(rooms):

            room = rooms[room_index]
            room_index += 1

            # ---------------------------------------------------------- #
            # Lock primary/secondary at start of room.                    #
            # primary   → more students → even cols (0, 2, 4...)          #
            # secondary → fewer students → odd cols  (1, 3, 5...)         #
            # ---------------------------------------------------------- #
            if active_primary is not None and active_secondary is not None:
                cnt_p = len(student_map.get(active_primary,   []))
                cnt_s = len(student_map.get(active_secondary, []))
                if cnt_s > cnt_p:
                    active_primary, active_secondary = \
                        active_secondary, active_primary
                primary   = active_primary
                secondary = active_secondary
            elif active_primary is not None:
                primary   = active_primary
                secondary = None
            else:
                primary   = active_secondary
                secondary = None

            # Track what actually filled last row of previous col
            # to prevent adjacent columns having same subject
            last_col_subject = None

            for col in range(cols):

                if secondary is None:
                    col_subject   = primary
                    other_subject = None
                else:
                    natural       = primary   if col % 2 == 0 else secondary
                    natural_other = secondary if col % 2 == 0 else primary

                    if last_col_subject == natural:
                        # Adjacency violation — try natural_other first
                        if student_map.get(natural_other):
                            col_subject   = natural_other
                            other_subject = natural
                        else:
                            # natural_other exhausted — pull fresh from heap
                            fresh = pop_from_heap(exclude_key=natural)
                            if fresh is not None:
                                col_subject      = fresh
                                other_subject    = natural
                                secondary        = fresh
                                active_secondary = fresh
                            else:
                                # Nothing left in heap — use natural as last resort
                                col_subject   = natural
                                other_subject = None
                    else:
                        col_subject   = natural
                        other_subject = natural_other

                cur_subject   = col_subject
                last_row_subj = col_subject

                for row in range(rows):
                    students = student_map.get(cur_subject)

                    if not students:
                        remaining_seats = rows - row

                        if remaining_seats < 3:
                            # Not worth filling — leave empty, move to next col
                            break

                        # -------------------------------------------------- #
                        # Pull fresh subject from heap — ignore cur_other     #
                        # The new subject becomes the new secondary           #
                        # -------------------------------------------------- #
                        new_subject = pop_from_heap(exclude_key=cur_subject)

                        if new_subject is None:
                            # Heap empty — nothing left to fill with
                            break

                        # New subject fills remaining rows of this column
                        # and becomes the new secondary for subsequent columns
                        cur_subject      = new_subject
                        secondary        = new_subject  # ← update secondary for next cols
                        active_secondary = new_subject  # ← update active slot too
                        students         = student_map.get(cur_subject)

                        if not students:
                            break

                    last_row_subj = cur_subject

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

                last_col_subject = last_row_subj

            # ---------------------------------------------------------- #
            # After entire room — update active slots and refill          #
            # ---------------------------------------------------------- #
            active_primary   = primary   if student_map.get(primary)   else None
            active_secondary = secondary if student_map.get(secondary) else None
            refill()

        # ------------------------------------------------------------------ #
        # STEP 6: FINAL CHECK                                                 #
        # ------------------------------------------------------------------ #


        # DEBUG
        print(f"Total seat_objects: {len(seat_objects)}")
        print(f"Remaining in student_map:")
        for key, q in student_map.items():
            if q:
                print(f"  key={key} → {len(q)} students")
                print(f"Heap remaining: {len(heap)}")
                print(f"room_index: {room_index}, total_rooms: {len(rooms)}")
        remaining = sum(len(q) for q in student_map.values())

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