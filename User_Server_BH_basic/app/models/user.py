# app/models/user.py
from pydantic import BaseModel
from datetime import datetime

class UserResponse(BaseModel):
    id: int
    clerk_id: str
    created_at: datetime

    class Config:
        orm_mode = True