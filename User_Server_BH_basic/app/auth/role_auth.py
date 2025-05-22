from fastapi import HTTPException


def authorize_role(user, required_role):
    """
    Authorize a user based on their role in the JWT token.

    Args:
        user: The User object or decoded JWT token payload
        required_role: The role required to access the resource

    Raises:
        HTTPException: If the user doesn't have the required role
    """
    try:
        # Check if user is a dictionary (JWT payload)
        if isinstance(user, dict):
            # First check if public_metadata exists in the token with a valid role
            if ('public_metadata' in user and
                    'role' in user['public_metadata'] and
                    user['public_metadata']['role']):
                user_role = user['public_metadata']['role']
            # Next check if metadata exists with a valid role
            elif ('metadata' in user and
                  'role' in user['metadata'] and
                  user['metadata']['role']):
                user_role = user['metadata']['role']
            else:
                # If no valid role is found, set a default
                print("debug1")
                user_role = "user"
        else:
            # Check if user is a User object
            # Try to access attributes instead of using bracket notation
            if hasattr(user, 'public_metadata') and hasattr(user.public_metadata, 'role') and user.public_metadata.role:
                user_role = user.public_metadata.role
            elif hasattr(user, 'metadata') and hasattr(user.metadata, 'role') and user.metadata.role:
                user_role = user.metadata.role
            elif hasattr(user, 'public_metadata') and isinstance(user.public_metadata, dict) and user.public_metadata[
                'role']:
                user_role = user.public_metadata['role']
            elif hasattr(user, 'metadata') and isinstance(user.metadata, dict) and user.metadata['role']:
                user_role = user.metadata['role']
            else:
                print("debug2")
                user_role = "user"

    except (KeyError, TypeError, AttributeError) as e:
        raise HTTPException(
            status_code=403,
            detail=f"Cannot extract role from token: {str(e)}"
        )

    # Check if the user has the required role
    if required_role != user_role:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Required role: {required_role}, User role: {user_role}"
        )

    # If we get here, the user is authorized
    return True


def is_matching_role(user, required_role):
    """
    Check if user has the required role without raising an exception.

    Args:
        user: The User object or decoded JWT token payload
        required_role: The role required to access the resource

    Returns:
        bool: True if the user has the required role, False otherwise
    """
    try:
        # Check if user is a dictionary (JWT payload)
        if isinstance(user, dict):
            # First check if public_metadata exists in the token with a valid role
            if ('public_metadata' in user and
                    'role' in user['public_metadata'] and
                    user['public_metadata']['role']):
                user_role = user['public_metadata']['role']
            # Next check if metadata exists with a valid role
            elif ('metadata' in user and
                  'role' in user['metadata'] and
                  user['metadata']['role']):
                user_role = user['metadata']['role']
            else:
                # If no valid role is found, set a default
                print("debug1")
                user_role = "user"
        else:
            # Check if user is a User object
            # Try to access attributes instead of using bracket notation
            if hasattr(user, 'public_metadata') and hasattr(user.public_metadata, 'role') and user.public_metadata.role:
                user_role = user.public_metadata.role
            elif hasattr(user, 'metadata') and hasattr(user.metadata, 'role') and user.metadata.role:
                user_role = user.metadata.role
            elif hasattr(user, 'public_metadata') and isinstance(user.public_metadata, dict) and user.public_metadata[
                'role']:
                user_role = user.public_metadata['role']
            elif hasattr(user, 'metadata') and isinstance(user.metadata, dict) and user.metadata['role']:
                user_role = user.metadata['role']
            else:
                print("debug2")
                user_role = "user"

        print("user role " + user_role)
        print("required role " + required_role)
        print(user)

    except (KeyError, TypeError, AttributeError):
        # If we can't extract a role, default to non-matching
        return False

    # Check if the user has the required role
    return required_role == user_role