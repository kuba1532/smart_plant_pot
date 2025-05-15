from fastapi import FastAPI
from app.api.endpoints import example, change_settings, send_command, protected, clerk_webhooks, device_reading
from app.db.base import SessionLocal, Base, engine
from app.db.crud.users import create_user

app = FastAPI()

# Include routers
app.include_router(example.router, tags=["Example"])
app.include_router(change_settings.router, tags=["Settings"])
app.include_router(send_command.router, tags=["Command"])
app.include_router(protected.router, tags=["Protected"])
app.include_router(clerk_webhooks.router, prefix="/clerk", tags=["webhook"])
app.include_router(device_reading.router, prefix="/readings", tags=["reading"])

##Base.metadata.drop_all(bind=engine)
##Base.metadata.create_all(bind=engine)

# If you need to create a test user at startup (not recommended for production):
@app.on_event("startup")
def create_test_user():
    create_user("test")