# app/models/clerk_webhook.py
from pydantic import BaseModel
from typing import Optional

class WebhookUserResponse(BaseModel):
    status: str
    message: str
    user_id: str  # This is clerk_id
    internal_id: Optional[int] = None

class WebhookIgnoredResponse(BaseModel):
    status: str
    event: str