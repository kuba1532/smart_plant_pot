# app/services/user_service.py
from fastapi import Depends, HTTPException
from typing import Dict, Any, Optional
import logging

from app.db.crud.users import (
    create_user,
    get_user_by_clerk_id,
    delete_user,
    UserNotFoundError,
    UserAlreadyExistsError,
    DatabaseError
)

# Configure logger
logger = logging.getLogger(__name__)


class UserService:
    """Service for managing users from Clerk webhooks"""

    async def handle_user_created(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle the user.created event from Clerk

        Args:
            data: The user data from Clerk webhook

        Returns:
            Response indicating the status of the operation
        """
        # Extract user information
        clerk_id = data.get("id")
        if not clerk_id:
            logger.error("Missing user ID in Clerk webhook data")
            raise HTTPException(status_code=400, detail="Missing user ID in webhook data")

        # Extract additional user data for logging/future use
        email = data.get("email_addresses", [{}])[0].get("email_address") if data.get("email_addresses") else None
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")

        try:
            # Create or get existing user
            user = create_user(clerk_id)

            # Log the successful operation
            logger.info(f"User processed: id={user.id}, clerk_id={clerk_id}, email={email}")

            # You could store additional user data here if needed
            # user.email = email
            # user.first_name = first_name
            # update_user(user)

            # Return success
            return {
                "status": "success",
                "message": "User created successfully",
                "user_id": clerk_id,
                "internal_id": user.id
            }

        except UserAlreadyExistsError:
            # This might not be an error in your case since create_user returns existing user
            logger.info(f"User already exists: clerk_id={clerk_id}")
            return {
                "status": "success",
                "message": "User already exists",
                "user_id": clerk_id
            }

        except DatabaseError as e:
            logger.error(f"Database error processing user creation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process user creation due to database error"
            )

    async def handle_user_deleted(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle the user.deleted event from Clerk

        Args:
            data: The user data from Clerk webhook

        Returns:
            Response indicating the status of the operation
        """
        # Extract user ID
        clerk_id = data.get("id")
        if not clerk_id:
            logger.error("Missing user ID in Clerk webhook data")
            raise HTTPException(status_code=400, detail="Missing user ID in webhook data")

        try:
            # Find the user by clerk_id
            user = get_user_by_clerk_id(clerk_id)

            if not user:
                logger.warning(f"User not found for deletion: clerk_id={clerk_id}")
                return {
                    "status": "warning",
                    "message": "User not found for deletion",
                    "user_id": clerk_id
                }

            # Delete the user
            delete_result = delete_user(user.id)

            if delete_result:
                logger.info(f"User deleted: clerk_id={clerk_id}, internal_id={user.id}")
                return {
                    "status": "success",
                    "message": "User deletion handled successfully",
                    "user_id": clerk_id,
                    "internal_id": user.id
                }
            else:
                # This shouldn't happen if we already checked user exists
                logger.warning(f"User deletion failed: clerk_id={clerk_id}")
                return {
                    "status": "warning",
                    "message": "User deletion failed",
                    "user_id": clerk_id
                }

        except UserNotFoundError:
            # Handle case where user exists in Clerk but not in our system
            logger.warning(f"User not found for deletion: clerk_id={clerk_id}")
            return {
                "status": "warning",
                "message": "User not found for deletion",
                "user_id": clerk_id
            }

        except DatabaseError as e:
            logger.error(f"Database error processing user deletion: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process user deletion due to database error"
            )

    def get_user_by_clerk_id(self, clerk_id: str) -> Optional[Any]:
        """
        Get a user by their Clerk ID

        Args:
            clerk_id: The Clerk user ID

        Returns:
            The user if found, None otherwise
        """
        try:
            return get_user_by_clerk_id(clerk_id)
        except DatabaseError as e:
            logger.error(f"Error retrieving user with clerk_id {clerk_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve user due to database error"
            )