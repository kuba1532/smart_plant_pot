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

    user_db = get_user_by_clerk_id(clerk_id)
    if not user_db:
        raise HTTPException(
            status_code=404,
            detail=f"User does not exists"
        )

    user_id = user_db.id
    users_devices = get_devices_by_owner_id(user_id)

    print("current_device_id: " + str(id))
    print("user devices ids:")
    for device in users_devices:
        print(device.id)

    # Check if the specific device is owned by the user or if the user is an admin
    if not any(device.id == id for device in users_devices) and not is_matching_role(user, "admin"):
        raise HTTPException(
            status_code=403,
            detail=f"User does not have permissions to access this device"
        )