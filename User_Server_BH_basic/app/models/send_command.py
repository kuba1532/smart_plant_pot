from pydantic import BaseModel, Field
from datetime import datetime, time

class SendCommandCreate(BaseModel):
    water_for: time = Field(..., alias="waterFor")
    illuminate_for: time = Field(..., alias="illuminateFor")
    device_id: int = Field(..., alias="deviceId")

    class Config:
        allow_population_by_field_name = True

class SendCommandOutput(BaseModel):
    result: str
    updated_at: datetime