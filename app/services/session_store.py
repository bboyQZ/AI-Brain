# app/services/session_store.py
from app.db import get_conn
from app.models.schemas import SessionInfo, MessageInfo


def create_session(title: str) -> SessionInfo:
    conn = get_conn()
    cur = conn.execute("INSERT INTO sessions(title) VALUES (?)", (title,))
    sid = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id=?", (sid,)).fetchone()
    conn.close()
    return SessionInfo(id=row["id"], title=row["title"], created_at=row["created_at"])


def add_message(session_id: int, role: str, content: str) -> MessageInfo:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO messages(session_id, role, content) VALUES (?, ?, ?)",
        (session_id, role, content),
    )
    mid = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM messages WHERE id=?", (mid,)).fetchone()
    conn.close()
    return MessageInfo(
        id=row["id"], session_id=row["session_id"],
        role=row["role"], content=row["content"], created_at=row["created_at"],
    )


def get_history(session_id: int) -> list[MessageInfo]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM messages WHERE session_id=? ORDER BY id", (session_id,)
    ).fetchall()
    conn.close()
    return [
        MessageInfo(id=r["id"], session_id=r["session_id"], role=r["role"],
                    content=r["content"], created_at=r["created_at"])
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
