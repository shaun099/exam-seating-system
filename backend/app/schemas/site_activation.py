from datetime import date, time
from typing import Optional
from pydantic import BaseModel


class SiteActivationCreate(BaseModel):
    sem:        str
    slot:       str
    date:       date
    start_time: time
    end_time:   time
    time_gap:   str
    event_name: Optional[str] = None
    status:     Optional[str] = "scheduled"
    session:    Optional[str] = None


class SiteActivationResponse(SiteActivationCreate):
    id:            int
    allocation_id: int

    model_config = {"from_attributes": True}