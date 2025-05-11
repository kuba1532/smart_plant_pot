from fastapi import APIRouter
from app.models.example import ExampleInput, ExampleOutput
from app.services.example_service import process_example

router = APIRouter()

@router.post("/", response_model=ExampleOutput)
def handle_example(data: ExampleInput):
    return process_example(data)
