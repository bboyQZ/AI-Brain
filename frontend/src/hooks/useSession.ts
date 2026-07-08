import { useState, useEffect, useCallback } from "react";
import { api, type SessionInfo, type MessageInfo } from "../api/client";

const SESSION_KEY = "ai-brain-session-id";

export function useSession() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const list = await api.listSessions();
      setSessions(list);
      const saved = localStorage.getItem(SESSION_KEY);
      const savedId = saved ? Number(saved) : null;
      if (savedId && list.some((s) => s.id === savedId)) {
        setCurrentId(savedId);
      } else if (list.length > 0) {
        setCurrentId(list[0].id);
      }
    } catch (e) {
      console.error("load sessions failed", e);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const switchTo = useCallback(async (id: number) => {
    setCurrentId(id);
    localStorage.setItem(SESSION_KEY, String(id));
    setLoading(true);
    try {
      const hist = await api.getHistory(id);
      setMessages(hist.messages);
    } catch (e) {
      console.error("load history failed", e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNew = useCallback(async () => {
    const s = await api.createSession("新对话");
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    localStorage.setItem(SESSION_KEY, String(s.id));
    setMessages([]);
    return s;
  }, []);

  const appendMessage = useCallback((msg: MessageInfo) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const appendStreaming = useCallback((role: string, content: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.id < 0) {
        return [...prev.slice(0, -1), { ...last, content }];
      }
      return [...prev, { id: -Date.now(), session_id: currentId || 0, role, content, created_at: "" }];
    });
  }, [currentId]);

  return {
    sessions, currentId, messages, loading,
    loadSessions, switchTo, createNew, appendMessage, appendStreaming,
  };
}
