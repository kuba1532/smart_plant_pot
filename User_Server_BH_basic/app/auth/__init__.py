# app/auth/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer
import os

# Configure Clerk
clerk_config = ClerkConfig(
    jwks_url="https://your-clerk-frontend-api.clerk.accounts.dev/.well-known/jwks.json"
)
clerk_auth = ClerkHTTPBearer(config=clerk_config)

# Dependency to get the current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(clerk_auth)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing credentials",
        )
    return credentials.payload  # Contains user claims
