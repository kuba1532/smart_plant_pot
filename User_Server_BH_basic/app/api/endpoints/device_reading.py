# app/api/endpoints/device_reading.py
# app/api/endpoints/device_reading.py
from datetime import datetime
from typing import List

from fastapi import APIRouter, Request, Depends, HTTPException, status, Header
from fastapi.param_functions import Path, Query, Body

from app.auth.dependencies import get_current_user
from app.auth.device_auth import authorize_device
from app.auth.role_auth import authorize_role
from app.models.device_reading import ReadingResponse, ReadingCreate, StatsResponse, ReadingOperationResponse
from app.services.device_reading_service import DeviceReadingService

router = APIRouter()

@router.get("/{device_id}/readings", response_model=List[ReadingResponse])
def get_device_readings(
        device_id: int = Path(..., description="The ID of the device"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_id)
    # Service returns List[DBDeviceReading], FastAPI converts using ReadingResponse.Config.orm_mode
    return service.get_readings_by_device(device_id)


@router.get("/{device_id}/readings/latest", response_model=List[ReadingResponse])
def get_latest_readings(
        device_id: int = Path(..., description="The ID of the device"),
        limit: int = Query(10, ge=1, le=100, description="Number of latest readings to return"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_id)
    # Service returns List[DBDeviceReading]
    return service.get_latest_readings(device_id, limit)


@router.get("/{device_id}/readings/nearest", response_model=ReadingResponse)
def get_nearest_reading(
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Query(..., description="The target timestamp"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_id)
    # Service now returns a ReadingResponse Pydantic model instance
    return service.get_reading_near_timestamp(device_id, timestamp)


@router.get("/{device_id}/readings/range", response_model=List[ReadingResponse])
def get_readings_in_range(
        device_id: int = Path(..., description="The ID of the device"),
        start: datetime = Query(..., description="Start of time range"),
        end: datetime = Query(..., description="End of time range"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_id)
    # Service returns List[DBDeviceReading]
    return service.get_readings_in_time_range(device_id, start, end)


@router.get("/{device_id}/readings/stats", response_model=StatsResponse)
def get_reading_stats(
        device_id: int = Path(..., description="The ID of the device"),
        start: datetime = Query(..., description="Start of time range"),
        end: datetime = Query(..., description="End of time range"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_id)
    # Service returns a dict matching StatsResponse
    return service.get_aggregated_readings(device_id, start, end)


@router.get("/{device_id}/readings/{timestamp}", response_model=ReadingResponse)
def get_reading(
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Path(..., description="The timestamp of the reading"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_id)
    # Service returns DBDeviceReading object
    return service.get_reading(device_id, timestamp)


@router.post("/{device_id}/readings", response_model=ReadingOperationResponse, status_code=201)
def create_reading_entry( # Renamed to avoid conflict with service method name
        device_id: int = Path(..., description="The ID of the device"),
        reading: ReadingCreate = Body(...),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_role(user['sub'], "admin") # Assuming user['sub'] is the clerk_id
    # Service returns a dict matching ReadingOperationResponse
    return service.create_reading(
        device_id=device_id,
        time=reading.time,
        humidity=reading.humidity,
        light_intensity=reading.light_intensity,
        temperature=reading.temperature
    )


@router.put("/{device_id}/readings/{timestamp}", response_model=ReadingOperationResponse)
def update_reading_entry( # Renamed
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Path(..., description="The timestamp of the reading"),
        reading: ReadingCreate = Body(...),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_role(user['sub'], "admin") # Assuming user['sub'] is the clerk_id
    if timestamp != reading.time:
        raise HTTPException(status_code=400, detail="Timestamp in URL must match timestamp in body")
    # Service returns a dict matching ReadingOperationResponse
    return service.update_reading(
        device_id=device_id,
        time=reading.time,
        humidity=reading.humidity,
        light_intensity=reading.light_intensity,
        temperature=reading.temperature
    )


@router.delete("/{device_id}/readings/{timestamp}", response_model=ReadingOperationResponse) # Changed to ReadingOperationResponse for consistency
def delete_reading_entry( # Renamed
        device_id: int = Path(..., description="The ID of the device"),
        timestamp: datetime = Path(..., description="The timestamp of the reading"),
        service: DeviceReadingService = Depends(),
        user=Depends(get_current_user)
):
    authorize_role(user['sub'], "admin") # Assuming user['sub'] is the clerk_id
    # Service returns a dict matching ReadingOperationResponse
    return service.delete_reading(device_id, timestamp)