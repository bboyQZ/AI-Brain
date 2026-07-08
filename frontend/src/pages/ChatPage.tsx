import { useState, useCallback } from "react";
import SessionSidebar from "../components/chat/SessionSidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import { useSession } from "../hooks/useSession";
import { streamChat } from "../hooks/useChat";
import { api } from "../api/client";
import "./ChatPage.css";

export default function ChatPage() {
  const {
    sessions, currentId, messages, loading,
    switchTo, createNew, appendMessage, appendStreaming,
  } = useSession();
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async (text: string) => {
    let sessionId = currentId;
    if (!sessionId) {
      try {
        const s = await createNew();
        sessionId = s.id;
      } catch {
        appendMessage({
          id: -Date.now(), session_id: 0, role: "assistant",
          content: "无法连接后端，请确认服务已启动（python -m uvicorn app.main:app --port 8000）。",
          created_at: "",
        });
        return;
      }
    }
    setSending(true);
    const userMsg = await api.addMessage(sessionId, "user", text);
    appendMessage(userMsg);
    appendStreaming("assistant", "");

    let assistantContent = "";
    await streamChat(
      sessionId,
      text,
      (delta) => {
        assistantContent += delta;
        appendStreaming("assistant", assistantContent);
      },
      () => {
        setSending(false);
      },
      (err) => {
        appendStreaming("assistant", `（出错了：${err instanceof Error ? err.message : String(err)}）`);
        setSending(false);
      },
    );
  }, [currentId, createNew, appendMessage, appendStreaming]);

  return (
    <div className="chat-page">
      <SessionSidebar
        sessions={sessions}
        currentId={currentId}
        onSwitch={switchTo}
        onCreate={createNew}
      />
      <div className="chat-main">
        <MessageList messages={messages} loading={loading} streaming={sending} />
        <MessageInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
