from fastapi import FastAPI
from app.api.endpoints import example, change_settings, send_command, protected, clerk_webhooks
from app.db.base import SessionLocal, Base, engine

app = FastAPI()

# Include routers
app.include_router(example.router, tags=["Example"])
app.include_router(change_settings.router, tags=["Settings"])
app.include_router(send_command.router, tags=["Command"])
app.include_router(protected.router, tags=["Protected"])
app.include_router(clerk_webhooks.router, prefix="/clerk", tags=["webhook"])

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# If you need to create a test user at startup (not recommended for production):
@app.on_event("startup")
def create_test_user():
    from app.db.models import User

    db = SessionLocal()

    try:
        # Check if user already exists
        test_user = db.query(User).filter(User.clerk_id == "xddddd").first()
        if not test_user:
            db_user = User(clerk_id="xddddd")
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
    finally:
        db.close()