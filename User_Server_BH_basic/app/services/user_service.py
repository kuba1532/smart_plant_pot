# app/services/user_service.py
from fastapi import Depends
from typing import Dict, Any


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
        user_id = data.get("id")
        email = data.get("email_addresses", [{}])[0].get("email_address") if data.get("email_addresses") else None
        first_name = data.get("first_name")
        last_name = data.get("last_name")

        # TODO: Add your logic to store or process new users
        print(f"User created: {user_id}, {email}, {first_name}, {last_name}")

        # Return success
        return {
            "status": "success",
            "message": "User created successfully",
            "user_id": user_id
        }

    async def handle_user_deleted(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle the user.deleted event from Clerk

        Args:
            data: The user data from Clerk webhook

        Returns:
            Response indicating the status of the operation
        """
        # Extract user ID
        user_id = data.get("id")

        # TODO: Add your logic to handle user deletion
        # For example, delete user data or mark them as inactive
        print(f"User deleted: {user_id}")

        # Return success
        return {
            "status": "success",
            "message": "User deletion handled successfully",
            "user_id": user_id
        }