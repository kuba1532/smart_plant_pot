from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func
from app.db.base import SessionLocal, with_db_session
from app.db.errors import DeviceTypeAlreadyExistsError, DatabaseError, DeviceTypeNotFoundError
from app.db.models import Device_type
import logging
from typing import List, Optional

# Set up logging
logger = logging.getLogger(__name__)


@with_db_session
def create_device_type(type_code: str, name: str, db=None):
    """
    Create a new device type.

    Args:
        type_code: The unique code for the device type
        name: The name of the device type
        db: Database session

    Returns:
        The created Device_type object

    Raises:
        DeviceTypeAlreadyExistsError: If a device type with the same code already exists
        DatabaseError: For other database-related errors
    """
    try:
        # Check if device type already exists
        existing_device_type = db.query(Device_type).filter(
            (Device_type.type_code == type_code) | (Device_type.name == name)
        ).first()

        if existing_device_type:
            if existing_device_type.type_code == type_code:
                logger.error(f"Device type with code {type_code} already exists")
                raise DeviceTypeAlreadyExistsError(f"Device type with code {type_code} already exists")
            else:
                logger.error(f"Device type with name {name} already exists")
                raise DeviceTypeAlreadyExistsError(f"Device type with name {name} already exists")

        # Create new device type
        new_device_type = Device_type(
            type_code=type_code,
            name=name
        )

        db.add(new_device_type)
        db.commit()
        db.refresh(new_device_type)
        logger.info(f"Device type {type_code} created successfully")
        return new_device_type

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating device type: {str(e)}")
        raise DeviceTypeAlreadyExistsError(f"Device type with code {type_code} or name {name} already exists") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating device type: {str(e)}")
        raise DatabaseError(f"Failed to create device type: {str(e)}") from e


@with_db_session
def get_device_type_by_id(device_type_id: int, db=None):
    """
    Get a device type by its ID.

    Args:
        device_type_id: The ID of the device type
        db: Database session

    Returns:
        Device_type object or None if not found

    Raises:
        DatabaseError: For database-related errors
    """
    try:
        device_type = db.query(Device_type).filter(Device_type.id == device_type_id).first()

        if not device_type:
            logger.info(f"Device type with id {device_type_id} not found")

        return device_type

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving device type: {str(e)}")
        raise DatabaseError(f"Failed to retrieve device type: {str(e)}") from e


@with_db_session
def get_device_type_by_code(type_code: str, db=None):
    """
    Get a device type by its type code.

    Args:
        type_code: The type code of the device type
        db: Database session

    Returns:
        Device_type object or None if not found

    Raises:
        DatabaseError: For database-related errors
    """
    try:
        device_type = db.query(Device_type).filter(Device_type.type_code == type_code).first()

        if not device_type:
            logger.info(f"Device type with code {type_code} not found")

        return device_type

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving device type: {str(e)}")
        raise DatabaseError(f"Failed to retrieve device type: {str(e)}") from e


@with_db_session
def get_all_device_types(db=None):
    """
    Get all device types.

    Args:
        db: Database session

    Returns:
        List of all Device_type objects

    Raises:
        DatabaseError: For database-related errors
    """
    try:
        device_types = db.query(Device_type).all()
        return device_types

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving all device types: {str(e)}")
        raise DatabaseError(f"Failed to retrieve all device types: {str(e)}") from e


@with_db_session
def update_device_type(device_type_id: int, type_code: Optional[str] = None, name: Optional[str] = None, db=None):
    """
    Update a device type.

    Args:
        device_type_id: The ID of the device type to update
        type_code: The new type code (optional)
        name: The new name (optional)
        db: Database session

    Returns:
        Updated Device_type object

    Raises:
        DeviceTypeNotFoundError: If the device type doesn't exist
        DeviceTypeAlreadyExistsError: If updated code or name conflicts with existing ones
        DatabaseError: For other database-related errors
    """
    try:
        device_type = db.query(Device_type).filter(Device_type.id == device_type_id).first()

        if not device_type:
            logger.warning(f"Attempted to update non-existent device type with id {device_type_id}")
            raise DeviceTypeNotFoundError(f"Device type with id {device_type_id} not found")

        # Check for conflicts only if we're changing the values
        if type_code is not None and type_code != device_type.type_code:
            existing = db.query(Device_type).filter(Device_type.type_code == type_code).first()
            if existing and existing.id != device_type_id:
                logger.error(f"Device type with code {type_code} already exists")
                raise DeviceTypeAlreadyExistsError(f"Device type with code {type_code} already exists")
            device_type.type_code = type_code

        if name is not None and name != device_type.name:
            existing = db.query(Device_type).filter(Device_type.name == name).first()
            if existing and existing.id != device_type_id:
                logger.error(f"Device type with name {name} already exists")
                raise DeviceTypeAlreadyExistsError(f"Device type with name {name} already exists")
            device_type.name = name

        db.commit()
        db.refresh(device_type)
        logger.info(f"Device type with id {device_type_id} updated successfully")
        return device_type

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating device type: {str(e)}")
        raise DeviceTypeAlreadyExistsError(f"Device type with code {type_code} or name {name} already exists") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating device type: {str(e)}")
        raise DatabaseError(f"Failed to update device type: {str(e)}") from e


@with_db_session
def delete_device_type(device_type_id: int, db=None):
    """
    Delete a device type.

    Args:
        device_type_id: The ID of the device type to delete
        db: Database session

    Returns:
        Boolean indicating success

    Raises:
        DatabaseError: For database-related errors
    """
    try:
        device_type = db.query(Device_type).filter(Device_type.id == device_type_id).first()

        if not device_type:
            logger.warning(f"Attempted to delete non-existent device type with id {device_type_id}")
            return False

        # Check if there are any devices using this type before deletion
        if device_type.devices:
            logger.warning(f"Cannot delete device type with id {device_type_id} as it has associated devices")
            raise DatabaseError(f"Cannot delete device type as it is being used by {len(device_type.devices)} devices")

        db.delete(device_type)
        db.commit()
        logger.info(f"Device type with id {device_type_id} deleted successfully")
        return True

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting device type: {str(e)}")
        raise DatabaseError(f"Failed to delete device type: {str(e)}") from e


@with_db_session
def delete_device_type_by_code(type_code: str, db=None):
    """
    Delete a device type by its type code.

    Args:
        type_code: The type code of the device type to delete
        db: Database session

    Returns:
        Boolean indicating success

    Raises:
        DatabaseError: For database-related errors
    """
    try:
        device_type = db.query(Device_type).filter(Device_type.type_code == type_code).first()

        if not device_type:
            logger.warning(f"Attempted to delete non-existent device type with code {type_code}")
            return False

        # Check if there are any devices using this type before deletion
        if device_type.devices:
            logger.warning(f"Cannot delete device type with code {type_code} as it has associated devices")
            raise DatabaseError(f"Cannot delete device type as it is being used by {len(device_type.devices)} devices")

        db.delete(device_type)
        db.commit()
        logger.info(f"Device type with code {type_code} deleted successfully")
        return True

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting device type: {str(e)}")
        raise DatabaseError(f"Failed to delete device type: {str(e)}") from e