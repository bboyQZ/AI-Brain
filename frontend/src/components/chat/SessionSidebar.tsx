import type { SessionInfo } from "../../api/client";
import "./SessionSidebar.css";

interface Props {
  sessions: SessionInfo[];
  currentId: number | null;
  onSwitch: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void | Promise<void>;
}

export default function SessionSidebar({
  sessions,
  currentId,
  onSwitch,
  onCreate,
  onDelete,
}: Props) {
  return (
    <aside className="session-sidebar">
      <button className="new-session-btn" onClick={onCreate}>
        + 新建对话
      </button>
      <div className="session-list">
        {sessions.length === 0 && (
          <div className="empty-hint">还没有对话</div>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`session-item ${s.id === currentId ? "active" : ""}`}
            onClick={() => onSwitch(s.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSwitch(s.id);
              }
            }}
          >
            <span className="session-title">{s.title}</span>
            <span className="session-time">{s.created_at.slice(0, 16)}</span>
            <button
              type="button"
              className="session-delete-btn"
              aria-label={`删除会话 ${s.title}`}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("确认删除这个对话吗？")) {
                  void onDelete(s.id);
                }
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
