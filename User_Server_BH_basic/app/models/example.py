from pydantic import BaseModel

class ExampleInput(BaseModel):
    name: str
    value: int

class ExampleOutput(BaseModel):
    message: str
