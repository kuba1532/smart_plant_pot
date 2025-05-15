# app/db/models.py
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Float, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_id = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    devices = relationship("Device", back_populates="owner")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Add this line to create the foreign key
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    owner = relationship("User", back_populates="devices")
    readings = relationship("DeviceReading", back_populates="device")


class DeviceReading(Base):
    __tablename__ = "device_readings"

    # Using time and device_id as a composite primary key
    time = Column(DateTime(timezone=True), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)

    # Sensor readings
    humidity = Column(Float)  # REAL in PostgreSQL maps to Float in SQLAlchemy
    light_intensity = Column(Float)
    temperature = Column(Float)

    # Set up composite primary key
    __table_args__ = (
        PrimaryKeyConstraint('time', 'device_id'),
    )

    # Relationship
    device = relationship("Device", back_populates="readings")