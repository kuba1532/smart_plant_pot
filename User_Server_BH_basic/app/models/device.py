# app/models/device.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class DeviceBase(BaseModel):
    """Base model for device operations"""
    device_id: str = Field(..., description="Unique identifier for the device")
    name: Optional[str] = Field(None, description="Human-readable name for the device")
    type: Optional[str] = Field(None, description="Type or category of device")


class DeviceCreate(DeviceBase):
    """Model for creating a new device"""
    pass


class DeviceUpdate(BaseModel):
    """Model for updating an existing device"""
    name: Optional[str] = Field(None, description="Human-readable name for the device")
    type: Optional[str] = Field(None, description="Type or category of device")
    device_id: Optional[str] = Field(None, description="Unique identifier for the device")


class DeviceResponse(DeviceBase):
    """Model for device responses"""
    id: int = Field(..., description="Internal database ID")
    owner_id: int = Field(..., description="ID of the device owner")
    created_at: datetime = Field(..., description="When the device was registered")

    class Config:
        orm_mode = True