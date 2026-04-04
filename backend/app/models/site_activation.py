from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey
from app.db.database import Base

class SiteActivation(Base):
    __tablename__ = "site_activations"

    id            = Column(Integer, primary_key=True, index=True)
    allocation_id = Column(Integer, ForeignKey("allocations.id"), nullable=False)
    sem           = Column(String, nullable=False)
    slot          = Column(String, nullable=False)
    date          = Column(Date, nullable=False)
    start_time    = Column(Time, nullable=False)
    end_time      = Column(Time, nullable=False)
    time_gap      = Column(String, nullable=False)
    event_name    = Column(String, nullable=True)
    session       = Column(String, nullable=True)
    status        = Column(String, nullable=False, default="scheduled")