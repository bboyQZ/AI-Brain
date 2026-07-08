import { useEffect, useRef } from "react";
import type { MessageInfo } from "../../api/client";
import { renderMarkdown } from "../../utils/markdown";
import "./MessageList.css";

interface Props {
  messages: MessageInfo[];
  loading: boolean;
  streaming: boolean;
  examplePrompts: string[];
  onSelectPrompt: (prompt: string) => void | Promise<void>;
}

export default function MessageList({
  messages,
  loading,
  streaming,
  examplePrompts,
  onSelectPrompt,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
              />
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
