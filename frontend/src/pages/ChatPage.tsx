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
    if (!currentId) return;
    setSending(true);
    const userMsg = await api.addMessage(currentId, "user", text);
    appendMessage(userMsg);
    appendStreaming("assistant", "");

    let assistantContent = "";
    await streamChat(
      currentId,
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
  }, [currentId, appendMessage, appendStreaming]);

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
        <MessageInput onSend={handleSend} disabled={sending || !currentId} />
      </div>
    </div>
  );
}
