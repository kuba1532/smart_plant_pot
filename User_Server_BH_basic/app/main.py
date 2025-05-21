from fastapi import FastAPI
from app.api.endpoints import example, change_settings, send_command, protected, clerk_webhooks, device_reading, device, \
    user
from app.db.base import SessionLocal, Base, engine
from app.db.crud.users import create_user
from app.auth.device_auth import authorize_device
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
# Include routers
app.include_router(example.router, tags=["Example"])
app.include_router(change_settings.router, prefix="/actions", tags=["Device Actions"]) # Grouped actions
app.include_router(send_command.router, prefix="/actions", tags=["Device Actions"])    # Grouped actions
app.include_router(protected.router, tags=["Protected"])
app.include_router(clerk_webhooks.router, prefix="/clerk", tags=["Clerk Webhooks"]) # More specific tag
app.include_router(device_reading.router, prefix="/devices", tags=["Device Readings"]) # Nested under devices logically
app.include_router(device.router, prefix="/devices", tags=["Devices"])
app.include_router(user.router, prefix="/users", tags=["Users"]) # Added user router

# Base.metadata.drop_all(bind=engine)
# Base.metadata.create_all(bind=engine)

# If you need to create a test user at startup (not recommended for production):
@app.on_event("startup")
def make_tests():
    create_user("test")