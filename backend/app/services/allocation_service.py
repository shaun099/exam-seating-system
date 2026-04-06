from collections import defaultdict, deque
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case

from app.models.seating import Seating
from app.models.room import Room
from app.models.allocation import Allocation, AllocationExam   # ← added AllocationExam
from app.models.seat_allocation import SeatAllocation
from app.models.student import Student
from app.models.exam import Exam
from sqlalchemy import tuple_


class AllocationService:

    @staticmethod
    def allocate(slot: str, semester: str, rows: int, cols: int, db: Session):

        # ------------------------------------------------------------------ #
        # STEP 1: FETCH ELIGIBLE STUDENTS  (unchanged)
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
                Exam.event_name.contains(f" {semester} "),
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
        # COLLECT ALL UNIQUE EXAM IDS  (new — replaces single exam_id pick)
        # ------------------------------------------------------------------ #
        all_exam_ids = list({e.exam_id for e in entries})
        # e.g. [101, 102]  where 101 = B.Tech S4 (R), 102 = B.Tech S4 (S)

        # ------------------------------------------------------------------ #
        # STEP 1B: OVERWRITE EXISTING ALLOCATION IF ANY  (unchanged)
        # ------------------------------------------------------------------ #
        existing = (
            db.query(Allocation)
            .filter(Allocation.slot == slot, Allocation.semester == semester)
            .first()
        )
        if existing:
            db.query(SeatAllocation).filter(
                SeatAllocation.allocation_id == existing.id
            ).delete()
            db.query(Allocation).filter(Allocation.id == existing.id).delete()
            db.flush()

        # ------------------------------------------------------------------ #
        # STEP 2: GROUP AND SORT STUDENTS  (unchanged)
        # ------------------------------------------------------------------ #

        def extract_sort_key(reg_no: str):
            i = 0
            while i < len(reg_no) and not reg_no[i].isdigit():
                i += 1
            if i >= len(reg_no):
                return (reg_no, 0, 0)
            year = int(reg_no[i:i + 2])
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
        # STEP 3: BUILD MAPS  (unchanged)
        # ------------------------------------------------------------------ #
        regular_map = {}
        supply_map  = {}

        flat_regular = defaultdict(deque)
        for eid, courses in regular_groups.items():
            for cid, students in courses.items():
                flat_regular[cid].extend(students)

        for cid, students in flat_regular.items():
            regular_map[cid] = students

        for eid, courses in supply_groups.items():
            for cid, students in courses.items():
                supply_map[(eid, cid)] = students

        # ------------------------------------------------------------------ #
        # HELPERS  (unchanged)
        # ------------------------------------------------------------------ #

        def get_course_id(key):
            if isinstance(key, tuple):
                return key[1]
            return key

        def peek_exam_id(q):
            if not q:
                return None
            return q[0].exam_id

        def pick_best(active_map, exclude_course_ids=None,
                      restrict_course_ids=None, force=False):
            if exclude_course_ids is None:
                exclude_course_ids = set()
            best_key   = None
            best_count = 0
            for key, q in active_map.items():
                if not q:
                    continue
                cid = get_course_id(key)
                if restrict_course_ids is not None and cid not in restrict_course_ids:
                    continue
                if not force and cid in exclude_course_ids:
                    continue
                if len(q) > best_count:
                    best_count = len(q)
                    best_key   = key
            return best_key

        def count_active_course_ids(active_map):
            return len({get_course_id(k) for k, q in active_map.items() if q})

        def any_remaining(active_map):
            return any(len(q) > 0 for q in active_map.values())

        def total_remaining():
            return (
                sum(len(q) for q in regular_map.values()) +
                sum(len(q) for q in supply_map.values())
            )

        # ------------------------------------------------------------------ #
        # STEP 4A: FETCH ROOMS
        # ------------------------------------------------------------------ #
        date_sessions = list({(e.date, e.session) for e in entries})

        # ── CHANGED: join through allocation_exams instead of Allocation.exam_id ──
        conflicting_allocation_ids = (
            db.query(AllocationExam.allocation_id)
            .join(Exam, AllocationExam.exam_id == Exam.id)
            .join(Allocation, Allocation.id == AllocationExam.allocation_id)
            .filter(
                tuple_(Exam.date, Exam.session).in_(date_sessions),
                Allocation.semester != semester,
            )
            .distinct()
            .all()
        )
        conflicting_ids = [a.allocation_id for a in conflicting_allocation_ids]

        if conflicting_ids:
            used_room_ids = (
                db.query(SeatAllocation.room_id)
                .filter(SeatAllocation.allocation_id.in_(conflicting_ids))
                .distinct()
                .all()
            )
            used_room_ids = {r[0] for r in used_room_ids}
            rooms = (
                db.query(Room)
                .filter(
                    Room.id.notin_(used_room_ids),
                    Room.rows >= rows,
                    Room.cols >= cols,
                )
                .order_by(Room.id)
                .all()
            )
        else:
            rooms = (
                db.query(Room)
                .filter(
                    Room.rows >= rows,
                    Room.cols >= cols,
                )
                .order_by(Room.id)
                .all()
            )

        if not rooms:
            raise HTTPException(
                status_code=400,
                detail=f"No available rooms for {semester} Slot '{slot}'. "
                       f"All rooms are occupied by another semester on the same date and session."
            )

        # ------------------------------------------------------------------ #
        # STEP 4B: CREATE ALLOCATION + LINK ALL EXAM IDS
        # ── CHANGED: no exam_id on Allocation; insert AllocationExam rows ──
        # ------------------------------------------------------------------ #
        allocation = Allocation(slot=slot, semester=semester)
        db.add(allocation)
        db.flush()  # get allocation.id

        for eid in all_exam_ids:
            db.add(AllocationExam(allocation_id=allocation.id, exam_id=eid))
        db.flush()

        # ------------------------------------------------------------------ #
        # STEP 5: ALLOCATION LOOP  (completely unchanged)
        # ------------------------------------------------------------------ #
        seat_objects = []
        room_index   = 0

        def fill_column(room, col, chosen_key, active_map, last_col_cid,
                        only_one_subject, room_subjects=None):
            cur_key      = chosen_key
            last_used_cid = get_course_id(chosen_key)

            for row in range(rows):
                q = active_map.get(cur_key)

                if not q:
                    remaining_seats = rows - row
                    if remaining_seats <= 2:
                        break
                    if only_one_subject:
                        break

                    exclude = {get_course_id(cur_key)}
                    if last_col_cid is not None:
                        exclude.add(last_col_cid)

                    new_key = None
                    if room_subjects is not None:
                        new_key = pick_best(
                            active_map,
                            exclude_course_ids=exclude,
                            restrict_course_ids=room_subjects
                        )
                    if new_key is None:
                        new_key = pick_best(active_map, exclude_course_ids=exclude)
                    if new_key is None:
                        sole_key = None
                        cur_cid  = get_course_id(cur_key)
                        for k, dq in active_map.items():
                            if dq and get_course_id(k) != cur_cid:
                                sole_key = k
                                break
                        if sole_key is None:
                            break
                        new_key = sole_key

                    cur_key       = new_key
                    last_used_cid = get_course_id(cur_key)
                    q             = active_map.get(cur_key)
                    if not q:
                        break

                e = q.popleft()
                last_used_cid = get_course_id(cur_key)
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

            return last_used_cid

        def fill_rooms(active_map, supply_map_ref, start_ri, is_regular_phase):
            ri = start_ri

            while ri < len(rooms) and any_remaining(active_map):
                room = rooms[ri]
                ri  += 1

                last_col_cid = None

                p_key = pick_best(active_map)
                if p_key is None:
                    break
                p_cid = get_course_id(p_key)

                s_key = pick_best(active_map, exclude_course_ids={p_cid})
                s_cid = get_course_id(s_key) if s_key else None

                room_subjects = {p_cid}
                if s_cid is not None:
                    room_subjects.add(s_cid)

                col = 0
                while col < cols:
                    if not any_remaining(active_map):
                        break

                    alive_in_room = {
                        cid for cid in room_subjects
                        if any(
                            get_course_id(k) == cid and len(q) > 0
                            for k, q in active_map.items()
                        )
                    }

                    if len(alive_in_room) < len(room_subjects):
                        replacement = pick_best(
                            active_map, exclude_course_ids=room_subjects
                        )
                        if replacement is not None:
                            room_subjects = alive_in_room | {get_course_id(replacement)}
                        else:
                            room_subjects = alive_in_room

                    if count_active_course_ids(active_map) == 1:
                        chosen_key = pick_best(active_map)
                        if chosen_key is None:
                            break
                        fill_column(
                            room, col, chosen_key, active_map,
                            last_col_cid, only_one_subject=True,
                            room_subjects=None
                        )
                        last_col_cid = get_course_id(chosen_key)
                        col += 1
                        if any_remaining(active_map) and col < cols:
                            col += 1
                        continue

                    exclude = set()
                    if last_col_cid is not None:
                        exclude.add(last_col_cid)

                    chosen_key = pick_best(
                        active_map,
                        exclude_course_ids=exclude,
                        restrict_course_ids=room_subjects
                    )

                    if chosen_key is None:
                        col += 1
                        if col >= cols:
                            break
                        last_col_cid = None
                        chosen_key   = pick_best(
                            active_map,
                            restrict_course_ids=room_subjects,
                            force=True
                        )
                        if chosen_key is None:
                            break

                    if (
                        is_regular_phase
                        and supply_map_ref is not None
                        and last_col_cid is not None
                        and not isinstance(chosen_key, tuple)
                    ):
                        next_eid = peek_exam_id(active_map.get(chosen_key))
                        if next_eid is not None:
                            last_col_eid = None
                            for k, q in active_map.items():
                                if get_course_id(k) == last_col_cid and q:
                                    last_col_eid = peek_exam_id(q)
                                    break
                            if last_col_eid is not None and last_col_eid == next_eid:
                                supply_choice = None
                                for skey, sq in supply_map_ref.items():
                                    if not sq:
                                        continue
                                    if get_course_id(skey) in exclude:
                                        continue
                                    if peek_exam_id(sq) != next_eid:
                                        supply_choice = skey
                                        break
                                if supply_choice is not None:
                                    last_col_cid = fill_column(
                                        room, col, supply_choice,
                                        supply_map_ref, last_col_cid,
                                        only_one_subject=False,
                                        room_subjects=None
                                    )
                                    col += 1
                                    continue

                    last_col_cid = fill_column(
                        room, col, chosen_key, active_map,
                        last_col_cid, only_one_subject=False,
                        room_subjects=room_subjects
                    )
                    col += 1

            return ri

        room_index = fill_rooms(regular_map, supply_map, room_index, is_regular_phase=True)
        room_index = fill_rooms(supply_map,  None,        room_index, is_regular_phase=False)

        # ------------------------------------------------------------------ #
        # STEP 6: FINAL CHECK  (unchanged)
        # ------------------------------------------------------------------ #
        remaining = total_remaining()
        if remaining > 0:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Not enough rooms. {remaining} student(s) unallocated."
            )

        # ------------------------------------------------------------------ #
        # STEP 7: SAVE  (unchanged)
        # ------------------------------------------------------------------ #
        db.bulk_save_objects(seat_objects)
        db.commit()

        return {
            "success":        True,
            "message":        (
                f"Allocation completed for {semester} Slot {slot}. "
                f"Total students seated: {len(seat_objects)}"
            ),
            "allocation_id":  allocation.id,
            "exam_ids":       all_exam_ids,          # ← now returns both exam ids
            "total_rooms_used": room_index,
        }