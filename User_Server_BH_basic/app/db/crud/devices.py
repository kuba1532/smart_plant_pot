from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.db.base import SessionLocal, with_db_session
from app.db.models import Device, User
from app.db.errors import UserNotFoundError, DeviceAlreadyExistsError, DatabaseError, DeviceNotFoundError
import logging

# Set up logging
logger = logging.getLogger(__name__)


@with_db_session
def create_device(device_id: str, name: str, type: str, owner_id: int, db=None):
    try:
        # First, verify the user exists
        user = db.query(User).filter(User.id == owner_id).first()
        if not user:
            raise UserNotFoundError(f"User with id {owner_id} does not exist")

        existing_device = db.query(Device).filter(Device.device_id == device_id).first()
        if existing_device:
            return existing_device

        new_device = Device(
            device_id=device_id,
            name=name,
            type=type,
            owner_id=owner_id
        )
        db.add(new_device)
        db.commit()
        db.refresh(new_device)
        return new_device
    except IntegrityError as e:
        db.rollback()
        # Check specifically for unique constraint violation on device_id
        if "unique constraint" in str(e).lower() and "device_id" in str(e).lower():
            logger.error(f"Device with device_id {device_id} already exists: {str(e)}")
            raise DeviceAlreadyExistsError(f"Device with device_id {device_id} already exists") from e
        # Check for foreign key constraint violation
        elif "foreign key constraint" in str(e).lower():
            logger.error(f"Foreign key constraint violation (likely invalid owner_id): {str(e)}")
            raise UserNotFoundError(f"User with id {owner_id} does not exist") from e
        else:
            logger.error(f"Integrity error creating device: {str(e)}")
            raise DatabaseError(f"Failed to create device: {str(e)}") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating device with device_id {device_id}: {str(e)}")
        raise DatabaseError(f"Failed to create device: {str(e)}") from e


@with_db_session
def delete_device(id: int, db=None):
    try:
        existing_device = db.query(Device).filter(Device.id == id).first()
        if not existing_device:
            logger.warning(f"Attempted to delete non-existent device with id {id}")
            return False

        db.delete(existing_device)
        db.commit()
        logger.info(f"Device with id {id} deleted successfully")
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting device with id {id}: {str(e)}")
        raise DatabaseError(f"Failed to delete device: {str(e)}") from e


@with_db_session
def get_device_by_id(id: int, db=None):
    try:
        device = db.query(Device).filter(Device.id == id).first()
        if not device:
            logger.info(f"device with id {device} not found")
        return device
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving device with id {id}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve device: {str(e)}") from e


@with_db_session
def get_devices_by_owner_id(owner_id: int, db=None):
    try:
        user = db.query(User).filter(User.id == owner_id).first()
        if not user:
            logger.error(f"user with id {owner_id} not found")
            raise UserNotFoundError(f"User with id {owner_id} does not exist")
        devices = db.query(Device).filter(Device.owner_id == owner_id).all()
        if not devices:
            logger.info(f"Devices with owner_id {owner_id} not found")
        return devices
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving devices with owner_id {owner_id}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve devices: {str(e)}") from e


@with_db_session
def update_device(id: int, update_data: dict, db=None):
    try:
        # First, check if the device exists
        device = db.query(Device).filter(Device.id == id).first()
        if not device:
            logger.warning(f"Attempted to update non-existent device with id {id}")
            raise DeviceNotFoundError(f"Device with id {id} not found")

        # Update only the fields provided in update_data
        for key, value in update_data.items():
            if hasattr(device, key):
                setattr(device, key, value)

        db.commit()
        db.refresh(device)

        logger.info(f"Device with id {id} updated successfully")
        return device
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating device with id {id}: {str(e)}")
        raise DatabaseError(f"Failed to update device: {str(e)}") from e

@with_db_session
def get_all_devices(db=None):
    try:
        devices = db.query(Device).all()
        if not devices:
            logger.info("No devices found in the database")
        return devices
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving all devices: {str(e)}")
        raise DatabaseError(f"Failed to retrieve devices: {str(e)}") from e