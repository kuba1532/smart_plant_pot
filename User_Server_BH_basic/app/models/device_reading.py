# app/models/device_reading.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class ReadingCreate(BaseModel):
    time: datetime
    humidity: Optional[float] = None
    light_intensity: Optional[float] = None
    temperature: Optional[float] = None

class ReadingResponse(BaseModel):
    device_id: int # Refers to Device.id (FK in DeviceReading table)
    time: datetime
    humidity: Optional[float] = None
    light_intensity: Optional[float] = None
    temperature: Optional[float] = None
    time_difference_seconds: Optional[float] = Field(None, description="Time difference in seconds for nearest reading query")


    class Config:
        orm_mode = True

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

    class Config:
        orm_mode = True

class ReadingOperationResponse(BaseModel):
    status: str
    message: str
    device_id: int
    time: datetime
