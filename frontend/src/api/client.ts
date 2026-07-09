const BASE = import.meta.env.VITE_API_BASE || "/api";

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

export interface SourceRef {
  source: string;       // 文件名，如 lesson-01-token-tokenizer.md
  source_type: string;  // "curriculum" | "note"
  section: string;      // 末级标题
  heading_path: string; // 标题路径，如 "本课目标 > 核心概念 > Token"
}

export interface MessageInfo {
  id: number;
  session_id: number;
  role: string;
  content: string;
  created_at: string;
  sources?: SourceRef[];
}

export interface KnowledgeDocInfo {
  id: string;
  title: string;
  source_type: string; // "curriculum" | "note"
}

export interface KnowledgeDocDetail extends KnowledgeDocInfo {
  content: string;
}

export interface SessionHistory {
  session: SessionInfo;
  messages: MessageInfo[];
}

export interface RagChunkResponse {
  chunks: string[];
  sections: string[];
  chunk_count: number;
  mode: string;
}

export interface RagRetrieveHit {
  content: string;
  score: number;
  source: string;
  section: string;
}

export interface RagRetrieveResponse {
  query: string;
  hits: RagRetrieveHit[];
  total_in_store: number;
  message: string | null;
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

  async updateSessionTitle(id: number, title: string): Promise<SessionInfo> {
    const res = await fetch(`${BASE}/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<SessionInfo>;
  },

  async deleteSession(id: number): Promise<void> {
    const res = await fetch(`${BASE}/sessions/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  },

  chat(sessionId: number, query: string): Promise<Response> {
    return fetch(`${BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, query }),
    });
  },

  async ragChunk(text: string, chunkSize: number, chunkOverlap: number, mode: "simple" | "markdown") {
    const res = await fetch(`${BASE}/rag/chunk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        mode,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<RagChunkResponse>;
  },

  async ragRetrieve(query: string, topK: number = 3) {
    const res = await fetch(`${BASE}/rag/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<RagRetrieveResponse>;
  },

  async listKnowledgeDocs(): Promise<KnowledgeDocInfo[]> {
    const res = await fetch(`${BASE}/knowledge/docs`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getKnowledgeDoc(docId: string): Promise<KnowledgeDocDetail> {
    const res = await fetch(`${BASE}/knowledge/docs/${encodeURIComponent(docId)}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
