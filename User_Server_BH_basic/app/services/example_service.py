from app.models.example import ExampleInput, ExampleOutput

def process_example(data: ExampleInput) -> ExampleOutput:
    message = f"Hello {data.name}, your value is {data.value}."
    return ExampleOutput(message=message)