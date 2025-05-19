from fastapi import HTTPException


def authorize_role(user, required_role):
    """
    Authorize a user based on their role in the JWT token.

    Args:
        user: The decoded JWT token payload
        required_role: The role required to access the resource

    Raises:
        HTTPException: If the user doesn't have the required role
    """
    try:
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
            user_role = "user"

    except (KeyError, TypeError) as e:
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