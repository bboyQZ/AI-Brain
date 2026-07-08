const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export interface TokenPiece {
  id: number;
  piece: string;
}

export interface TokenizeResponse {
  text: string;
  token_count: number;
  tokens: TokenPiece[];
  encoding: string;
}

export interface EmbedItem {
  text: string;
  vector: number[];
  dim: number;
}

export interface EmbedResponse {
  items: EmbedItem[];
  model: string;
}

export interface SimilarityPair {
  a: string;
  b: string;
  score: number;
}

export interface SimilarityResponse {
  pairs: SimilarityPair[];
  model: string;
}

export interface AttentionLayer {
  layer: number;
  heads: number[][][];
}

export interface AttentionResponse {
  text: string;
  tokens: string[];
  num_layers: number;
  num_heads: number;
  layers: AttentionLayer[];
  model: string;
}

export interface SessionInfo {
  id: number;
  title: string;
  created_at: string;
}

export interface MessageInfo {
  id: number;
  session_id: number;
  role: string;
  content: string;
  created_at: string;
}

export interface SessionHistory {
  session: SessionInfo;
  messages: MessageInfo[];
}

export const api = {
  async tokenize(text: string) {
    const res = await fetch(`${BASE}/tokenize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.json() as Promise<TokenizeResponse>;
  },

  async embedVectors(texts: string[]) {
    const res = await fetch(`${BASE}/embed/vectors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    return res.json() as Promise<EmbedResponse>;
  },

  async embedSimilarity(pairs: [string, string][]) {
    const res = await fetch(`${BASE}/embed/similarity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairs }),
    });
    return res.json() as Promise<SimilarityResponse>;
  },

  async attention(text: string) {
    const res = await fetch(`${BASE}/attention`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.json() as Promise<AttentionResponse>;
  },

  async createSession(title: string): Promise<SessionInfo> {
    const res = await fetch(`${BASE}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    return res.json();
  },

  async listSessions(): Promise<SessionInfo[]> {
    const res = await fetch(`${BASE}/sessions`);
    return res.json();
  },

  async getHistory(id: number): Promise<SessionHistory> {
    const res = await fetch(`${BASE}/sessions/${id}`);
    return res.json();
  },

  async addMessage(id: number, role: string, content: string): Promise<MessageInfo> {
    const res = await fetch(`${BASE}/sessions/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, content }),
    });
    return res.json();
  },

  chat(sessionId: number, query: string): Promise<Response> {
    return fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, query }),
    });
  },
};
