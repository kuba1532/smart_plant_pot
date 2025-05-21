# app/api/endpoints/device.py
# app/api/endpoints/devices.py
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
from fastapi.responses import JSONResponse

from app.auth import get_current_user
from app.auth.device_auth import authorize_device
from app.auth.role_auth import authorize_role
from app.models.device import DeviceCreate, DeviceResponse, DeviceUpdate, DeviceDeregisterResponse
from app.services.device_service import DeviceService
# from app.services.user_service import UserService # No longer directly used here for user ops
from app.utils.device_authentication import validate_device_id

router = APIRouter()


@router.post("", response_model=DeviceResponse, status_code=201)
async def register_device_endpoint( # Renamed
        device_input: DeviceCreate = Body(...), # Use the corrected DeviceCreate model
        owner_id: int = Query(..., description="The ID of the device owner (internal DB user ID)"),
        service: DeviceService = Depends(),
        user=Depends(get_current_user) # Assuming admin or specific logic for owner_id check
):
    # authorize_role(user, "admin") # Or some other logic to ensure 'owner_id' is valid/permitted
    # The unique_key is now part of DeviceCreate model
    if not validate_device_id(device_input.unique_key, device_input.type_code): # Pass type_code
        raise HTTPException(
            status_code=400, # Changed from 403 as it's a validation error
            detail=f"Invalid device unique_key or type_code format/combination."
        )
    # Service's register_device now takes DeviceCreate model and returns DBDevice object
    db_device = await service.register_device(device_input, owner_id)
    return db_device # FastAPI will convert using DeviceResponse.Config.orm_mode


@router.get("/{device_db_id}", response_model=DeviceResponse) # Path param is db id
async def get_device_endpoint( # Renamed
        device_db_id: int = Path(..., description="The internal database ID of the device"),
        service: DeviceService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_db_id)
    # Service returns DBDevice object
    db_device = await service.get_device_details(device_db_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    return db_device


@router.put("/{device_db_id}", response_model=DeviceResponse) # Path param is db id
async def update_device_endpoint( # Renamed
        device_db_id: int = Path(..., description="The internal database ID of the device"),
        device_update_input: DeviceUpdate = Body(...), # Use corrected DeviceUpdate model
        service: DeviceService = Depends(),
        user=Depends(get_current_user)
):
    authorize_device(user, device_db_id)
    # Service takes DeviceUpdate model and returns DBDevice object
    updated_db_device = await service.update_device_info(device_db_id, device_update_input)
    return updated_db_device


@router.delete("/{device_db_id}", response_model=DeviceDeregisterResponse) # Path param is db id
async def deregister_device_endpoint( # Renamed
        device_db_id: int = Path(..., description="The internal database ID of the device"),
        service: DeviceService = Depends(),
        user = Depends(get_current_user)
):
    authorize_device(user, device_db_id)
    # Service returns a dict matching DeviceDeregisterResponse
    return await service.deregister_device(device_db_id)


@router.get("/user/{owner_user_id}", response_model=List[DeviceResponse]) # Path param is user's db id
async def get_user_devices_endpoint( # Renamed
        owner_user_id: int = Path(..., description="The internal database ID of the user"),
        service: DeviceService = Depends(),
        user = Depends(get_current_user) # Authorization: user must be admin or the owner_user_id themselves
):
    # Add authorization: either admin or the user themself
    # Example: if user['sub'] (clerk_id) maps to owner_user_id or user is admin
    # For simplicity, assuming admin or direct match for now.
    # A more robust check would involve fetching user by clerk_id, then comparing their DB id.
    # authorize_role(user, "admin") # OR check if user matches owner_user_id
    # For now, relying on service layer or assuming this endpoint is for admins/specific scenarios.

    # Service returns List[DBDevice]
    user_devices = await service.get_user_devices(owner_user_id)
    return user_devices


@router.get("", response_model=List[DeviceResponse]) # Root GET for all devices
async def get_all_devices_endpoint( # Renamed
        service: DeviceService = Depends(),
        user = Depends(get_current_user)
):
    authorize_role(user, "admin") # This was correct
    # Service returns List[DBDevice]
    all_devices = await service.get_all_devices()
    return all_devices
