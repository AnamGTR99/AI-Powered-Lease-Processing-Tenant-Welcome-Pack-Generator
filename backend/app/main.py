import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.auth import get_current_user
from app.routers import lease as lease_router
from app.routers import welcome_pack as welcome_pack_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Acme Lease Processor API",
    description="AI-powered lease extraction and Tenant Welcome Pack generation",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(lease_router.router)
app.include_router(welcome_pack_router.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id}
