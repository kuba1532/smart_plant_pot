from fastapi import APIRouter
from app.models.example import ExampleInput, ExampleOutput
from app.services.example_service import process_example

router = APIRouter()

# Define a basic health check endpoint
@router.get("/")
def read_root():
    return {"status": "healthy", "message": "Hello from User Server BH"}

# Add additional routes here
@router.get("/health")
def health_check():
    return {"status": "ok"}