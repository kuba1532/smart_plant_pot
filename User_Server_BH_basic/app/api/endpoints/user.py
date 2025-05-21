# app/api/endpoints/user.py
# app/api/endpoints/user.py
from typing import List, Dict, Any # Dict, Any might not be needed if using Pydantic models

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Body
# from fastapi.responses import JSONResponse # Not needed if Pydantic handles response

from app.auth import get_current_user
# from app.auth.device_auth import authorize_device # Not used here
# from app.auth.role_auth import authorize_role # Not used here
# from app.models.device import DeviceCreate, DeviceResponse, DeviceUpdate # Not device models
from app.models.user import UserResponse # Import the new UserResponse model
from app.services.user_service import UserService
# from app.utils.device_authentication import validate_device_id # Not used here

router = APIRouter()

@router.get("/me", response_model=UserResponse) # Changed path to /me for current user
async def get_current_user_details( # Renamed function
        service: UserService = Depends(),
        user_jwt_payload=Depends(get_current_user) # Renamed for clarity
):
    """Get details for the currently authenticated user."""
    clerk_id = user_jwt_payload['sub']
    # Service returns a DBUser object, FastAPI converts using UserResponse.Config.orm_mode
    db_user = service.get_user_by_clerk_id(clerk_id)
    if not db_user:
        # This case should ideally not happen if Clerk webhook created the user
        # and get_user_by_clerk_id raises HTTPException for not found.
        raise HTTPException(status_code=404, detail="User not found in database")
    return db_user