from fastapi import FastAPI

from app.routers.health import router as health_router
from app.routers.plans import router as plans_router


app = FastAPI(title="Visitors Planner API")
app.include_router(health_router)
app.include_router(plans_router)

