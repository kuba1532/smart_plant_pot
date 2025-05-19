# app/services/device_service.py
from fastapi import Depends, HTTPException
from typing import Dict, Any, Optional, List
import logging

from app.db.crud.devices import (
    create_device,
    get_device_by_id,
    delete_device,
    get_devices_by_owner_id,
    update_device,
    DeviceNotFoundError,
    DeviceAlreadyExistsError,
    DatabaseError,
    UserNotFoundError
)

# Configure logger
logger = logging.getLogger(__name__)


class DeviceService:
    """Service for managing IoT devices"""

    async def register_device(self, device_data: Dict[str, Any], owner_id: int) -> Dict[str, Any]:
        """
        Register a new device or retrieve existing device

        Args:
            device_data: The device data with device_id, name, and type
            owner_id: ID of the device owner

        Returns:
            Response indicating the status of the operation
        """
        # Extract device information
        device_id = device_data.get("device_id")
        if not device_id:
            logger.error("Missing device ID in registration data")
            raise HTTPException(status_code=400, detail="Missing device ID in registration data")

        name = device_data.get("name", "Unnamed Device")
        device_type = device_data.get("type", "unknown")

        try:
            # Create or get existing device
            device = create_device(
                device_id=device_id,
                name=name,
                type=device_type,
                owner_id=owner_id
            )

            # Log the successful operation
            logger.info(f"Device registered: id={device.id}, device_id={device_id}, owner_id={owner_id}")

            # Return success
            return {
                "status": "success",
                "message": "Device registered successfully",
                "device_id": device_id,
                "internal_id": device.id,
                "name": device.name,
                "type": device.type,
                "owner_id": device.owner_id
            }

        except DeviceAlreadyExistsError:
            # This might not be an error since create_device returns existing device
            logger.info(f"Device already registered: device_id={device_id}")
            return {
                "status": "success",
                "message": "Device already registered",
                "device_id": device_id
            }

        except UserNotFoundError:
            logger.error(f"User not found: device_id={device_id}")
            raise HTTPException(
                status_code=404,
                detail=f"User {owner_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error processing device registration: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to register device due to database error"
            )

    async def update_device_info(self, id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update device information

        Args:
            id: The device internal ID
            update_data: The device data to update

        Returns:
            Response indicating the status of the operation
        """
        try:
            # Update the device
            updated_device = update_device(id, update_data)

            logger.info(f"Device updated: id={updated_device.id}, device_id={updated_device.device_id}")
            return {
                "status": "success",
                "message": "Device updated successfully",
                "device_id": updated_device.device_id,
                "internal_id": updated_device.id,
                "name": updated_device.name,
                "type": updated_device.type,
                "owner_id": updated_device.owner_id
            }

        except DeviceNotFoundError:
            logger.warning(f"Device not found for update: id={id}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error updating device: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to update device due to database error"
            )

    async def deregister_device(self, id: int) -> Dict[str, Any]:
        """
        Deregister a device

        Args:
            id: The device internal ID

        Returns:
            Response indicating the status of the operation
        """
        try:
            # Get device info before deletion for the response
            device = get_device_by_id(id)
            if not device:
                logger.warning(f"Device not found for deregistration: id={id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Device with id {id} not found"
                )

            # Delete the device
            delete_result = delete_device(id)

            if delete_result:
                logger.info(f"Device deregistered: id={id}, device_id={device.device_id}")
                return {
                    "status": "success",
                    "message": "Device deregistered successfully",
                    "device_id": device.device_id,
                    "internal_id": id
                }
            else:
                # This shouldn't happen if we already checked device exists
                logger.warning(f"Device deregistration failed: id={id}")
                return {
                    "status": "warning",
                    "message": "Device deregistration failed",
                    "internal_id": id
                }

        except DatabaseError as e:
            logger.error(f"Database error deregistering device: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to deregister device due to database error"
            )

    async def get_device_details(self, id: int) -> Dict[str, Any]:
        """
        Get device details

        Args:
            id: The device internal ID

        Returns:
            Device details
        """
        try:
            device = get_device_by_id(id)
            if not device:
                logger.warning(f"Device not found: id={id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Device with id {id} not found"
                )

            return {
                "id": device.id,
                "device_id": device.device_id,
                "name": device.name,
                "type": device.type,
                "owner_id": device.owner_id,
                "created_at": device.created_at
            }

        except DatabaseError as e:
            logger.error(f"Database error retrieving device details: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve device details due to database error"
            )

    async def get_user_devices(self, owner_id: int) -> List[Dict[str, Any]]:
        """
        Get all devices owned by a user

        Args:
            owner_id: The owner's ID

        Returns:
            List of device details
        """
        try:
            devices = get_devices_by_owner_id(owner_id)

            # Transform the devices into a list of dictionaries
            device_list = [
                {
                    "id": device.id,
                    "device_id": device.device_id,
                    "name": device.name,
                    "type": device.type,
                    "created_at": device.created_at
                }
                for device in devices
            ] if devices else []

            return device_list

        except UserNotFoundError:
            logger.error(f"User {owner_id}")
            raise HTTPException(
                status_code=404,
                detail=f"User {owner_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error retrieving user devices: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve user devices due to database error"
            )


    async def get_all_devices(self) -> List[Dict[str, Any]]:
        """
        Get all devices in the system

        Returns:
            List of all device details
        """
        try:
            from app.db.crud.devices import get_all_devices  # Import the function we created earlier

            devices = get_all_devices()

            # Transform the devices into a list of dictionaries
            device_list = [
                {
                    "id": device.id,
                    "device_id": device.device_id,
                    "name": device.name,
                    "type": device.type,
                    "owner_id": device.owner_id,
                    "created_at": device.created_at
                }
                for device in devices
            ] if devices else []

            return device_list

        except DatabaseError as e:
            logger.error(f"Database error retrieving all devices: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve all devices due to database error"
            )