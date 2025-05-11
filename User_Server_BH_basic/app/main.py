from fastapi import FastAPI
from app.api.endpoints import example, change_settings, send_command  # ✅ import change_settings
app = FastAPI()

# Include routers
# Include routers
app.include_router(example.router, prefix="/example", tags=["Example"])
app.include_router(change_settings.router, tags=["Settings"])  # ✅ add this line
app.include_router(send_command.router, tags=["Command"])