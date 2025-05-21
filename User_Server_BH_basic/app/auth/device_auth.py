from fastapi import HTTPException

from app.auth.role_auth import authorize_role, is_matching_role
from app.db.crud.devices import get_devices_by_owner_id
from app.db.crud.users import get_user_by_clerk_id


def authorize_device(user, id: int):
    try:
        clerk_id = user['sub']
    except (KeyError, TypeError) as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token or missing user identifier"
        ) from e

    user = get_user_by_clerk_id(clerk_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"User does not exists"
        )

    user_id = user.id
    users_devices = get_devices_by_owner_id(user_id)

    # Check if any device in the list has the matching device_id
    if not any(device.id == id for device in users_devices) or not is_matching_role(user, "admin"):
        raise HTTPException(
            status_code=403,
            detail=f"User does not have permission to access this device"
        )