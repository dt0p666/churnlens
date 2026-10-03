import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.database import init_db
from api.routes import health, model, prediction, batch, explain, analytics, whatif, business, monitoring

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title="ChurnLens ML Intelligence Platform",
    description="Production Machine Learning Platform for Telecom Churn Prediction, Explainability, and Simulation.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(health.router)
app.include_router(model.router)
app.include_router(prediction.router)
app.include_router(batch.router)
app.include_router(explain.router)
app.include_router(analytics.router)
app.include_router(whatif.router)
app.include_router(business.router)
app.include_router(monitoring.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
