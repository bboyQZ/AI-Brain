import { api, type SourceRef } from "../api/client";

export async function streamChat(
  sessionId: number,
  query: string,
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: unknown) => void,
  onSources?: (sources: SourceRef[]) => void,
) {
  try {
    const resp = await api.chat(sessionId, query);
    if (!resp.ok || !resp.body) {
      onError(new Error(`HTTP ${resp.status}`));
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder("utf-8");
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
            if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
              onSources?.(parsed.sources as SourceRef[]);
            }
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
