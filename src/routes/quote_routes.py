from fastapi import APIRouter
from src.services.quote_service import run_quote_workflow
from src.types.freight import FreightRequest

router = APIRouter(prefix="/api")

@router.get("/health")
def health() -> dict:
    return {"status": "ok"}

@router.post("/quote")
def quote(payload: FreightRequest) -> dict:
    return run_quote_workflow(payload)
