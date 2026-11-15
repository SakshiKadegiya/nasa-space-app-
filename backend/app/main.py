
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.api import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("CLPS Lunar Mission Browser API starting...")
    yield
    print("CLPS Lunar Mission Browser API stopped.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Lunar south-pole mission geometry API "
        "using NASA/JPL SPICE kernels."
    ),
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "documentation": "/docs"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "CLPS Lunar Mission Browser API"
    }


app.include_router(router)
