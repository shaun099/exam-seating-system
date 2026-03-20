from io import BytesIO
import logging
import re
from typing import Any

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.models.branch import Branch
from app.models.student import Student
from app.models.course import Course
from app.models.seating import Seating

logger = logging.getLogger(__name__)


class UploadService:

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
    def _read_file(content: bytes, filename: str) -> pd.DataFrame:
        """
        Route to the correct pandas reader based on file extension.
          .xlsx  -> openpyxl  (zip-based Office Open XML)
          .xls   -> xlrd      (legacy binary format, requires xlrd>=1.0)
          .csv   -> read_csv  (plain text, no metadata row so header=0)
        header=1 is applied to Excel formats only, since your files have
        a metadata row at row 0 and column headers at row 1.
        CSV files are assumed to have column headers on the first row.
        """
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

    @staticmethod
    def parse_student_data(content: bytes, filename: str) -> tuple[list[dict], list[dict]]:
        """
        Returns (valid_rows, skipped_rows) so callers can log/report
        exactly what was dropped and why.
        """
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

        valid: list[dict] = []
        skipped: list[dict] = []

        for idx, row in dataframe.iterrows():
            row_num = idx + 3  # human-readable: +1 for 0-index, +1 for header row 0, +1 for header row 1

            student_name, reg_no = "", ""
            if column_map["student"]:
                student_name, reg_no = UploadService.extract_name_and_reg_no(
                    row[column_map["student"]]
                )
            if column_map["reg_no"]:
                reg_no = UploadService.clean_text(row[column_map["reg_no"]]) or reg_no

            course_name, course_code = "", ""
            if column_map["course"]:
                course_name, course_code = UploadService.extract_course_name_and_code(
                    row[column_map["course"]]
                )
            if column_map["course_code"]:
                course_code = UploadService.clean_text(row[column_map["course_code"]]) or course_code

            exam_date_parsed = pd.to_datetime(row[column_map["exam_date"]], errors="coerce")
            exam_date = exam_date_parsed.date() if not pd.isna(exam_date_parsed) else None

            entry: dict[str, Any] = {
                "reg_no":      reg_no,
                "name":        student_name,
                "branch_name": UploadService.clean_text(row[column_map["branch_name"]]),
                "course_name": course_name,
                "course_code": course_code,
                "exam_date":   exam_date,
                "event_name":  UploadService.clean_text(row[column_map["event_name"]]),
                "slot":        UploadService.clean_text(row[column_map["slot"]]),
                "session":     UploadService.clean_text(row[column_map["session"]]),
                "is_eligible": UploadService.parse_bool(
                    row.get(column_map.get("eligibility"), True)
                ),
            }

            missing_fields = [
                f for f in ("reg_no", "name", "branch_name", "course_name",
                            "course_code", "event_name", "slot", "session")
                if not entry[f]
            ]
            if not entry["exam_date"]:
                missing_fields.append("exam_date")

            if missing_fields:
                skipped.append({"row": row_num, "reason": f"empty fields: {missing_fields}", **entry})
            else:
                valid.append(entry)

        logger.info("Parsed %d valid rows, %d skipped", len(valid), len(skipped))
        if skipped:
            logger.warning("Skipped rows sample: %s", skipped[:10])

        return valid, skipped

    @staticmethod
    def _upsert_lookup_entities(data: list[dict], db: Session) -> tuple[dict, dict, dict, dict]:
        """
        Load existing lookup entities with scoped IN queries,
        then create only the missing ones. Avoids SELECT * on large tables.
        """
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

        for name in branch_names - branches.keys():
            b = Branch(name=name)
            db.add(b)
            branches[name] = b
        db.flush()

        for entry in data:
            reg = entry["reg_no"]
            if reg not in students:
                branch = branches[entry["branch_name"]]
                s = Student(name=entry["name"], reg_no=reg, branch_id=branch.id)
                db.add(s)
                students[reg] = s
        db.flush()

        for entry in data:
            code = entry["course_code"]
            if code not in courses:
                c = Course(name=entry["course_name"], code=code)
                db.add(c)
                courses[code] = c
        db.flush()

        for entry in data:
            key = (entry["event_name"], entry["exam_date"], entry["session"])
            if key not in exams:
                e = Exam(
                    event_name=entry["event_name"],
                    date=entry["exam_date"],
                    session=entry["session"],
                )
                db.add(e)
                exams[key] = e
        db.flush()

        return branches, students, courses, exams

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

        # Scope the dedup query only to student/exam IDs present in this upload
        student_ids = {s.id for s in students.values()}
        exam_ids    = {e.id for e in exams.values()}

        existing_seatings = {
            (s.student_id, s.course_id, s.exam_id)
            for s in db.query(Seating)
            .filter(
                Seating.student_id.in_(student_ids),
                Seating.exam_id.in_(exam_ids),
            )
            .all()
        }

        new_seating_rows: list[dict] = []

        for entry in data:
            student = students[entry["reg_no"]]
            course  = courses[entry["course_code"]]
            exam    = exams[(entry["event_name"], entry["exam_date"], entry["session"])]
            key     = (student.id, course.id, exam.id)

            if key not in existing_seatings:
                new_seating_rows.append({
                    "student_id":  student.id,
                    "course_id":   course.id,
                    "exam_id":     exam.id,
                    "slot":        entry["slot"],
                    "is_eligible": entry["is_eligible"],
                })
                existing_seatings.add(key)

        if new_seating_rows:
            logger.info("Attempting to insert %d new seating rows", len(new_seating_rows))
            BATCH_SIZE = 500
            for i in range(0, len(new_seating_rows), BATCH_SIZE):
                batch = new_seating_rows[i : i + BATCH_SIZE]
                db.bulk_insert_mappings(Seating, batch)
                db.flush()

        db.commit()

        return {
            "message": "Upload successful",
            "inserted": len(new_seating_rows),
            "skipped_parse": len(skipped),
            "skipped_duplicate": len(data) - len(new_seating_rows),
            "skipped_sample": skipped[:5] if skipped else [],
        }