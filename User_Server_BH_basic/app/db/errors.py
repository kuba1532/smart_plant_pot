class DeviceNotFoundError(Exception):
    """Exception raised when a device is not found."""
    pass


class DeviceAlreadyExistsError(Exception):
    """Exception raised when attempting to create a duplicate device."""
    pass


class DatabaseError(Exception):
    """Exception raised for general database errors."""
    pass

class UserNotFoundError(Exception):
    """Exception raised when a user is not found."""
    pass


class UserAlreadyExistsError(Exception):
    """Exception raised when attempting to create a duplicate user."""
    pass


class DeviceTypeNotFoundError(Exception):
    """Exception raised when a device type is not found."""
    pass


class DeviceTypeAlreadyExistsError(Exception):
    """Exception raised when attempting to create a duplicate device type."""
    pass