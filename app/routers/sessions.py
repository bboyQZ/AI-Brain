# app/routers/sessions.py
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    SessionCreate, SessionUpdate, SessionInfo, MessageCreate, MessageInfo,
    SessionHistory,
)
from app.services.session_store import (
    create_session, add_message, get_history, list_sessions,
    update_session_title, delete_session,
)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionInfo)
def create(req: SessionCreate) -> SessionInfo:
    return create_session(req.title)


@router.get("", response_model=list[SessionInfo])
def list_all() -> list[SessionInfo]:
    return list_sessions()


@router.post("/{session_id}/messages", response_model=MessageInfo)
def add_msg(session_id: int, req: MessageCreate) -> MessageInfo:
    return add_message(session_id, req.role, req.content)


@router.get("/{session_id}", response_model=SessionHistory)
def history(session_id: int) -> SessionHistory:
    sessions = {s.id: s for s in list_sessions()}
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="session not found")
    msgs = get_history(session_id)
    return SessionHistory(session=sessions[session_id], messages=msgs)


@router.patch("/{session_id}", response_model=SessionInfo)
def patch_title(session_id: int, req: SessionUpdate) -> SessionInfo:
    updated = update_session_title(session_id, req.title)
    if updated is None:
        raise HTTPException(status_code=404, detail="session not found")
    return updated


@router.delete("/{session_id}", status_code=204)
def remove_session(session_id: int) -> None:
    ok = delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="session not found")
