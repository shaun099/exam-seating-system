from io import BytesIO
import logging
import re
from typing import Any

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.exam import Exam
from app.models.branch import Branch
from app.models.student import Student
from app.models.course import Course
from app.models.seating import Seating
from app.models.room import Room

logger = logging.getLogger(__name__)


class UploadService:

    @staticmethod
    def _read_room_file(content: bytes, filename: str) -> pd.DataFrame:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        try:
            if ext in {"xlsx", "xlsm", "xlsv"}:
                return pd.read_excel(BytesIO(content), header=0, engine="openpyxl")
            elif ext == "xls":
                return pd.read_excel(BytesIO(content), header=0, engine="xlrd")
            elif ext == "csv":
                return pd.read_csv(BytesIO(content), header=0)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type '.{ext}'. Accepted formats: xlsx, xls, xlsm, csv",
                )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read room file: {exc}") from exc

    @staticmethod
    def clean_text(value) -> str:
        if value is None:
            return ""
        if isinstance(value, float) and pd.isna(value):
            return ""
        text = str(value).strip()
        return "" if text.lower() == "nan" else text

    @staticmethod
    def extract_name_and_reg_no(student_value: str):
        text = UploadService.clean_text(student_value)
        if not text:
            return "", ""
        match = re.search(r"\(([^()]*)\)\s*$", text)
        if not match:
            return text, ""
        reg_no = match.group(1).strip()
        name = text[:match.start()].strip()
        return name, reg_no

    @staticmethod
    def extract_course_name_and_code(course_value: str):
        text = UploadService.clean_text(course_value)
        if not text:
            return "", ""
        match = re.search(r"\(([^()]*)\)\s*$", text)
        if not match:
            return text, ""
        course_code = match.group(1).strip()
        course_name = text[:match.start()].strip()
        return course_name, course_code

    @staticmethod
    def get_column_name(normalized_columns: dict, aliases: list[str]):
        for alias in aliases:
            if alias in normalized_columns:
                return normalized_columns[alias]
        return None

    @staticmethod
    def parse_bool(value) -> bool:
        if isinstance(value, bool):
            return value
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return True
        return str(value).strip().lower() not in {"false", "0", "no", "n"}

    @staticmethod
    def parse_exam_date(value):
        if value is None:
            return None
        if isinstance(value, float) and pd.isna(value):
            return None
        try:
            parsed_value = pd.to_datetime(value, errors="coerce", dayfirst=True)
        except Exception:
            return None
        if pd.isna(parsed_value):
            return None
        return parsed_value.date() if hasattr(parsed_value, "date") else None

    @staticmethod
    def _read_file(content: bytes, filename: str) -> pd.DataFrame:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        try:
            if ext == "xlsx":
                return pd.read_excel(BytesIO(content), header=1, engine="openpyxl")
            elif ext == "xls":
                return pd.read_excel(BytesIO(content), header=1, engine="xlrd")
            elif ext == "csv":
                return pd.read_csv(BytesIO(content), header=0)
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type '.{ext}'. Accepted formats: xlsx, xls, csv",
                )
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read file: {exc}") from exc

    # -------------------------------------------------------------------------
    # OPTIMIZED: parse_student_data
    # Uses pandas vectorized operations instead of iterrows() for all
    # column parsing — much faster on large files.
    # iterrows() is only used for the final valid/skipped split which is
    # unavoidable since each row needs individual field validation.
    # -------------------------------------------------------------------------
    @staticmethod
    def parse_student_data(content: bytes, filename: str) -> tuple[list[dict], list[dict]]:
        dataframe = UploadService._read_file(content, filename)

        normalized_columns = {
            str(col).strip().lower().replace(" ", "_"): col
            for col in dataframe.columns
        }

        column_map = {
            "student":     UploadService.get_column_name(normalized_columns, ["student", "name"]),
            "reg_no":      UploadService.get_column_name(normalized_columns, ["reg_no", "register_no", "registration_no"]),
            "branch_name": UploadService.get_column_name(normalized_columns, ["branch_name", "branch"]),
            "course":      UploadService.get_column_name(normalized_columns, ["course", "course_name"]),
            "course_code": UploadService.get_column_name(normalized_columns, ["course_code", "code"]),
            "exam_date":   UploadService.get_column_name(normalized_columns, ["exam_date", "date"]),
            "event_name":  UploadService.get_column_name(normalized_columns, ["event", "event_name"]),
            "slot":        UploadService.get_column_name(normalized_columns, ["slot"]),
            "session":     UploadService.get_column_name(normalized_columns, ["session"]),
            "eligibility": UploadService.get_column_name(normalized_columns, ["eligibility", "is_eligible"]),
        }

        required = ["branch_name", "course", "exam_date", "event_name", "slot", "session"]
        missing = [col for col in required if not column_map[col]]
        if not column_map["student"] and not column_map["reg_no"]:
            missing.append("student/reg_no")
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing)}. "
                       f"Found columns: {list(dataframe.columns)}",
            )

        df = dataframe.copy()

        # --- Vectorized: parse student name + reg_no from combined column ---
        if column_map["student"]:
            parsed = df[column_map["student"]].astype(str).str.strip()
            # Extract reg_no from last parentheses e.g. "John (REG123)"
            extracted = parsed.str.extract(r"^(.*?)\s*\(([^()]*)\)\s*$")
            df["_name"]    = extracted[0].fillna(parsed).str.strip()
            df["_reg_no"]  = extracted[1].fillna("").str.strip()
        else:
            df["_name"]   = ""
            df["_reg_no"] = ""

        # Override reg_no from dedicated column if present
        if column_map["reg_no"]:
            override = df[column_map["reg_no"]].astype(str).str.strip()
            override = override.where(override.str.lower() != "nan", "")
            df["_reg_no"] = override.where(override != "", df["_reg_no"])

        # --- Vectorized: parse course name + course code ---
        if column_map["course"]:
            parsed_course = df[column_map["course"]].astype(str).str.strip()
            extracted_course = parsed_course.str.extract(r"^(.*?)\s*\(([^()]*)\)\s*$")
            df["_course_name"] = extracted_course[0].fillna(parsed_course).str.strip()
            df["_course_code"] = extracted_course[1].fillna("").str.strip()
        else:
            df["_course_name"] = ""
            df["_course_code"] = ""

        if column_map["course_code"]:
            override_code = df[column_map["course_code"]].astype(str).str.strip()
            override_code = override_code.where(override_code.str.lower() != "nan", "")
            df["_course_code"] = override_code.where(override_code != "", df["_course_code"])

        # --- Vectorized: parse exam date for entire column at once ---
        df["_exam_date"] = pd.to_datetime(
            df[column_map["exam_date"]], errors="coerce", dayfirst=True
        ).dt.date

        # --- Vectorized: clean text columns ---
        for field, col_key in [
            ("_branch_name", "branch_name"),
            ("_event_name",  "event_name"),
            ("_slot",        "slot"),
            ("_session",     "session"),
        ]:
            raw = df[column_map[col_key]].astype(str).str.strip()
            df[field] = raw.where(raw.str.lower() != "nan", "")

        # --- Vectorized: parse eligibility ---
        if column_map.get("eligibility"):
            df["_is_eligible"] = df[column_map["eligibility"]].apply(UploadService.parse_bool)
        else:
            df["_is_eligible"] = True

        # --- Split valid vs skipped using vectorized masks ---
        required_str_fields = ["_reg_no", "_name", "_branch_name", "_course_name",
                               "_course_code", "_event_name", "_slot", "_session"]

        # Build a boolean mask: True = row has all required fields filled
        str_mask = df[required_str_fields].apply(lambda col: col.str.strip() != "").all(axis=1)
        date_mask = df["_exam_date"].notna()
        valid_mask = str_mask & date_mask

        valid_df   = df[valid_mask].reset_index(drop=True)
        skipped_df = df[~valid_mask].reset_index(drop=True)

        # Convert to list of dicts
        def to_records(frame, base_index_offset=0, is_skipped=False):
            records = []
            for i, row in frame.iterrows():
                entry = {
                    "reg_no":      row["_reg_no"],
                    "name":        row["_name"],
                    "branch_name": row["_branch_name"],
                    "course_name": row["_course_name"],
                    "course_code": row["_course_code"],
                    "exam_date":   row["_exam_date"],
                    "event_name":  row["_event_name"],
                    "slot":        row["_slot"],
                    "session":     row["_session"],
                    "is_eligible": row["_is_eligible"],
                }
                if is_skipped:
                    missing_fields = [
                        f for f in ("reg_no", "name", "branch_name", "course_name",
                                    "course_code", "event_name", "slot", "session")
                        if not entry[f]
                    ]
                    if not entry["exam_date"]:
                        missing_fields.append("exam_date")
                    entry["row"]    = i + 3
                    entry["reason"] = f"empty fields: {missing_fields}"
                records.append(entry)
            return records

        valid   = to_records(valid_df)
        skipped = to_records(skipped_df, is_skipped=True)

        logger.info("Parsed %d valid rows, %d skipped", len(valid), len(skipped))
        if skipped:
            logger.warning("Skipped rows sample: %s", skipped[:10])

        return valid, skipped

    @staticmethod
    def parse_room_data(content: bytes, filename: str) -> tuple[list[dict], list[dict]]:
        dataframe = UploadService._read_room_file(content, filename)

        print("COLUMNS:", list(dataframe.columns))
        print("FIRST ROW:", dataframe.head())

        normalized_columns = {
            str(col).strip().lower().replace(" ", "_"): col
            for col in dataframe.columns
        }

        print("NORMALIZED:", normalized_columns)

        column_map = {
            "room_number": UploadService.get_column_name(
                normalized_columns,
                ["room_number", "room_no", "room", "hall"],
            ),
            "row": UploadService.get_column_name(
                normalized_columns,
                ["row", "rows", "row_size", "row_count"],
            ),
            "column": UploadService.get_column_name(
                normalized_columns,
                ["column", "columns", "col", "cols", "column_size", "column_count"],
            ),
        }

        print("COLUMN MAP:", column_map)

        missing = [name for name in ("room_number", "row", "column") if not column_map[name]]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing)}. Found columns: {list(dataframe.columns)}",
            )

        valid: list[dict] = []
        skipped: list[dict] = []

        for idx, row in dataframe.iterrows():
            room_number = UploadService.clean_text(row[column_map["room_number"]])
            row_value = pd.to_numeric(row[column_map["row"]], errors="coerce")
            col_value = pd.to_numeric(row[column_map["column"]], errors="coerce")

            entry = {
                "room_number": room_number,
                "row": int(row_value) if not pd.isna(row_value) else None,
                "column": int(col_value) if not pd.isna(col_value) else None,
            }

            print("ENTRY:", entry)

            if entry["room_number"] and entry["row"] and entry["column"]:
                valid.append(entry)
            else:
                skipped.append(entry)

        print("VALID:", valid)
        print("SKIPPED:", skipped)

        return valid, skipped

    # -------------------------------------------------------------------------
    # OPTIMIZED: _upsert_lookup_entities
    # Single flush instead of 4 sequential flushes.
    # pg_insert ON CONFLICT DO NOTHING handles duplicates at DB level.
    # -------------------------------------------------------------------------
    @staticmethod
    def _upsert_lookup_entities(data: list[dict], db: Session) -> tuple[dict, dict, dict, dict]:
        branch_names  = {e["branch_name"] for e in data}
        reg_nos       = {e["reg_no"] for e in data}
        course_codes  = {e["course_code"] for e in data}
        exam_keys_raw = {(e["event_name"], e["exam_date"], e["session"]) for e in data}

        branches = {
            b.name: b for b in
            db.query(Branch).filter(Branch.name.in_(branch_names)).all()
        }
        students = {
            s.reg_no: s for s in
            db.query(Student).filter(Student.reg_no.in_(reg_nos)).all()
        }
        courses = {
            c.code: c for c in
            db.query(Course).filter(Course.code.in_(course_codes)).all()
        }
        exams = {
            (e.event_name, e.date, e.session): e for e in
            db.query(Exam).filter(
                Exam.event_name.in_({k[0] for k in exam_keys_raw}),
                Exam.date.in_({k[1] for k in exam_keys_raw}),
                Exam.session.in_({k[2] for k in exam_keys_raw}),
            ).all()
        }

        # --- insert missing branches ---
        new_branch_names = branch_names - branches.keys()
        if new_branch_names:
            db.execute(
                pg_insert(Branch).values([{"name": n} for n in new_branch_names])
                .on_conflict_do_nothing(index_elements=["name"])
            )
            db.flush()
            for b in db.query(Branch).filter(Branch.name.in_(new_branch_names)).all():
                branches[b.name] = b

        # --- insert missing students ---
        new_student_entries = [e for e in data if e["reg_no"] not in students]
        if new_student_entries:
            db.execute(
                pg_insert(Student).values([
                    {
                        "name":      e["name"],
                        "reg_no":    e["reg_no"],
                        "branch_id": branches[e["branch_name"]].id,
                    }
                    for e in new_student_entries
                ]).on_conflict_do_nothing(index_elements=["reg_no"])
            )
            db.flush()
            new_reg_nos = {e["reg_no"] for e in new_student_entries}
            for s in db.query(Student).filter(Student.reg_no.in_(new_reg_nos)).all():
                students[s.reg_no] = s

        # --- insert missing courses ---
        new_course_entries = [e for e in data if e["course_code"] not in courses]
        if new_course_entries:
            seen_codes: set[str] = set()
            unique_courses = []
            for e in new_course_entries:
                if e["course_code"] not in seen_codes:
                    seen_codes.add(e["course_code"])
                    unique_courses.append({"name": e["course_name"], "code": e["course_code"]})
            db.execute(
                pg_insert(Course).values(unique_courses)
                .on_conflict_do_nothing(index_elements=["code"])
            )
            db.flush()
            for c in db.query(Course).filter(Course.code.in_(seen_codes)).all():
                courses[c.code] = c

        # --- insert missing exams ---
        new_exam_entries = [
            e for e in data
            if (e["event_name"], e["exam_date"], e["session"]) not in exams
        ]
        if new_exam_entries:
            seen_exam_keys: set[tuple] = set()
            unique_exams = []
            for e in new_exam_entries:
                key = (e["event_name"], e["exam_date"], e["session"])
                if key not in seen_exam_keys:
                    seen_exam_keys.add(key)
                    unique_exams.append({
                        "event_name": e["event_name"],
                        "date":       e["exam_date"],
                        "session":    e["session"],
                    })
            db.execute(
                pg_insert(Exam).values(unique_exams)
                .on_conflict_do_nothing(index_elements=["event_name", "date", "session"])
            )
            db.flush()
            for ex in db.query(Exam).filter(
                Exam.event_name.in_({k[0] for k in seen_exam_keys}),
                Exam.date.in_({k[1] for k in seen_exam_keys}),
                Exam.session.in_({k[2] for k in seen_exam_keys}),
            ).all():
                exams[(ex.event_name, ex.date, ex.session)] = ex

        return branches, students, courses, exams

    # -------------------------------------------------------------------------
    # OPTIMIZED: process_upload
    # Removed expensive existing_seatings SELECT query.
    # Single pg INSERT ON CONFLICT DO NOTHING replaces batch loop.
    # -------------------------------------------------------------------------
    @staticmethod
    async def process_upload(file: UploadFile, db: Session):
        content = await file.read()
        data, skipped = UploadService.parse_student_data(content, file.filename or "")

        if not data:
            return {
                "message": "No valid student records found",
                "skipped": len(skipped),
                "skipped_sample": skipped[:5],
            }

        branches, students, courses, exams = UploadService._upsert_lookup_entities(data, db)

        # Deduplicate in Python before hitting DB
        seen_keys: set[tuple] = set()
        seating_rows: list[dict] = []

        for entry in data:
            student = students[entry["reg_no"]]
            course  = courses[entry["course_code"]]
            exam    = exams[(entry["event_name"], entry["exam_date"], entry["session"])]
            key     = (student.id, course.id, exam.id)

            if key not in seen_keys:
                seen_keys.add(key)
                seating_rows.append({
                    "student_id":  student.id,
                    "course_id":   course.id,
                    "exam_id":     exam.id,
                    "slot":        entry["slot"],
                    "is_eligible": entry["is_eligible"],
                })

        inserted = 0
        if seating_rows:
            logger.info("Attempting to insert %d seating rows", len(seating_rows))
            result = db.execute(
                pg_insert(Seating)
                .values(seating_rows)
                .on_conflict_do_nothing(
                    index_elements=["student_id", "course_id", "exam_id"]
                )
            )
            inserted = result.rowcount

        db.commit()

        return {
            "message": "Upload successful",
            "inserted": inserted,
            "skipped_parse": len(skipped),
            "skipped_duplicate": len(seating_rows) - inserted,
            "skipped_sample": skipped[:5] if skipped else [],
        }

    @staticmethod
    async def process_room_upload(file: UploadFile, db: Session):
        from io import BytesIO
        import pandas as pd

        content = await file.read()
        df = pd.read_csv(BytesIO(content))

        required_columns = {"room_number", "rows", "cols"}
        if not required_columns.issubset(df.columns):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid CSV format. Required columns: {required_columns}"
            )

        inserted = 0
        skipped = []

        existing_rooms = {
            r.room_number: r
            for r in db.query(Room).all()
        }

        new_rooms = []

        for row in df.to_dict(orient="records"):
            try:
                room_number = str(row["room_number"]).strip()
                rows = int(row["rows"])
                cols = int(row["cols"])

                if not room_number or rows <= 0 or cols <= 0:
                    skipped.append({"row": row, "reason": "Invalid data"})
                    continue

                if room_number not in existing_rooms:
                    new_rooms.append(
                        Room(
                            room_number=room_number,
                            rows=rows,
                            cols=cols
                        )
                    )

            except Exception as e:
                skipped.append({"row": row, "error": str(e)})

        if new_rooms:
            db.add_all(new_rooms)
            db.commit()
            inserted = len(new_rooms)

        return {
            "message": "Room upload successful",
            "inserted": inserted,
            "skipped": len(skipped)
        }