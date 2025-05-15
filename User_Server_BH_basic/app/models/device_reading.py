from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
class ReadingCreate(BaseModel):
    time: datetime
    humidity: Optional[float] = None
    light_intensity: Optional[float] = None
    temperature: Optional[float] = None

class ReadingResponse(BaseModel):
    device_id: int
    time: datetime
    humidity: Optional[float] = None
    light_intensity: Optional[float] = None
    temperature: Optional[float] = None

class BatchReadingCreate(BaseModel):
    readings: List[ReadingCreate] = Field(..., min_items=1)

class StatsResponse(BaseModel):
    device_id: int
    start_time: datetime
    end_time: datetime
    reading_count: int
    humidity: Optional[dict] = None
    light_intensity: Optional[dict] = None
    temperature: Optional[dict] = None
