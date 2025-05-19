# app/api/endpoints/devices.py
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from fastapi.responses import JSONResponse

from app.auth import get_current_user
from app.auth.device_auth import authorize_device
from app.auth.role_auth import authorize_role
from app.models.device import DeviceCreate, DeviceResponse, DeviceUpdate
from app.services.device_service import DeviceService
from app.services.user_service import UserService
from app.utils.device_authentication import validate_device_id

# Create router
router = APIRouter()


# Device endpoints
@router.post("", response_model=Dict[str, Any], status_code=201)
async def register_device(
        device: DeviceCreate = Body(...),
        owner_id: int = Query(..., description="The ID of the device owner"),
        service: DeviceService = Depends(),
        user=Depends(get_current_user)
):
    """Register a new device or retrieve existing device"""
    if not validate_device_id(device.device_id, device.type):
        raise HTTPException(
            status_code=403,
            detail=f"Invalid device_id or type"
        )

    return await service.register_device(device.dict(), owner_id)


@router.get("/{id}", response_model=Dict[str, Any])
async def get_device(
        id: int = Path(..., description="The ID of the device"),
        service: DeviceService = Depends(),
        user=Depends(get_current_user)
):
    """Get details for a specific device"""
    authorize_device(user, id)
    return await service.get_device_details(id)


@router.put("/{id}", response_model=Dict[str, Any])
async def update_device(
        id: int = Path(..., description="The ID of the device"),
        device: DeviceUpdate = Body(...),
        service: DeviceService = Depends(),
        user=Depends(get_current_user)
):
    """Update a device's information"""
    authorize_device(user, id)
    return await service.update_device_info(id, device.dict(exclude_unset=True))


@router.delete("/{id}", response_model=Dict[str, Any])
async def deregister_device(
        id: int = Path(..., description="The ID of the device"),
        service: DeviceService = Depends(),
        user = Depends(get_current_user)

):
    """Deregister a device"""
    authorize_device(user, id)
    return await service.deregister_device(id)


@router.get("/user/{owner_id}", response_model=List[Dict[str, Any]])
async def get_user_devices(
        owner_id: int = Path(..., description="The ID of the user"),
        service: DeviceService = Depends(),
        user = Depends(get_current_user)
):
    """Get all devices belonging to a specific user"""
    return await service.get_user_devices(owner_id)

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_devices(
        service: DeviceService = Depends(),
        user = Depends(get_current_user)
):
    """Get all devices belonging to a specific user"""
    authorize_role(user, "admin")
    return await service.get_all_devices()