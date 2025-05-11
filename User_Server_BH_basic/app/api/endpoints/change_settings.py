from datetime import datetime

from fastapi import APIRouter, HTTPException
from app.models.change_settings import ChangeSettingsInput, ChangeSettingsOutput
from app.services.device_webhook_service import send_settings_to_device_server

router = APIRouter()

@router.post("/change-settings", response_model=ChangeSettingsOutput)
def update_settings(data: ChangeSettingsInput):
    success, message = send_settings_to_device_server(data)

    if not success:
        raise HTTPException(status_code=502, detail=message)

    return ChangeSettingsOutput(result=message, updated_at=datetime.utcnow())