import { useEffect, useRef } from "react";
import type { MessageInfo } from "../../api/client";
import { renderMarkdown } from "../../utils/markdown";
import "./MessageList.css";

interface Props {
  messages: MessageInfo[];
  loading: boolean;
  streaming: boolean;
}

export default function MessageList({ messages, loading, streaming }: Props) {
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
            和你的课程知识库对话。输入问题即可开始，或点击左侧「新建对话」。
          </div>
        </div>
      )}
      {loading && <div className="loading-hint">加载中...</div>}
      {messages.map((m) => (
        <div key={m.id} className={`message ${m.role}`}>
          <div className="message-role">{m.role === "user" ? "你" : "AI"}</div>
          {m.role === "assistant" ? (
            <div
              className="message-content markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
            />
          ) : (
            <div className="message-content">{m.content}</div>
          )}
        </div>
      ))}
      {streaming && messages[messages.length - 1]?.role !== "assistant" && (
        <div className="message assistant">
          <div className="message-role">AI</div>
          <div className="message-content typing">思考中...</div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
