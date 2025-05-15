from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from app.db.base import SessionLocal, with_db_session
from app.db.models import User
import logging

# Set up logging
logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    """Exception raised when a user is not found."""
    pass


class UserAlreadyExistsError(Exception):
    """Exception raised when attempting to create a duplicate user."""
    pass


class DatabaseError(Exception):
    """Exception raised for general database errors."""
    pass


@with_db_session
def create_user(clerk_id: str, db=None):
    try:
        existing_user = db.query(User).filter(User.clerk_id == clerk_id).first()
        if existing_user:
            return existing_user

        new_user = User(clerk_id=clerk_id)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating user with clerk_id {clerk_id}: {str(e)}")
        raise UserAlreadyExistsError(f"User with clerk_id {clerk_id} already exists") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating user with clerk_id {clerk_id}: {str(e)}")
        raise DatabaseError(f"Failed to create user: {str(e)}") from e


@with_db_session
def delete_user(id: int, db=None):
    try:
        existing_user = db.query(User).filter(User.id == id).first()
        if not existing_user:
            logger.warning(f"Attempted to delete non-existent user with id {id}")
            return False

        db.delete(existing_user)
        db.commit()
        logger.info(f"User with id {id} deleted successfully")
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting user with id {id}: {str(e)}")
        raise DatabaseError(f"Failed to delete user: {str(e)}") from e


@with_db_session
def get_user_by_clerk_id(clerk_id: str, db=None):
    try:
        user = db.query(User).filter(User.clerk_id == clerk_id).first()
        if not user:
            logger.info(f"User with clerk_id {clerk_id} not found")
        return user
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving user with clerk_id {clerk_id}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve user: {str(e)}") from e


@with_db_session
def get_user_by_id(id: int, db=None):
    try:
        user = db.query(User).filter(User.id == id).first()
        if not user:
            logger.info(f"User with id {id} not found")
        return user
    except SQLAlchemyError as e:
        logger.error(f"Database error retrieving user with id {id}: {str(e)}")
        raise DatabaseError(f"Failed to retrieve user: {str(e)}") from e