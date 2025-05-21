# app/models/device.py
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class DeviceBase(BaseModel):
    """Base model for device operations"""
    unique_key: str = Field(..., description="Unique identifier for the device (e.g., MAC address or serial number)")
    name: Optional[str] = Field(None, description="Human-readable name for the device")
    type_code: Optional[str] = Field(None, description="Device type code, refers to device_types.type_code")


class DeviceCreate(DeviceBase):
    """Model for creating a new device"""
    pass


class DeviceUpdate(BaseModel):
    """Model for updating an existing device"""
    name: Optional[str] = Field(None, description="Human-readable name for the device")
    type_code: Optional[str] = Field(None, description="Type or category of device")
    unique_key: Optional[str] = Field(None, description="Unique identifier for the device")


class DeviceResponse(DeviceBase):
    """Model for device responses"""
    id: int = Field(..., description="Internal database ID")
    owner_id: int = Field(..., description="ID of the device owner")
    created_at: datetime = Field(..., description="When the device was registered")

    class Config:
        orm_mode = True

class DeviceDeregisterResponse(BaseModel):
    status: str
    message: str
    unique_key: str
    id: int # This is the internal DB id of the device