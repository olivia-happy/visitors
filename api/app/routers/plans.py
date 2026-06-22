from fastapi import APIRouter


router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/ping")
def ping_plans() -> dict[str, str]:
    return {"status": "pending"}

