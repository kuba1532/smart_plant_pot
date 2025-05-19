from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user
from app.auth.device_auth import authorize_device
from app.models.send_command import SendCommandCreate, SendCommandOutput
from app.services.device_webhook_service import send_command_to_device_server

router = APIRouter()

@router.post("/send-command", response_model=SendCommandOutput)
def update_settings(data: SendCommandCreate,
                    user = Depends(get_current_user)):

    authorize_device(user, data.device_id)
    success, message = send_command_to_device_server(data)

    if not success:
        raise HTTPException(status_code=502, detail=message)

    return SendCommandOutput(result=message, updated_at=datetime.utcnow())