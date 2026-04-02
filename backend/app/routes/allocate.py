from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.allocation_service import AllocationService
from app.schemas.entry_schema import AllocationRequest

router = APIRouter(prefix="/allocate", tags=["Allocation"])


@router.post("/")
def allocate_students(
    data: AllocationRequest,
    db: Session = Depends(get_db)
):
    try:
        result = AllocationService.allocate(data.slot, data.rows, data.cols, db)

        if not isinstance(result, dict):
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Invalid allocation response from service.",
                },
            )

        if "success" not in result:
            result["success"] = True
        if "message" not in result:
            result["message"] = "Allocation completed successfully."

        return JSONResponse(status_code=200, content=result)

    except HTTPException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": str(exc.detail),
            },
        )
    except Exception:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Unexpected error while allocating students.",
            },
        )