import { useState, useEffect, useCallback } from "react";
import { api, type SessionInfo, type MessageInfo, type SourceRef } from "../api/client";

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
      } else {
        const s = await api.createSession("新对话");
        setSessions([s]);
        setCurrentId(s.id);
        localStorage.setItem(SESSION_KEY, String(s.id));
      }
    } catch (e) {
      console.error("load sessions failed", e);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const switchTo = useCallback((id: number) => {
    setCurrentId(id);
    localStorage.setItem(SESSION_KEY, String(id));
  }, []);

  const refreshSessions = useCallback(async () => {
    const list = await api.listSessions();
    setSessions(list);
    return list;
  }, []);

  const removeSession = useCallback(async (id: number) => {
    await api.deleteSession(id);

    const list = await api.listSessions();
    if (list.length === 0) {
      const s = await api.createSession("新对话");
      setSessions([s]);
      setCurrentId(s.id);
      localStorage.setItem(SESSION_KEY, String(s.id));
      setMessages([]);
      return;
    }

    setSessions(list);
    if (currentId === id) {
      const next = list[0];
      setCurrentId(next.id);
      localStorage.setItem(SESSION_KEY, String(next.id));
      setMessages([]);
    }
  }, [currentId]);

  useEffect(() => {
    if (!currentId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.getHistory(currentId)
      .then((hist) => {
        if (!cancelled) setMessages(hist.messages);
      })
      .catch((e) => {
        console.error("load history failed", e);
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentId]);

  const createNew = useCallback(async () => {
    if (currentId && messages.length === 0 && !loading) {
      const current = sessions.find((s) => s.id === currentId);
      if (current) return current;
    }
    const s = await api.createSession("新对话");
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    localStorage.setItem(SESSION_KEY, String(s.id));
    setMessages([]);
    return s;
  }, [currentId, messages.length, loading, sessions]);

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

  /** 给正在流式生成的最后一条消息挂上引用来源 */
  const attachSources = useCallback((sources: SourceRef[]) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant" && last.id < 0) {
        return [...prev.slice(0, -1), { ...last, sources }];
      }
      return prev;
    });
  }, []);

  return {
    sessions, currentId, messages, loading,
    loadSessions, switchTo, createNew, refreshSessions, removeSession,
    appendMessage, appendStreaming, attachSources,
  };
}
