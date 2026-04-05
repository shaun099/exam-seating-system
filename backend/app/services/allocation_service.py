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
from sqlalchemy import tuple_


class AllocationService:

    @staticmethod
    def allocate(slot: str, semester: str, rows: int, cols: int, db: Session):
        """
        Allocate seating for a specific semester + slot.

        Rules:
        - Columns filled top to bottom, one at a time.
        - Each column holds only one subject (course_id).
        - No two adjacent columns may have the same course_id.
        - Regular and supply of the same course_id are separate groups —
          they cannot share a column or be in adjacent columns.
        - All regular students seated first. Exception: if next regular
          student shares exam_id with adjacent column and a supply student
          with a different exam_id exists, use that supply student early.
        - Mid-column switch: if subject runs out and more than 2 seats
          remain, switch to a different subject. If 2 or fewer, leave empty.
        - Each room is assigned exactly 2 subjects (the two with the most
          students at the time that room starts). Only those 2 alternate
          across columns in that room. If one runs out mid-room, the next
          largest available subject replaces it as the new partner.
        - One subject remaining globally: fill columns with one gap between.
          Mixing regular+supply of that subject in one column is allowed.
        - Adjacency fallback: if no different subject can start a new column,
          leave one gap then reuse same subject.
        - Adjacency resets between rooms.
        """

        # ------------------------------------------------------------------ #
        # STEP 1: FETCH ELIGIBLE STUDENTS
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
        # STEP 1B: OVERWRITE EXISTING ALLOCATION IF ANY
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
        # STEP 2: GROUP AND SORT STUDENTS
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
        # STEP 3: BUILD MAPS
        #
        # regular_map : course_id              -> deque of students
        # supply_map  : (exam_id, course_id)   -> deque of students
        #
        # We scan maps directly instead of using a heap to avoid stale
        # count bugs that caused students to be left unallocated.
        # ------------------------------------------------------------------ #
        regular_map = {}
        supply_map = {}

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
        # HELPERS
        # ------------------------------------------------------------------ #

        def get_course_id(key):
            """course_id from a regular key (int) or supply key (tuple)."""
            if isinstance(key, tuple):
                return key[1]
            return key

        def peek_exam_id(q):
            """exam_id of next student without removing from deque."""
            if not q:
                return None
            return q[0].exam_id

        def pick_best(active_map, exclude_course_ids=None,
                      restrict_course_ids=None, force=False):
            """
            Return the key with the most students, subject to:

            exclude_course_ids  : course_ids to skip (adjacency / same-subject).
            restrict_course_ids : if given, only consider keys whose course_id
                                  is in this set (used to enforce 2-per-room).
            force               : if True, ignore exclude_course_ids entirely.
                                  restrict_course_ids still applies.
            """
            if exclude_course_ids is None:
                exclude_course_ids = set()

            best_key = None
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
                    best_key = key

            return best_key

        def count_active_course_ids(active_map):
            """Number of distinct course_ids that still have students."""
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

        conflicting_allocation_ids = (
            db.query(Allocation.id)
            .join(Exam, Allocation.exam_id == Exam.id)
            .filter(
                tuple_(Exam.date, Exam.session).in_(date_sessions),
                Allocation.semester != semester,
            )
            .all()
        )
        conflicting_ids = [a.id for a in conflicting_allocation_ids]

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
        # STEP 4B: CREATE ALLOCATION RECORD
        # ------------------------------------------------------------------ #
        allocation_exam_id = entries[0].exam_id
        allocation = Allocation(
            exam_id=allocation_exam_id, slot=slot, semester=semester
        )
        db.add(allocation)
        db.flush()

        # ------------------------------------------------------------------ #
        # STEP 5: ALLOCATION LOOP
        # ------------------------------------------------------------------ #
        seat_objects = []
        room_index = 0

        # ------------------------------------------------------------------ #
        # fill_column: seat students in one column top to bottom
        # ------------------------------------------------------------------ #
        def fill_column(room, col, chosen_key, active_map, last_col_cid,
                        only_one_subject, room_subjects=None):
            """
            Fill a single column top to bottom starting with chosen_key.

            chosen_key      : key of the subject to start with.
            active_map      : map to pull students from.
            last_col_cid    : course_id of the previous column (used to
                              block same-subject mid-column switches).
            only_one_subject: True when only one subject exists globally —
                              no switching allowed.
            room_subjects   : set of course_ids assigned to this room. When
                              given, mid-column switches are restricted to
                              this set before falling back to any subject.

            Returns the course_id last used in this column.
            """
            cur_key = chosen_key
            last_used_cid = get_course_id(chosen_key)

            for row in range(rows):
                q = active_map.get(cur_key)

                if not q:
                    remaining_seats = rows - row
                    if remaining_seats <= 2:
                        # Too few seats — leave them empty
                        break

                    if only_one_subject:
                        # No other subject to switch to
                        break

                    # Build exclusion: must differ from cur subject AND
                    # last column's subject.
                    exclude = {get_course_id(cur_key)}
                    if last_col_cid is not None:
                        exclude.add(last_col_cid)

                    # First try within room_subjects
                    new_key = None
                    if room_subjects is not None:
                        new_key = pick_best(
                            active_map,
                            exclude_course_ids=exclude,
                            restrict_course_ids=room_subjects
                        )

                    # Fall back to any subject if room_subjects gave nothing
                    if new_key is None:
                        new_key = pick_best(
                            active_map,
                            exclude_course_ids=exclude
                        )

                    if new_key is None:
                        # Only one other subject exists but it matches last_col.
                        # Use it as absolute last resort (Rule 11).
                        sole_key = None
                        cur_cid = get_course_id(cur_key)
                        for k, dq in active_map.items():
                            if dq and get_course_id(k) != cur_cid:
                                sole_key = k
                                break
                        if sole_key is None:
                            break  # nothing left — stop column
                        new_key = sole_key

                    cur_key = new_key
                    last_used_cid = get_course_id(cur_key)
                    q = active_map.get(cur_key)
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

        # ------------------------------------------------------------------ #
        # fill_rooms: iterate rooms and columns for one phase
        # ------------------------------------------------------------------ #
        def fill_rooms(active_map, supply_map_ref, start_ri, is_regular_phase):
            """
            Fill rooms for one phase (regular or supply).

            active_map       : map being drained this phase.
            supply_map_ref   : supply_map for Rule 5 exception during regular
                               phase. Pass None for supply phase.
            start_ri         : room index to start from.
            is_regular_phase : True when processing regular students.

            At the start of each room, the 2 course_ids with the most
            students are assigned as the room pair. All column picks are
            restricted to that pair. If one runs out completely, the next
            largest subject replaces it as the new partner for that room.

            Returns updated room index.
            """
            ri = start_ri

            while ri < len(rooms) and any_remaining(active_map):
                room = rooms[ri]
                ri += 1

                last_col_cid = None  # adjacency resets each room

                # -------------------------------------------------------- #
                # Assign 2 subjects for this room.
                # Pick the largest, then the second largest (different cid).
                # -------------------------------------------------------- #
                p_key = pick_best(active_map)
                if p_key is None:
                    break
                p_cid = get_course_id(p_key)

                s_key = pick_best(active_map, exclude_course_ids={p_cid})
                s_cid = get_course_id(s_key) if s_key else None

                # room_subjects: course_ids allowed in this room
                room_subjects = {p_cid}
                if s_cid is not None:
                    room_subjects.add(s_cid)

                col = 0
                while col < cols:
                    if not any_remaining(active_map):
                        break

                    # ---------------------------------------------------- #
                    # Refresh room_subjects: if a subject ran out, replace it
                    # with the next largest subject not already in the room.
                    # ---------------------------------------------------- #
                    alive_in_room = {
                        cid for cid in room_subjects
                        if any(
                            get_course_id(k) == cid and len(q) > 0
                            for k, q in active_map.items()
                        )
                    }

                    if len(alive_in_room) < len(room_subjects):
                        # One subject exhausted — bring in a replacement
                        replacement = pick_best(
                            active_map,
                            exclude_course_ids=room_subjects
                        )
                        if replacement is not None:
                            room_subjects = alive_in_room | {
                                get_course_id(replacement)
                            }
                        else:
                            # No replacement outside room — use what is alive
                            room_subjects = alive_in_room

                    # ---------------------------------------------------- #
                    # ONE SUBJECT REMAINING globally — gap rule.
                    # ---------------------------------------------------- #
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

                        # Skip one gap column if students remain and space exists
                        if any_remaining(active_map) and col < cols:
                            col += 1

                        continue

                    # ---------------------------------------------------- #
                    # NORMAL CASE: pick from room_subjects, avoid last col.
                    # ---------------------------------------------------- #
                    exclude = set()
                    if last_col_cid is not None:
                        exclude.add(last_col_cid)

                    chosen_key = pick_best(
                        active_map,
                        exclude_course_ids=exclude,
                        restrict_course_ids=room_subjects
                    )

                    if chosen_key is None:
                        # Both room subjects blocked by adjacency.
                        # Leave a gap column then retry without exclusion.
                        col += 1  # gap
                        if col >= cols:
                            break
                        last_col_cid = None  # gap resets adjacency
                        chosen_key = pick_best(
                            active_map,
                            restrict_course_ids=room_subjects,
                            force=True
                        )
                        if chosen_key is None:
                            break

                    # ---------------------------------------------------- #
                    # RULE 5 EXCEPTION (regular phase only)
                    # If next regular student shares exam_id with last
                    # column's students and a supply student with a different
                    # exam_id exists, seat that supply student early.
                    # ---------------------------------------------------- #
                    if (
                        is_regular_phase
                        and supply_map_ref is not None
                        and last_col_cid is not None
                        and not isinstance(chosen_key, tuple)  # is regular key
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

                    # ---------------------------------------------------- #
                    # FILL THE COLUMN normally
                    # ---------------------------------------------------- #
                    last_col_cid = fill_column(
                        room, col, chosen_key, active_map,
                        last_col_cid, only_one_subject=False,
                        room_subjects=room_subjects
                    )
                    col += 1

            return ri

        # ------------------------------------------------------------------ #
        # RUN PHASE 1: REGULAR STUDENTS
        # ------------------------------------------------------------------ #
        room_index = fill_rooms(
            regular_map,
            supply_map,
            room_index,
            is_regular_phase=True
        )

        # ------------------------------------------------------------------ #
        # RUN PHASE 2: SUPPLY STUDENTS
        # ------------------------------------------------------------------ #
        room_index = fill_rooms(
            supply_map,
            None,
            room_index,
            is_regular_phase=False
        )

        # ------------------------------------------------------------------ #
        # STEP 6: FINAL CHECK
        # ------------------------------------------------------------------ #
        remaining = total_remaining()
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
            "message": (
                f"Allocation completed for {semester} Slot {slot}. "
                f"Total students seated: {len(seat_objects)}"
            ),
            "allocation_id": allocation.id,
            "total_rooms_used": room_index,
        }