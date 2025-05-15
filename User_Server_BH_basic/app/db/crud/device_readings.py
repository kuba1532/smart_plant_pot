from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, desc, asc, and_
from app.db.base import SessionLocal, with_db_session
from app.db.models import DeviceReading, Device
from datetime import datetime
import logging
from typing import List, Optional

# Set up logging
logger = logging.getLogger(__name__)


class DeviceReadingNotFoundError(Exception):
    """Exception raised when a device reading is not found."""
    pass


class DeviceReadingAlreadyExistsError(Exception):
    """Exception raised when attempting to create a duplicate device reading."""
    pass


class DeviceNotFoundError(Exception):
    """Exception raised when the referenced device is not found."""
    pass


class DatabaseError(Exception):
    """Exception raised for general database errors."""
    pass


@with_db_session
def create_device_reading(device_id: int, time: datetime, humidity: Optional[float] = None,
                          light_intensity: Optional[float] = None, temperature: Optional[float] = None,
                          db=None):
    try:
        # Check if device exists
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            logger.error(f"Device with id {device_id} not found")
            raise DeviceNotFoundError(f"Device with id {device_id} not found")

        # Check if reading already exists
        existing_reading = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time == time
        ).first()

        if existing_reading:
            # Update existing reading
            if humidity is not None:
                existing_reading.humidity = humidity
            if light_intensity is not None:
                existing_reading.light_intensity = light_intensity
            if temperature is not None:
                existing_reading.temperature = temperature

            db.commit()
            db.refresh(existing_reading)
            return existing_reading

        # Create new reading
        new_reading = DeviceReading(
            device_id=device_id,
            time=time,
            humidity=humidity,
            light_intensity=light_intensity,
            temperature=temperature
        )

        db.add(new_reading)
        db.commit()
        db.refresh(new_reading)
        return new_reading

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating device reading: {str(e)}")
        raise DeviceReadingAlreadyExistsError(f"Reading for device_id {device_id} at time {time} already exists") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating device reading: {str(e)}")
        raise DatabaseError(f"Failed to create device reading: {str(e)}") from e


@with_db_session
def update_device_reading(device_id: int, time: datetime, humidity: Optional[float] = None,
                          light_intensity: Optional[float] = None, temperature: Optional[float] = None,
                          db=None):
    try:
        reading = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time == time
        ).first()

        if not reading:
            logger.warning(f"Attempted to update non-existent reading for device {device_id} at time {time}")
            raise DeviceReadingNotFoundError(f"Reading for device_id {device_id} at time {time} not found")

        # Update fields if provided
        if humidity is not None:
            reading.humidity = humidity
        if light_intensity is not None:
            reading.light_intensity = light_intensity
        if temperature is not None:
            reading.temperature = temperature

        db.commit()
        db.refresh(reading)
        return reading

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating device reading: {str(e)}")
        raise DatabaseError(f"Failed to update device reading: {str(e)}") from e


@with_db_session
def delete_device_reading(device_id: int, time: datetime, db=None):
    try:
        reading = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time == time
        ).first()

        if not reading:
            logger.warning(f"Attempted to delete non-existent reading for device {device_id} at time {time}")
            return False

        db.delete(reading)
        db.commit()
        logger.info(f"Reading for device {device_id} at time {time} deleted successfully")
        return True

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting device reading: {str(e)}")
        raise DatabaseError(f"Failed to delete device reading: {str(e)}") from e


@with_db_session
def get_device_reading(device_id: int, time: datetime, db=None):
    try:
        reading = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time == time
        ).first()

        if not reading:
            logger.info(f"Reading for device {device_id} at time {time} not found")

        return reading

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving device reading: {str(e)}")
        raise DatabaseError(f"Failed to retrieve device reading: {str(e)}") from e


@with_db_session
def get_device_readings_by_device_id(device_id: int, db=None):
    try:
        # Check if device exists
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            logger.error(f"Device with id {device_id} not found")
            raise DeviceNotFoundError(f"Device with id {device_id} not found")

        readings = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id
        ).order_by(DeviceReading.time.desc()).all()

        return readings

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving device readings: {str(e)}")
        raise DatabaseError(f"Failed to retrieve device readings: {str(e)}") from e


@with_db_session
def get_latest_device_readings(device_id: int, limit: int = 10, db=None):
    """
    Retrieve the X newest readings for a specific device.

    Args:
        device_id: The ID of the device
        limit: Number of latest readings to return (default 10)
        db: Database session

    Returns:
        List of DeviceReading objects
    """
    try:
        # Check if device exists
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            logger.error(f"Device with id {device_id} not found")
            raise DeviceNotFoundError(f"Device with id {device_id} not found")

        latest_readings = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id
        ).order_by(DeviceReading.time.desc()).limit(limit).all()

        return latest_readings

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving latest device readings: {str(e)}")
        raise DatabaseError(f"Failed to retrieve latest device readings: {str(e)}") from e


@with_db_session
def get_reading_closest_to_timestamp(device_id: int, timestamp: datetime, db=None):
    """
    Find the reading that is closest to the provided timestamp for a specific device.

    Args:
        device_id: The ID of the device
        timestamp: The target timestamp
        db: Database session

    Returns:
        DeviceReading object closest to the target timestamp
    """
    try:
        # Check if device exists
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            logger.error(f"Device with id {device_id} not found")
            raise DeviceNotFoundError(f"Device with id {device_id} not found")

        # Get reading before the timestamp
        reading_before = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time <= timestamp
        ).order_by(DeviceReading.time.desc()).first()

        # Get reading after the timestamp
        reading_after = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time >= timestamp
        ).order_by(DeviceReading.time.asc()).first()

        # Determine which reading is closer
        if not reading_before and not reading_after:
            logger.info(f"No readings found for device {device_id}")
            return None
        elif not reading_before:
            return reading_after
        elif not reading_after:
            return reading_before
        else:
            # Calculate time differences
            time_diff_before = abs((timestamp - reading_before.time).total_seconds())
            time_diff_after = abs((reading_after.time - timestamp).total_seconds())

            return reading_before if time_diff_before <= time_diff_after else reading_after

    except SQLAlchemyError as e:
        logger.error(f"Database error finding closest reading: {str(e)}")
        raise DatabaseError(f"Failed to find closest reading: {str(e)}") from e


@with_db_session
def get_readings_in_time_range(device_id: int, start_time: datetime, end_time: datetime, db=None):
    """
    Get all readings for a device within a specified time range.

    Args:
        device_id: The ID of the device
        start_time: The start of the time range
        end_time: The end of the time range
        db: Database session

    Returns:
        List of DeviceReading objects
    """
    try:
        # Check if device exists
        device = db.query(Device).filter(Device.id == device_id).first()
        if not device:
            logger.error(f"Device with id {device_id} not found")
            raise DeviceNotFoundError(f"Device with id {device_id} not found")

        readings = db.query(DeviceReading).filter(
            DeviceReading.device_id == device_id,
            DeviceReading.time >= start_time,
            DeviceReading.time <= end_time
        ).order_by(DeviceReading.time).all()

        return readings

    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving readings in time range: {str(e)}")
        raise DatabaseError(f"Failed to retrieve readings in time range: {str(e)}") from e