from fastapi import FastAPI

# Create a simplified app for initial testing
app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Hello from User Server BH"}

@app.get("/health")
def health_check():
    return {"status": "ok"}