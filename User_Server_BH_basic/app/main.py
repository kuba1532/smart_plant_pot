from fastapi import FastAPI
from app.api.endpoints import example, change_settings, send_command, protected, clerk_webhooks, device_reading, device
from app.db.base import SessionLocal, Base, engine
from app.db.crud.users import create_user
from app.auth.device_auth import authorize_device

app = FastAPI()

# Include routers
app.include_router(example.router, tags=["Example"])
app.include_router(change_settings.router, tags=["Settings"])
app.include_router(send_command.router, tags=["Command"])
app.include_router(protected.router, tags=["Protected"])
app.include_router(clerk_webhooks.router, prefix="/clerk", tags=["webhook"])
app.include_router(device_reading.router, prefix="/readings", tags=["reading"])
app.include_router(device.router, prefix="/devices", tags=["devices"])

#Base.metadata.drop_all(bind=engine)
#Base.metadata.create_all(bind=engine)

# If you need to create a test user at startup (not recommended for production):
@app.on_event("startup")
def make_tests():
    create_user("test")