# app/services/device_service.py
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
    get_all_devices as crud_get_all_devices,  # Renamed import
    DeviceNotFoundError,
    DeviceAlreadyExistsError,
    DatabaseError,
    UserNotFoundError
)
from app.db.models import Device as DBDevice  # For type hinting
from app.models.device import DeviceCreate, DeviceUpdate, DeviceResponse  # For type hinting

# Configure logger
logger = logging.getLogger(__name__)


class DeviceService:
    """Service for managing IoT devices"""

    async def register_device(self, device_data: DeviceCreate, owner_id: int) -> DBDevice:
        """
        Register a new device or retrieve existing device.
        Uses DeviceCreate model for input.

        Args:
            device_data: The device data (DeviceCreate model instance)
            owner_id: ID of the device owner

        Returns:
            The created or existing DBDevice object
        """
        unique_key = device_data.unique_key  # From DeviceCreate model
        if not unique_key:
            logger.error("Missing device unique_key in registration data")
            raise HTTPException(status_code=400, detail="Missing unique_key in registration data")

        name = device_data.name if device_data.name else "Unnamed Device"
        type_code = device_data.type_code if device_data.type_code else "unknown"

        try:
            # Create or get existing device
            # Ensure crud.create_device expects unique_key, name, type_code, owner_id
            device = create_device(
                unique_key=unique_key,
                name=name,
                type_code=type_code,
                owner_id=owner_id
            )

            logger.info(
                f"Device registered/retrieved: id={device.id}, unique_key={device.unique_key}, owner_id={owner_id}")
            return device

        except DeviceAlreadyExistsError:  # Should be handled by create_device returning existing
            # This path might not be hit if create_device always returns the device
            existing_device = get_device_by_id(unique_key=unique_key)  # Need a get_device_by_unique_key
            logger.info(f"Device already registered: unique_key={unique_key}")
            if existing_device:
                return existing_device
            # Fallback, though ideally create_device handles this logic
            raise HTTPException(status_code=409,
                                detail=f"Device with unique_key {unique_key} already exists, but retrieval failed.")


        except UserNotFoundError:
            logger.error(f"User not found: user_id={owner_id}")
            raise HTTPException(
                status_code=404,
                detail=f"User with id {owner_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error processing device registration: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to register device due to database error"
            )

    async def update_device_info(self, device_id: int, update_data: DeviceUpdate) -> DBDevice:
        """
        Update device information. Uses DeviceUpdate model for input.

        Args:
            device_id: The device internal database ID
            update_data: The device data to update (DeviceUpdate model instance)

        Returns:
            The updated DBDevice object
        """
        try:
            # update_device CRUD function expects a dict
            updated_device = update_device(device_id, update_data.dict(exclude_unset=True))

            logger.info(f"Device updated: id={updated_device.id}")
            return updated_device

        except DeviceNotFoundError:
            logger.warning(f"Device not found for update: id={device_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error updating device: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to update device due to database error"
            )

    async def deregister_device(self, device_id: int) -> Dict[
        str, Any]:  # Returns dict matching DeviceDeregisterResponse
        """
        Deregister a device

        Args:
            device_id: The device internal database ID

        Returns:
            Response indicating the status of the operation
        """
        try:
            # Get device info before deletion for the response
            device = get_device_by_id(device_id)  # device_id is the primary key 'id'
            if not device:
                logger.warning(f"Device not found for deregistration: id={device_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Device with id {device_id} not found"
                )

            device_unique_key = device.unique_key  # Store before deletion

            # Delete the device
            delete_result = delete_device(device_id)

            if delete_result:
                logger.info(f"Device deregistered: id={device_id}")
                return {
                    "status": "success",
                    "message": "Device deregistered successfully",
                    "unique_key": device_unique_key,
                    "id": device_id
                }
            else:
                # This path should ideally not be hit if the above check passes
                # and delete_device raises an error or returns False consistently.
                logger.warning(
                    f"Device deregistration failed: id={device_id}, device may not have existed or another issue.")
                # Re-raising as 404 if it implies not found, or 500 for other failure.
                raise HTTPException(
                    status_code=404,  # Or 500 if deletion failed for other reasons
                    detail=f"Device with id {device_id} could not be deregistered or was not found."
                )


        except DatabaseError as e:
            logger.error(f"Database error deregistering device: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to deregister device due to database error"
            )

    async def get_device_details(self, device_id: int) -> Optional[DBDevice]:
        """
        Get device details

        Args:
            device_id: The device internal database ID

        Returns:
            DBDevice object or None if not found (FastAPI will handle 404 if None and response_model is set)
        """
        try:
            device = get_device_by_id(device_id)  # device_id is the primary key 'id'
            if not device:
                logger.warning(f"Device not found: id={device_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Device with id {device_id} not found"
                )
            return device

        except DatabaseError as e:
            logger.error(f"Database error retrieving device details: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve device details due to database error"
            )

    async def get_user_devices(self, owner_id: int) -> List[DBDevice]:
        """
        Get all devices owned by a user

        Args:
            owner_id: The owner's ID

        Returns:
            List of DBDevice objects
        """
        try:
            return get_devices_by_owner_id(owner_id)

        except UserNotFoundError:  # This is raised by the CRUD if user not found
            logger.error(f"User with id {owner_id} not found when fetching devices.")
            raise HTTPException(
                status_code=404,
                detail=f"User with id {owner_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error retrieving user devices: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve user devices due to database error"
            )

    async def get_all_devices(self) -> List[DBDevice]:
        """
        Get all devices in the system

        Returns:
            List of all DBDevice objects
        """
        try:
            return crud_get_all_devices()

        except DatabaseError as e:
            logger.error(f"Database error retrieving all devices: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve all devices due to database error"
            )
