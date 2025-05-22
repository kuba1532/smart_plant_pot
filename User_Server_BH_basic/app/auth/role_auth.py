from fastapi import HTTPException, Depends


# Assuming you are using something like fastapi-clerk-auth
# from fastapi_clerk_auth import ClerkHTTPBearer, HTTPAuthorizationCredentials
# auth_guard = ClerkHTTPBearer()

def get_user_roles_from_clerk_jwt(decoded_token: dict) -> list[str]:
    """
    Extracts roles from a decoded Clerk JWT.
    Assumes roles are stored in a 'roles' claim as a list of strings.
    Modify if your Clerk setup stores roles differently (e.g., public_metadata).
    """
    # Option 1: Roles directly in a 'roles' claim (common)
    if "roles" in decoded_token and isinstance(decoded_token["roles"], list):
        return decoded_token["roles"]

    # Option 2: Role in public_metadata (as per your original code)
    if ('public_metadata' in decoded_token and
            isinstance(decoded_token['public_metadata'], dict) and
            'role' in decoded_token['public_metadata'] and
            decoded_token['public_metadata']['role']):
        # If it's a single role string, return it as a list
        return [decoded_token['public_metadata']['role']]

    # Option 3: Role in metadata (as per your original code)
    if ('metadata' in decoded_token and
            isinstance(decoded_token['metadata'], dict) and
            'role' in decoded_token['metadata'] and
            decoded_token['metadata']['role']):
        # If it's a single role string, return it as a list
        return [decoded_token['metadata']['role']]

    return []  # Default to no roles if not found


def authorize_role(decoded_token: dict, required_role: str):
    """
    Authorize based on roles in a decoded Clerk JWT.
    """
    user_roles = get_user_roles_from_clerk_jwt(decoded_token)

    if not user_roles and required_role is not None:  # Or handle default "user" role if you prefer
        # If you have a default role for users without explicit roles
        # if required_role == "user": return True
        raise HTTPException(
            status_code=403,
            detail=f"User has no roles assigned. Required role: {required_role}"
        )

    if required_role not in user_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Required role: {required_role}, User roles: {user_roles}"
        )
    return True


def is_matching_role(decoded_token: dict, required_role: str) -> bool:
    """
    Check if user has the required role from a decoded Clerk JWT.
    """
    user_roles = get_user_roles_from_clerk_jwt(decoded_token)

    if not user_roles and required_role is not None:
        # if required_role == "user": return True # For default role
        return False

    return required_role in user_roles

# Example usage in a FastAPI route (if using a library like fastapi-clerk-auth)
# @app.get("/admin-only")
# async def admin_only_route(credentials: HTTPAuthorizationCredentials = Depends(auth_guard)):
#     authorize_role_clerk(credentials.decoded, "admin")
#     return {"message": "Admin access granted"}

# @app.get("/check-editor")
# async def check_editor_route(credentials: HTTPAuthorizationCredentials = Depends(auth_guard)):
#     can_edit = is_matching_role_clerk(credentials.decoded, "editor")
#     if can_edit:
#         return {"message": "User is an editor." }
#     return {"message": "User is not an editor."}