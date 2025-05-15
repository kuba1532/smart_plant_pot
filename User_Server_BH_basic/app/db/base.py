# app/db/base.py
from functools import wraps

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings

settings = Settings()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def with_db_session(func):
    @wraps(func)
    def wrapper(*args, db=None, **kwargs):
        # Create session if none provided
        local_session = False
        if db is None:
            db = SessionLocal()
            local_session = True

        try:
            result = func(*args, db=db, **kwargs)
            return result
        finally:
            if local_session:
                db.close()

    return wrapper