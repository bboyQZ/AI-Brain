import type { SessionInfo } from "../../api/client";
import "./SessionSidebar.css";

interface Props {
  sessions: SessionInfo[];
  currentId: number | null;
  onSwitch: (id: number) => void;
  onCreate: () => void;
}

export default function SessionSidebar({ sessions, currentId, onSwitch, onCreate }: Props) {
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
          <button
            key={s.id}
            className={`session-item ${s.id === currentId ? "active" : ""}`}
            onClick={() => onSwitch(s.id)}
          >
            <span className="session-title">{s.title}</span>
            <span className="session-time">{s.created_at.slice(0, 16)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
