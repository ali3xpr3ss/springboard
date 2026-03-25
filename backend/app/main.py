import asyncio
import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.auth import router as auth_router
from .api.applicant import router as applicant_router
from .api.employer import router as employer_router
from .api.opportunities import router as opportunities_router
from .api.curator import router as curator_router
from .api.tags import router as tags_router
from .api.upload import router as upload_router
from .db.base import Base
from .db.session import SessionLocal, engine
from .models import Opportunity, OpportunityStatus
from .seed.admin import ensure_admin_curator
from .seed.demo import ensure_demo_data
from .settings import settings


os.makedirs("static/uploads", exist_ok=True)

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
app.include_router(upload_router)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.on_event("startup")
def _startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_admin_curator()
    ensure_demo_data()


@app.on_event("startup")
async def _scheduled_activation() -> None:
    async def _loop() -> None:
        from sqlalchemy import select as sa_select
        while True:
            await asyncio.sleep(60)
            db = SessionLocal()
            try:
                now = datetime.now(timezone.utc)
                rows = list(db.scalars(
                    sa_select(Opportunity)
                    .where(Opportunity.status == OpportunityStatus.scheduled)
                    .where(Opportunity.scheduled_at <= now)
                ).all())
                for o in rows:
                    o.status = OpportunityStatus.pending_moderation
                if rows:
                    db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

    asyncio.create_task(_loop())

