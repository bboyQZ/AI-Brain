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
    switchTo, createNew, refreshSessions, removeSession,
    appendMessage, appendStreaming, attachSources,
  } = useSession();
  const [sending, setSending] = useState(false);

  const examplePrompts = [
    "什么是 Token？",
    "RAG 是怎么工作的？",
    "帮我解释 Attention。",
  ];

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
    // 首条用户消息会触发后端自动改标题；这里刷新会话列表以同步侧边栏显示
    await refreshSessions();
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
      (sources) => {
        // sources 在首帧先于 delta 到达；先占位再挂引用
        appendStreaming("assistant", assistantContent);
        attachSources(sources);
      },
    );
  }, [currentId, createNew, refreshSessions, appendMessage, appendStreaming, attachSources]);

  return (
    <div className="chat-page">
      <SessionSidebar
        sessions={sessions}
        currentId={currentId}
        onSwitch={switchTo}
        onCreate={createNew}
        onDelete={removeSession}
      />
      <div className="chat-main">
        <div className="chat-main-inner">
          <MessageList
            messages={messages}
            loading={loading}
            streaming={sending}
            examplePrompts={examplePrompts}
            onSelectPrompt={handleSend}
          />
          <MessageInput onSend={handleSend} disabled={sending} />
        </div>
      </div>
    </div>
  );
}
