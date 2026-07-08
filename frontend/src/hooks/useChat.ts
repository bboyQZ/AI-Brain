import { api } from "../api/client";

export async function streamChat(
  sessionId: number,
  query: string,
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: unknown) => void,
) {
  try {
    const resp = await api.chat(sessionId, query);
    if (!resp.ok || !resp.body) {
      onError(new Error(`HTTP ${resp.status}`));
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") { onDone(); return; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) onDelta(parsed.delta);
          } catch { /* skip */ }
        }
      }
    }
    onDone();
  } catch (e) {
    onError(e);
  }
}
