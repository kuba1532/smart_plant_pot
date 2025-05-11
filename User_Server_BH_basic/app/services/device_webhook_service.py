import requests
from typing import Tuple
from app.models.change_settings import ChangeSettingsInput
from app.models.send_command import SendCommandInput

# Replace with actual device server endpoint
DEVICE_SERVER_BASE_URL = "https://34.10.121.99:443/api/"
DEVICE_SERVER_UPDATE_SETTINGS_URL = "Settings/update-settings"
DEVICE_SERVER_COMMAND_URL = "Command/send-command"


def send_settings_to_device_server(settings: ChangeSettingsInput) -> Tuple[bool, str]:
    """
    Sends the validated settings to the device server via webhook.

    Returns:
        (success: bool, message: str)
    """
    try:
        # Convert Pydantic model to dictionary with aliased field names
        settings_dict = settings.dict(by_alias=True)

        # Format time objects to strings in the format C# expects
        settings_dict["brightPeriodStart"] = settings.bright_period_start.strftime("%H:%M:%S")
        settings_dict["brightPeriodEnd"] = settings.bright_period_end.strftime("%H:%M:%S")

        response = requests.post(
            DEVICE_SERVER_BASE_URL + DEVICE_SERVER_UPDATE_SETTINGS_URL,
            json=settings_dict,  # Send as dictionary, not JSON string
            timeout=5,  # optional timeout
            verify=False  # Disable SSL verification
        )

        print(f"Request body sent: {settings_dict}")

        if response.status_code == 200:
            return True, "Settings sent successfully to device server."
        else:
            return False, f"Device server responded with status {response.status_code}: {response.text}"

    except requests.RequestException as e:
        return False, f"Failed to send settings to device server: {str(e)}"

def send_command_to_device_server(command: SendCommandInput) -> Tuple[bool, str]:
    try:
        # Convert Pydantic model to dictionary with aliased field names
        command_dict = command.dict(by_alias=True)

        # Format time objects to strings in the format C# expects
        command_dict["waterFor"] = command.water_for.strftime("%H:%M:%S")
        command_dict["illuminateFor"] = command.illuminate_for.strftime("%H:%M:%S")

        response = requests.post(
            DEVICE_SERVER_BASE_URL + DEVICE_SERVER_COMMAND_URL,
            json=command_dict,  # Send as dictionary, not JSON string
            timeout=5,  # optional timeout
            verify=False  # Disable SSL verification
        )

        print(f"Request body sent: {command_dict}")

        if response.status_code == 200:
            return True, "Command sent successfully to device server."
        else:
            return False, f"Device server responded with status {response.status_code}: {response.text}"

    except requests.RequestException as e:
        return False, f"Failed to send command to device server: {str(e)}"