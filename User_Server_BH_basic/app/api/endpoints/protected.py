# app/api/endpoints/protected.py

from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/protected")
async def protected_route(user=Depends(get_current_user)):
    # Now user is the decoded JWT payload (dict-like)
    print(user)
    print(user['metadata']['role'])
    return {"message": f"Hello, {user['sub']}! This is a protected route."}