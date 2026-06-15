from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} starting...")
    logger.info(f"📦 Environment: {settings.environment}")
    yield
    logger.info(f"🛑 {settings.app_name} shutting down...")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered Git commit analyzer",
    docs_url="/docs" if settings.debug else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "https://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

from app.routers import github, analyze
app.include_router(github.router, prefix="/api/v1/github", tags=["github"])
app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["analyze"])

@app.get("/health", tags=["system"])
async def health():
    return {"status": "healthy", "app": settings.app_name, "version": settings.app_version}

@app.get("/", tags=["system"])
async def root():
    return {"message": f"Welcome to {settings.app_name} API", "docs": "/docs"}