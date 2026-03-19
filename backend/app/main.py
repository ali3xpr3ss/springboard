from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.auth import router as auth_router
from .api.applicant import router as applicant_router
from .api.employer import router as employer_router
from .api.opportunities import router as opportunities_router
from .api.curator import router as curator_router
from .api.tags import router as tags_router
from .db.base import Base
from .db.session import engine
from .seed.admin import ensure_admin_curator
from .seed.demo import ensure_demo_data
from .settings import settings


app = FastAPI(title="Трамплин API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


app.include_router(auth_router)
app.include_router(applicant_router)
app.include_router(employer_router)
app.include_router(opportunities_router)
app.include_router(curator_router)
app.include_router(tags_router)


@app.on_event("startup")
def _startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_admin_curator()
    ensure_demo_data()

