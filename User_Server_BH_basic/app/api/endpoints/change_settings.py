from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.auth.device_auth import authorize_device
from app.models.change_settings import ChangeSettingsCreate, ChangeSettingsOutput
from app.services.device_webhook_service import send_settings_to_device_server

router = APIRouter()

@router.post("/change-settings", response_model=ChangeSettingsOutput)
def update_settings(data: ChangeSettingsCreate,
    user = Depends(get_current_user)):

    authorize_device(user, data.device_id)
    success, message = send_settings_to_device_server(data)

    if not success:
        raise HTTPException(status_code=502, detail=message)

    return ChangeSettingsOutput(result=message, updated_at=datetime.utcnow())