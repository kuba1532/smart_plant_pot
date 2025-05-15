from pydantic import BaseModel, Field
from datetime import datetime, time

class ChangeSettingsCreate(BaseModel):
    max_humidity: float = Field(..., alias="maxHumidity")
    min_humidity: float = Field(..., alias="minHumidity")
    max_brightness: float = Field(..., alias="maxBrightness")
    min_brightness: float = Field(..., alias="minBrightness")
    bright_period_start: time = Field(..., alias="brightPeriodStart")
    bright_period_end: time = Field(..., alias="brightPeriodEnd")
    device_id: int = Field(..., alias="deviceId")

    class Config:
        allow_population_by_field_name = True

class ChangeSettingsOutput(BaseModel):
    result: str
    updated_at: datetime