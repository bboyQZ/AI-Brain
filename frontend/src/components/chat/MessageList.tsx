import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, type MessageInfo, type KnowledgeDocInfo, type SourceRef } from "../../api/client";
import { renderMarkdown, resolveCitation } from "../../utils/markdown";
import "./MessageList.css";

interface Props {
  messages: MessageInfo[];
  loading: boolean;
  streaming: boolean;
  examplePrompts: string[];
  onSelectPrompt: (prompt: string) => void | Promise<void>;
}

function lastHeading(headingPath: string): string {
  const parts = headingPath.split(">").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || "";
}

function knowledgeUrl(source: string, loc?: string): string {
  const base = `/knowledge/${encodeURIComponent(source)}`;
  return loc ? `${base}?loc=${encodeURIComponent(loc)}` : base;
}

function SourceChips({ sources, onOpen }: {
  sources: SourceRef[];
  onOpen: (url: string) => void;
}) {
  return (
    <div className="source-chips">
      <span className="source-chips-label">引用来源</span>
      {sources.map((s, i) => {
        const heading = lastHeading(s.heading_path) || s.section;
        const display = s.heading_path || s.section || s.source;
        return (
          <button
            key={`${s.source}-${s.heading_path}-${i}`}
            type="button"
            className="source-chip"
            title={`${s.source}${display ? ` · ${display}` : ""}`}
            onClick={() => onOpen(knowledgeUrl(s.source, heading || undefined))}
          >
            <span className={`source-chip-badge ${s.source_type}`}>
              {s.source_type === "note" ? "笔记" : "课程"}
            </span>
            <span className="source-chip-text">{display}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function MessageList({
  messages,
  loading,
  streaming,
  examplePrompts,
  onSelectPrompt,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<KnowledgeDocInfo[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** 内联 [引自：...] 标签点击：懒加载文档列表后尽力匹配，未命中则无动作 */
  const handleContentClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest(".source-tag") as HTMLElement | null;
    if (!target) return;
    const cite = target.dataset.cite;
    if (!cite) return;
    if (!docsRef.current) {
      try {
        docsRef.current = await api.listKnowledgeDocs();
      } catch {
        return;
      }
    }
    const hit = resolveCitation(cite, docsRef.current);
    if (hit) {
      // 引用文本里的章节信息不可靠，仅跳到文档
      navigate(knowledgeUrl(hit.docId));
    }
  }, [navigate]);

  return (
    <div className="message-list">
      {messages.length === 0 && !loading && (
        <div className="welcome">
          <div className="welcome-icon">🧠</div>
          <div className="welcome-title">AI-Brain Chat</div>
          <div className="welcome-subtitle">
            和你的课程知识库对话。输入问题即可开始，或点击下面示例问题。
          </div>
          <div className="welcome-prompts">
            {examplePrompts.map((p) => (
              <button
                key={p}
                type="button"
                className="prompt-chip"
                onClick={() => void onSelectPrompt(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      {loading && <div className="loading-hint">加载中...</div>}
      {messages.map((m) => (
        <div key={m.id} className={`message-row ${m.role}`}>
          <div className={`message-avatar ${m.role}`} aria-hidden="true">
            {m.role === "user" ? "你" : "🧠"}
          </div>
          {m.role === "assistant" ? (
            <div className={`message-bubble ${m.role}`}>
              <div
                className="message-content markdown"
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
              />
              {m.sources && m.sources.length > 0 && (
                <SourceChips sources={m.sources} onOpen={navigate} />
              )}
            </div>
          ) : (
            <div className={`message-bubble ${m.role}`}>
              <div className="message-content">{m.content}</div>
            </div>
          )}
        </div>
      ))}
      {streaming && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="message-row assistant">
          <div className="message-avatar assistant" aria-hidden="true">🧠</div>
          <div className="message-bubble assistant">
            <div className="message-content typing">
              思考中
              <span className="typing-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
