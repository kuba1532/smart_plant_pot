# app/api/endpoints/clerk_webhooks.py
# app/api/endpoints/clerk_webhooks.py
from fastapi import APIRouter, Request, Depends, HTTPException, status, Header
from typing import Union
from app.services.user_service import UserService
from app.core.config import settings
from svix.webhooks import Webhook, WebhookVerificationError
from app.models.clerk_webhook import WebhookUserResponse, WebhookIgnoredResponse

router = APIRouter()


@router.post("/webhook",
             status_code=status.HTTP_200_OK,
             response_model=Union[WebhookUserResponse, WebhookIgnoredResponse])
async def clerk_webhook(
        request: Request,
        svix_id: str = Header(..., alias="svix-id"),
        svix_timestamp: str = Header(..., alias="svix-timestamp"),
        svix_signature: str = Header(..., alias="svix-signature"),
        user_service: UserService = Depends()
):
    """
    Handle webhook events from Clerk for user creation and deletion.
    """
    payload_bytes = await request.body()
    payload_str = payload_bytes.decode("utf-8")

    try:
        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        payload = wh.verify(
            payload_str,
            {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature
            }
        )
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Webhook verification failed")

    if "type" not in payload or "data" not in payload:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    event_type = payload["type"]
    data = payload["data"]

    if event_type == "user.created":
        # UserService.handle_user_created now returns a dict matching WebhookUserResponse
        return await user_service.handle_user_created(data)
    elif event_type == "user.deleted":
        # UserService.handle_user_deleted now returns a dict matching WebhookUserResponse
        return await user_service.handle_user_deleted(data)

    return WebhookIgnoredResponse(status="ignored", event=event_type)