from fastapi import APIRouter, Query

from app.services.ingest_service import run_ingest

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("")
def ingest(reset: bool = Query(False, description="是否清空后全量重建")):
    return run_ingest(reset=reset)
