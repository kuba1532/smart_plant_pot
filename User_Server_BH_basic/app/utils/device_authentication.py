import random
import string

from app.db.crud.device_types import get_all_device_types


def validate_code(unique_key, device_type, valid_device_prefixes):
    """
    Validates a 12-character code (2 device type chars + 9 characters + check character)
    Returns True if valid, False otherwise

    Parameters:
    - code: The code to validate
    - valid_device_prefixes: List of valid 2-character device type prefixes
    """
    # Step 1: Validate basic format (12 alphanumeric characters)
    valid_chars = string.digits + string.ascii_lowercase + string.ascii_uppercase
    if not isinstance(unique_key, str) or len(unique_key) != 12 or not all(c in valid_chars for c in unique_key):
        return False

    device_prefix = unique_key[:2]
    if device_prefix != device_type:
        return False

    # Step 2: Check if the device type prefix is valid
    if device_prefix not in valid_device_prefixes:
        return False

    # Get the main code part (excluding device prefix)
    main_code = unique_key[2:]

    # Convert code to list of characters
    chars = list(main_code)
    check_char = chars.pop()  # Remove and store the last character

    # Map check character to value
    check_value = char_to_value(check_char)

    # Map other characters to values
    values = [char_to_value(c) for c in chars]

    # Calculate the control sum using a weighted algorithm
    weighted_sum = 0
    # Also include the device prefix in the weighted sum to make it part of validation
    for i, c in enumerate([device_prefix[0], device_prefix[1]] + chars):
        weight = 3 if i % 2 == 0 else 7
        weighted_sum += char_to_value(c) * weight

    # Calculate expected check value (mod 62)
    expected_check_value = (62 - (weighted_sum % 62)) % 62

    # Basic control sum check
    if check_value != expected_check_value:
        return False

    # Additional validation rules to restrict valid combinations

    # Rule 1: First and last values must have a specific relationship
    # (sum must be divisible by 3)
    if (values[0] + values[-1]) % 3 != 0:
        return False

    # Rule 2: Code must contain at least one pair of consecutive identical character types
    # (two digits, two lowercase, or two uppercase in a row)
    has_consecutive_pair = False
    for i in range(len(chars) - 1):
        if (chars[i].isdigit() and chars[i + 1].isdigit()) or \
                (chars[i].islower() and chars[i + 1].islower()) or \
                (chars[i].isupper() and chars[i + 1].isupper()):
            has_consecutive_pair = True
            break

    if not has_consecutive_pair:
        return False

    # Rule 3: The sum of the values of the middle three characters must be even
    middle_sum = values[3] + values[4] + values[5]
    if middle_sum % 2 != 0:
        return False

    # Rule 4: Code must contain at least one character from each category
    # (digit, lowercase, uppercase)
    has_digit = any(c.isdigit() for c in chars)
    has_lower = any(c.islower() for c in chars)
    has_upper = any(c.isupper() for c in chars)

    if not (has_digit and has_lower and has_upper):
        return False

    # All validation tests passed
    return True


def value_to_char(value):
    """Convert a numeric value (0-61) to alphanumeric character"""
    if 0 <= value <= 9:
        return str(value)
    elif 10 <= value <= 35:
        return chr(value - 10 + ord('a'))
    elif 36 <= value <= 61:
        return chr(value - 36 + ord('A'))
    else:
        raise ValueError(f"Value {value} out of range")


def char_to_value(c):
    """
    Map character to numeric value (0-61)
    0-9 for digits, 10-35 for lowercase, 36-61 for uppercase
    """
    if c.isdigit():
        return int(c)
    elif c.islower():
        return ord(c) - ord('a') + 10
    else:  # uppercase
        return ord(c) - ord('A') + 36

def validate_device_id(device_id, device_type):
    valid_device_codes = [device_type.type_code for device_type in get_all_device_types()]
    return validate_code(device_id, device_type, valid_device_codes)