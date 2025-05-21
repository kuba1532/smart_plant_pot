# app/services/user_service.py
# app/services/user_service.py
from fastapi import Depends, HTTPException
from typing import Dict, Any, Optional
import logging

from app.db.crud.users import (
    create_user,
    get_user_by_clerk_id as crud_get_user_by_clerk_id,  # Renamed for clarity
    delete_user,
    DatabaseError
)
from app.db.errors import UserAlreadyExistsError, UserNotFoundError
from app.db.models import User as DBUser  # For type hinting

# Configure logger
logger = logging.getLogger(__name__)


class UserService:
    """Service for managing users from Clerk webhooks"""

    async def handle_user_created(self, data: Dict[str, Any]) -> Dict[
        str, Any]:  # Returns dict matching WebhookUserResponse
        """
        Handle the user.created event from Clerk

        Args:
            data: The user data from Clerk webhook

        Returns:
            Response indicating the status of the operation
        """
        clerk_id = data.get("id")
        if not clerk_id:
            logger.error("Missing user ID in Clerk webhook data")
            raise HTTPException(status_code=400, detail="Missing user ID in webhook data")

        try:
            user = create_user(clerk_id)  # This CRUD now returns existing user if found

            logger.info(f"User processed (created or existing): id={user.id}, clerk_id={clerk_id}")

            message = "User already exists and was retrieved" if user.clerk_id == clerk_id and user.id else "User created successfully"
            # A more robust check for "already exists" might involve comparing created_at or a version.
            # create_user in CRUD is idempotent now.

            return {
                "status": "success",
                "message": message,
                "user_id": clerk_id,
                "internal_id": user.id
            }

        # UserAlreadyExistsError might not be raised if create_user is idempotent
        # except UserAlreadyExistsError:
        #     logger.info(f"User already exists: clerk_id={clerk_id}")
        #     # Retrieve the existing user to get internal_id
        #     existing_user = crud_get_user_by_clerk_id(clerk_id)
        #     return {
        #         "status": "success",
        #         "message": "User already exists",
        #         "user_id": clerk_id,
        #         "internal_id": existing_user.id if existing_user else None
        #     }

        except DatabaseError as e:
            logger.error(f"Database error processing user creation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process user creation due to database error"
            )

    async def handle_user_deleted(self, data: Dict[str, Any]) -> Dict[
        str, Any]:  # Returns dict matching WebhookUserResponse
        """
        Handle the user.deleted event from Clerk

        Args:
            data: The user data from Clerk webhook

        Returns:
            Response indicating the status of the operation
        """
        clerk_id = data.get("id")
        if not clerk_id:
            logger.error("Missing user ID in Clerk webhook data")
            raise HTTPException(status_code=400, detail="Missing user ID in webhook data")

        try:
            user = crud_get_user_by_clerk_id(clerk_id)

            if not user:
                logger.warning(f"User not found for deletion: clerk_id={clerk_id}")
                # Return a specific part of WebhookUserResponse or a different model if needed
                return {
                    "status": "warning",
                    "message": "User not found for deletion",
                    "user_id": clerk_id,
                    "internal_id": None
                }

            internal_id_before_delete = user.id
            delete_result = delete_user(user.id)

            if delete_result:
                logger.info(f"User deleted: clerk_id={clerk_id}, internal_id={internal_id_before_delete}")
                return {
                    "status": "success",
                    "message": "User deletion handled successfully",
                    "user_id": clerk_id,
                    "internal_id": internal_id_before_delete
                }
            else:
                # This path implies delete_user returned False without raising an error for a found user.
                logger.warning(f"User deletion failed for an existing user: clerk_id={clerk_id}")
                return {
                    "status": "error",
                    "message": "User deletion failed unexpectedly",
                    "user_id": clerk_id,
                    "internal_id": internal_id_before_delete
                }

        # UserNotFoundError is already handled by the check `if not user:` above.
        # The CRUD `get_user_by_clerk_id` returns None, not UserNotFoundError exception.

        except DatabaseError as e:
            logger.error(f"Database error processing user deletion: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process user deletion due to database error"
            )

    def get_user_by_clerk_id(self, clerk_id: str) -> Optional[DBUser]:
        """
        Get a user by their Clerk ID

        Args:
            clerk_id: The Clerk user ID

        Returns:
            The DBUser object if found, None otherwise
        """
        try:
            user = crud_get_user_by_clerk_id(clerk_id)
            if not user:
                raise HTTPException(status_code=404, detail=f"User with clerk_id {clerk_id} not found")
            return user
        except DatabaseError as e:
            logger.error(f"Error retrieving user with clerk_id {clerk_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve user due to database error"
            )
