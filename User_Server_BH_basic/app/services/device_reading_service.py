# app/services/device_reading_service.py
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

from app.db.crud.device_readings import (
    create_device_reading,
    update_device_reading,
    delete_device_reading,
    get_device_reading,
    get_device_readings_by_device_id,
    get_latest_device_readings,
    get_reading_closest_to_timestamp,
    get_readings_in_time_range,
    DeviceReadingNotFoundError,
    DeviceReadingAlreadyExistsError,
    DeviceNotFoundError,
    DatabaseError
)
from app.db.models import DeviceReading as DBDeviceReading  # Import for type hinting
from app.models.device_reading import ReadingResponse  # Import for type hinting

# Configure logger
logger = logging.getLogger(__name__)


class DeviceReadingService:
    """Service for managing device readings"""

    def create_reading(self, device_id: int, time: datetime,
                       humidity: Optional[float] = None,
                       light_intensity: Optional[float] = None,
                       temperature: Optional[float] = None) -> Dict[
        str, Any]:  # Returns dict matching ReadingOperationResponse
        """
        Create a new device reading or update if it already exists

        Args:
            device_id: The ID of the device
            time: Timestamp of the reading
            humidity: Humidity reading (optional)
            light_intensity: Light intensity reading (optional)
            temperature: Temperature reading (optional)

        Returns:
            Response indicating the status of the operation
        """
        try:
            reading = create_device_reading(
                device_id=device_id,
                time=time,
                humidity=humidity,
                light_intensity=light_intensity,
                temperature=temperature
            )

            logger.info(f"Reading created/updated: device_id={device_id}, time={time}")

            message = "Reading updated successfully" if reading.humidity == humidity else "Reading created successfully"  # Basic check, might need more robust logic

            return {
                "status": "success",
                "message": message,
                "device_id": device_id,
                "time": time
            }

        except DeviceNotFoundError as e:
            logger.error(f"Device not found: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )
        # DeviceReadingAlreadyExistsError is handled by create_device_reading by updating
        except DatabaseError as e:
            logger.error(f"Database error processing reading creation/update: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process reading creation/update due to database error"
            )

    def update_reading(self, device_id: int, time: datetime,
                       humidity: Optional[float] = None,
                       light_intensity: Optional[float] = None,
                       temperature: Optional[float] = None) -> Dict[
        str, Any]:  # Returns dict matching ReadingOperationResponse
        """
        Update an existing device reading

        Args:
            device_id: The ID of the device
            time: Timestamp of the reading
            humidity: Humidity reading (optional)
            light_intensity: Light intensity reading (optional)
            temperature: Temperature reading (optional)

        Returns:
            Response indicating the status of the operation
        """
        try:
            reading = update_device_reading(
                device_id=device_id,
                time=time,
                humidity=humidity,
                light_intensity=light_intensity,
                temperature=temperature
            )

            logger.info(f"Reading updated: device_id={device_id}, time={time}")

            return {
                "status": "success",
                "message": "Reading updated successfully",
                "device_id": device_id,
                "time": time
            }

        except DeviceReadingNotFoundError as e:
            logger.warning(f"Reading not found for update: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Reading for device {device_id} at time {time} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error processing reading update: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process reading update due to database error"
            )

    def delete_reading(self, device_id: int, time: datetime) -> Dict[
        str, Any]:  # Returns dict matching ReadingOperationResponse (or similar error dict)
        """
        Delete a device reading

        Args:
            device_id: The ID of the device
            time: Timestamp of the reading

        Returns:
            Response indicating the status of the operation
        """
        try:
            result = delete_device_reading(device_id=device_id, time=time)

            if result:
                logger.info(f"Reading deleted: device_id={device_id}, time={time}")
                return {
                    "status": "success",
                    "message": "Reading deleted successfully",
                    "device_id": device_id,
                    "time": time  # time is part of ReadingOperationResponse
                }
            else:
                # This case (reading not found) should ideally raise DeviceReadingNotFoundError from CRUD
                # For consistency, let's ensure delete_device_reading raises if not found or adjust here.
                # Assuming CRUD returns False if not found and doesn't raise.
                logger.warning(f"Reading not found for deletion: device_id={device_id}, time={time}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Reading for device {device_id} at time {time} not found for deletion"
                )


        except DatabaseError as e:
            logger.error(f"Database error processing reading deletion: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process reading deletion due to database error"
            )

    def get_reading(self, device_id: int, time: datetime) -> Optional[DBDeviceReading]:
        """
        Get a specific device reading

        Args:
            device_id: The ID of the device
            time: Timestamp of the reading

        Returns:
            The DBDeviceReading object or None
        """
        try:
            reading = get_device_reading(device_id=device_id, time=time)

            if not reading:
                logger.warning(f"Reading not found: device_id={device_id}, time={time}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Reading for device {device_id} at time {time} not found"
                )
            return reading

        except DatabaseError as e:
            logger.error(f"Database error retrieving reading: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve reading due to database error"
            )

    def get_readings_by_device(self, device_id: int) -> List[DBDeviceReading]:
        """
        Get all readings for a device

        Args:
            device_id: The ID of the device

        Returns:
            List of DBDeviceReading objects
        """
        try:
            return get_device_readings_by_device_id(device_id=device_id)

        except DeviceNotFoundError as e:
            logger.error(f"Device not found: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error retrieving device readings: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve device readings due to database error"
            )

    def get_latest_readings(self, device_id: int, limit: int = 10) -> List[DBDeviceReading]:
        """
        Get the latest readings for a device

        Args:
            device_id: The ID of the device
            limit: Number of readings to return (default 10)

        Returns:
            List of the latest DBDeviceReading objects
        """
        try:
            return get_latest_device_readings(device_id=device_id, limit=limit)

        except DeviceNotFoundError as e:
            logger.error(f"Device not found: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error retrieving latest readings: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve latest readings due to database error"
            )

    def get_reading_near_timestamp(self, device_id: int, timestamp: datetime) -> ReadingResponse:
        """
        Get the reading closest to a specified timestamp, returned as a ReadingResponse Pydantic model.

        Args:
            device_id: The ID of the device
            timestamp: Target timestamp

        Returns:
            The closest reading data as a ReadingResponse object
        """
        try:
            reading_obj = get_reading_closest_to_timestamp(device_id=device_id, timestamp=timestamp)

            if not reading_obj:
                logger.warning(f"No readings found for device: device_id={device_id}")
                raise HTTPException(
                    status_code=404,
                    detail=f"No readings found for device {device_id}"
                )

            # Convert to Pydantic model for response and add time_difference_seconds
            response_data = ReadingResponse.from_orm(reading_obj)
            response_data.time_difference_seconds = abs((timestamp - reading_obj.time).total_seconds())
            return response_data


        except DeviceNotFoundError as e:
            logger.error(f"Device not found: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error finding closest reading: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to find closest reading due to database error"
            )

    def get_readings_in_time_range(self, device_id: int, start_time: datetime, end_time: datetime) -> List[
        DBDeviceReading]:
        """
        Get readings within a specified time range

        Args:
            device_id: The ID of the device
            start_time: Start of the time range
            end_time: End of the time range

        Returns:
            List of DBDeviceReading objects within the time range
        """
        try:
            return get_readings_in_time_range(
                device_id=device_id,
                start_time=start_time,
                end_time=end_time
            )

        except DeviceNotFoundError as e:
            logger.error(f"Device not found: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error retrieving readings in time range: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve readings in time range due to database error"
            )

    def batch_create_readings(self, readings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Create multiple device readings at once

        Args:
            readings: List of reading data dictionaries, each containing
                     device_id, time, and optional sensor readings

        Returns:
            Response indicating the status of the operation
        """
        results = {
            "status": "success",
            "message": "Batch processed",
            "total": len(readings),
            "successful": 0,
            "failed": 0,
            "errors": []
        }

        for reading_data in readings:
            try:
                device_id = reading_data.get("device_id")
                time = reading_data.get("time")

                if not device_id or not time:
                    results["failed"] += 1
                    results["errors"].append({
                        "device_id": device_id,
                        "time": time,
                        "error": "Missing required device_id or time"
                    })
                    continue

                create_device_reading(  # This will update if exists
                    device_id=device_id,
                    time=time,
                    humidity=reading_data.get("humidity"),
                    light_intensity=reading_data.get("light_intensity"),
                    temperature=reading_data.get("temperature")
                )

                results["successful"] += 1

            except (DeviceNotFoundError, DeviceReadingAlreadyExistsError,
                    DatabaseError) as e:  # DeviceReadingAlreadyExistsError handled by update in create_device_reading
                results["failed"] += 1
                results["errors"].append({
                    "device_id": reading_data.get("device_id"),
                    "time": reading_data.get("time"),
                    "error": str(e)
                })

        if results["failed"] > 0:
            logger.warning(f"Batch process completed with {results['failed']} errors")
        else:
            logger.info(f"Batch process completed successfully for {results['successful']} readings")

        return results

    def get_aggregated_readings(self, device_id: int, start_time: datetime, end_time: datetime) -> Dict[
        str, Any]:  # Returns dict matching StatsResponse
        """
        Get aggregated stats for readings in a time range (min/max/avg)

        Args:
            device_id: The ID of the device
            start_time: Start of the time range
            end_time: End of the time range

        Returns:
            Dictionary with aggregated stats
        """
        try:
            readings = get_readings_in_time_range(
                device_id=device_id,
                start_time=start_time,
                end_time=end_time
            )

            if not readings:
                return {
                    "device_id": device_id,
                    "start_time": start_time,
                    "end_time": end_time,
                    "reading_count": 0,
                    "humidity": None,
                    "light_intensity": None,
                    "temperature": None
                }

            # Extract readings and filter out None values
            humidity_readings = [r.humidity for r in readings if r.humidity is not None]
            light_intensity_readings = [r.light_intensity for r in readings if r.light_intensity is not None]
            temperature_readings = [r.temperature for r in readings if r.temperature is not None]

            # Calculate aggregates
            result = {
                "device_id": device_id,
                "start_time": start_time,
                "end_time": end_time,
                "reading_count": len(readings),
                "humidity": {
                    "min": min(humidity_readings) if humidity_readings else None,
                    "max": max(humidity_readings) if humidity_readings else None,
                    "avg": sum(humidity_readings) / len(humidity_readings) if humidity_readings else None
                },
                "light_intensity": {
                    "min": min(light_intensity_readings) if light_intensity_readings else None,
                    "max": max(light_intensity_readings) if light_intensity_readings else None,
                    "avg": sum(light_intensity_readings) / len(
                        light_intensity_readings) if light_intensity_readings else None
                },
                "temperature": {
                    "min": min(temperature_readings) if temperature_readings else None,
                    "max": max(temperature_readings) if temperature_readings else None,
                    "avg": sum(temperature_readings) / len(temperature_readings) if temperature_readings else None
                }
            }

            return result

        except DeviceNotFoundError as e:
            logger.error(f"Device not found: {str(e)}")
            raise HTTPException(
                status_code=404,
                detail=f"Device with id {device_id} not found"
            )

        except DatabaseError as e:
            logger.error(f"Database error retrieving aggregated readings: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve aggregated readings due to database error"
            )