# app/services/session_store.py
import json

from app.db import get_conn
from app.models.schemas import SessionInfo, MessageInfo, SourceRef


DEFAULT_SESSION_TITLE = "新对话"


def _parse_sources(raw: str | None) -> list[SourceRef]:
    if not raw:
        return []
    try:
        return [SourceRef(**item) for item in json.loads(raw)]
    except (json.JSONDecodeError, TypeError):
        return []


def _derive_session_title(content: str, limit: int = 20) -> str:
    normalized = " ".join(content.split())
    if not normalized:
        return DEFAULT_SESSION_TITLE
    if len(normalized) <= limit:
        return normalized
    return normalized[:limit].rstrip() + "..."


def create_session(title: str) -> SessionInfo:
    conn = get_conn()
    cur = conn.execute("INSERT INTO sessions(title) VALUES (?)", (title,))
    sid = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id=?", (sid,)).fetchone()
    conn.close()
    return SessionInfo(id=row["id"], title=row["title"], created_at=row["created_at"])


def add_message(
    session_id: int, role: str, content: str,
    sources: list[SourceRef] | None = None,
) -> MessageInfo:
    conn = get_conn()

    should_auto_title = False
    if role == "user":
        sess = conn.execute("SELECT title FROM sessions WHERE id=?", (session_id,)).fetchone()
        if sess and sess["title"] == DEFAULT_SESSION_TITLE:
            user_count = conn.execute(
                "SELECT COUNT(*) as c FROM messages WHERE session_id=? AND role='user'",
                (session_id,),
            ).fetchone()["c"]
            should_auto_title = user_count == 0

    sources_json = (
        json.dumps([s.model_dump() for s in sources], ensure_ascii=False)
        if sources else None
    )
    cur = conn.execute(
        "INSERT INTO messages(session_id, role, content, sources) VALUES (?, ?, ?, ?)",
        (session_id, role, content, sources_json),
    )
    mid = cur.lastrowid

    if should_auto_title:
        new_title = _derive_session_title(content)
        conn.execute("UPDATE sessions SET title=? WHERE id=?", (new_title, session_id))

    conn.commit()
    row = conn.execute("SELECT * FROM messages WHERE id=?", (mid,)).fetchone()
    conn.close()
    return MessageInfo(
        id=row["id"], session_id=row["session_id"],
        role=row["role"], content=row["content"], created_at=row["created_at"],
        sources=_parse_sources(row["sources"]),
    )


def update_session_title(session_id: int, title: str) -> SessionInfo | None:
    conn = get_conn()
    conn.execute("UPDATE sessions SET title=? WHERE id=?", (title, session_id))
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return SessionInfo(id=row["id"], title=row["title"], created_at=row["created_at"])


def delete_session(session_id: int) -> bool:
    conn = get_conn()
    conn.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
    cur = conn.execute("DELETE FROM sessions WHERE id=?", (session_id,))
    conn.commit()
    ok = cur.rowcount > 0
    conn.close()
    return ok


def get_history(session_id: int) -> list[MessageInfo]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM messages WHERE session_id=? ORDER BY id", (session_id,)
    ).fetchall()
    conn.close()
    return [
        MessageInfo(id=r["id"], session_id=r["session_id"], role=r["role"],
                    content=r["content"], created_at=r["created_at"],
                    sources=_parse_sources(r["sources"]))
        for r in rows
    ]


def list_sessions() -> list[SessionInfo]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM sessions ORDER BY id DESC").fetchall()
    conn.close()
    return [
        SessionInfo(id=r["id"], title=r["title"], created_at=r["created_at"])
        for r in rows
    ]
