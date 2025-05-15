# app/auth/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer
from app.core.config import settings
import os

# Configure Clerk
clerk_config = ClerkConfig(
    jwks_url=settings.JWKS_URL,
    audience=settings.CLERK_AUDIENCE
)
clerk_auth = ClerkHTTPBearer(config=clerk_config)

# Dependency to get the current user
async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(clerk_auth)):
    """
    Validates the JWT token and returns the user information.
    """
    try:
        # Try to get the decoded payload
        if hasattr(auth, 'decoded'):
            return auth.decoded
        elif hasattr(auth, 'payload'):
            return auth.payload
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not extract user information from token"
            )
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )