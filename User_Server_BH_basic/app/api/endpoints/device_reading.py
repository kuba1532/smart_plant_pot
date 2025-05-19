# app/api/endpoints/clerk_webhooks.py
from datetime import datetime
from typing import List

from fastapi import APIRouter, Request, Depends, HTTPException, status, Header
from fastapi.param_functions import Path, Query, Body  # Add this import

from app.auth import get_current_user
from app.auth.device_auth import authorize_device
from app.auth.role_auth import authorize_role
from app.models.device_reading import ReadingResponse, ReadingCreate
from app.services.device_reading_service import DeviceReadingService

# Create router
router = APIRouter()

# Device reading endpoints
@router.get("/{device_id}/readings", response_model=List[ReadingResponse])
def get_device_readings(
        device_id: int = Path(..., description="The ID of the device"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    """Get all readings for a device"""
    authorize_device(user, device_id)
    return service.get_readings_by_device(device_id)


@router.get("/{device_id}/readings/latest", response_model=List[ReadingResponse])
def get_latest_readings(
        device_id: int = Path(..., description="The ID of the device"),
        limit: int = Query(10, ge=1, le=100, description="Number of latest readings to return"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    """Get the latest readings for a device"""
    authorize_device(user, device_id)
    return service.get_latest_readings(device_id, limit)


@router.get("/{device_id}/readings/nearest", response_model=ReadingResponse)
def get_nearest_reading(
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Query(..., description="The target timestamp"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    """Get the reading closest to the provided timestamp"""
    authorize_device(user, device_id)
    return service.get_reading_near_timestamp(device_id, timestamp)


@router.get("/{device_id}/readings/range", response_model=List[ReadingResponse])
def get_readings_in_range(
        device_id: int = Path(..., description="The ID of the device"),
        start: datetime = Query(..., description="Start of time range"),
        end: datetime = Query(..., description="End of time range"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    """Get readings within a specified time range"""
    authorize_device(user, device_id)
    return service.get_readings_in_time_range(device_id, start, end)


@router.get("/{device_id}/readings/stats")
def get_reading_stats(
        device_id: int = Path(..., description="The ID of the device"),
        start: datetime = Query(..., description="Start of time range"),
        end: datetime = Query(..., description="End of time range"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    """Get aggregated statistics for readings in a time range"""
    authorize_device(user, device_id)
    return service.get_aggregated_readings(device_id, start, end)


@router.get("/{device_id}/readings/{timestamp}", response_model=ReadingResponse)
def get_reading(
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Path(..., description="The timestamp of the reading"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    """Get a specific reading by device ID and timestamp"""
    authorize_device(user, device_id)
    return service.get_reading(device_id, timestamp)


@router.post("/{device_id}/readings", response_model=dict, status_code=201)
def create_reading(
        device_id: int = Path(..., description="The ID of the device"),
        reading: ReadingCreate = Body(...),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)

):
    authorize_role(user['sub'], "admin")
    """Create a new device reading"""
    return service.create_reading(
        device_id=device_id,
        time=reading.time,
        humidity=reading.humidity,
        light_intensity=reading.light_intensity,
        temperature=reading.temperature
    )


@router.put("/{device_id}/readings/{timestamp}", response_model=dict)
def update_reading(
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Path(..., description="The timestamp of the reading"),
        reading: ReadingCreate = Body(...),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_role(user, "admin")
    """Update a specific device reading"""
    # Ensure the timestamp in the URL matches the one in the body
    if timestamp != reading.time:
        raise HTTPException(status_code=400, detail="Timestamp in URL must match timestamp in body")

    return service.update_reading(
        device_id=device_id,
        time=reading.time,
        humidity=reading.humidity,
        light_intensity=reading.light_intensity,
        temperature=reading.temperature
    )


@router.delete("/{device_id}/readings/{timestamp}", response_model=dict)
def delete_reading(
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Path(..., description="The timestamp of the reading"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_role(user, "admin")
    """Delete a specific device reading"""
    return service.delete_reading(device_id, timestamp)

