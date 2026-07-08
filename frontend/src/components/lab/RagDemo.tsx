import { useState } from "react";
import { api, type RagRetrieveHit } from "../../api/client";
import "./RagDemo.css";

const SAMPLE_DOC = `Worker 负责从队列拉取任务并执行。若执行失败，任务会进入重试队列，最多重试 3 次。
Redis 用于缓存任务状态。

## FAQ v4.3

新增字段：分类、标签、优先级。

## 测试流程

需求评审 → 用例设计 → 执行 → 回归 → 上线。`;

export default function RagDemo() {
  const [doc, setDoc] = useState(SAMPLE_DOC);
  const [chunkSize, setChunkSize] = useState(120);
  const [chunkOverlap, setChunkOverlap] = useState(30);
  const [chunkMode, setChunkMode] = useState<"simple" | "markdown">("simple");
  const [chunks, setChunks] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [query, setQuery] = useState("Worker 为什么没有执行？");
  const [hits, setHits] = useState<RagRetrieveHit[]>([]);
  const [storeTotal, setStoreTotal] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingChunk, setLoadingChunk] = useState(false);
  const [loadingRetrieve, setLoadingRetrieve] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runChunk = async () => {
    setLoadingChunk(true);
    setError(null);
    try {
      const res = await api.ragChunk(doc, chunkSize, chunkOverlap, chunkMode);
      setChunks(res.chunks);
      setSections(res.sections);
    } catch (e) {
      setError(`切块失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingChunk(false);
    }
  };

  const runRetrieve = async () => {
    setLoadingRetrieve(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.ragRetrieve(query, 3);
      setHits(res.hits);
      setStoreTotal(res.total_in_store);
      setMessage(res.message);
    } catch (e) {
      setError(`检索失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingRetrieve(false);
    }
  };

  return (
    <div className="rag-demo">
      <div className="rag-columns">
        <section className="rag-panel">
          <h3 className="rag-panel-title">① Chunk 切块</h3>
          <label className="demo-label">示例文档</label>
          <textarea
            className="demo-input rag-doc"
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            rows={8}
          />
          <div className="rag-controls">
            <label className="rag-control">
              <span>chunk_size</span>
              <input
                type="number"
                min={40}
                max={800}
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
              />
            </label>
            <label className="rag-control">
              <span>overlap</span>
              <input
                type="number"
                min={0}
                max={200}
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
              />
            </label>
            <label className="rag-control">
              <span>模式</span>
              <select
                value={chunkMode}
                onChange={(e) => setChunkMode(e.target.value as "simple" | "markdown")}
              >
                <option value="simple">固定长度 + 重叠</option>
                <option value="markdown">Markdown 按标题</option>
              </select>
            </label>
          </div>
          <button className="demo-btn" onClick={runChunk} disabled={loadingChunk}>
            {loadingChunk ? "切块中..." : "执行切块"}
          </button>
          {chunks.length > 0 && (
            <div className="chunk-list">
              {chunks.map((c, i) => (
                <div key={i} className="chunk-card">
                  <div className="chunk-meta">
                    Chunk {i + 1}
                    {sections[i] ? ` · ${sections[i]}` : ""}
                    <span className="chunk-len">{c.length} 字</span>
                  </div>
                  <pre className="chunk-text">{c}</pre>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rag-panel">
          <h3 className="rag-panel-title">② Retriever 检索</h3>
          <p className="rag-hint">
            从已入库的课程向量库检索（需先运行 ingest）。对应 Lesson 6～7：RAG 流程。
          </p>
          <label className="demo-label">用户问题</label>
          <input
            className="demo-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="demo-btn" onClick={runRetrieve} disabled={loadingRetrieve}>
            {loadingRetrieve ? "检索中..." : "检索 Top 3"}
          </button>
          {storeTotal !== null && (
            <div className="rag-store-info">向量库共 {storeTotal} 条</div>
          )}
          {message && <div className="rag-warn">{message}</div>}
          {hits.length > 0 && (
            <div className="hit-list">
              {hits.map((h, i) => (
                <div key={i} className="hit-card">
                  <div className="hit-meta">
                    <span className="hit-rank">#{i + 1}</span>
                    <span className="hit-score">相似度 {h.score.toFixed(4)}</span>
                    {h.source && <span className="hit-src">{h.source}</span>}
                  </div>
                  {h.section && <div className="hit-section">{h.section}</div>}
                  <pre className="hit-text">{h.content}</pre>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {error && <div className="demo-error">{error}</div>}

      <div className="rag-flow">
        用户问题 → Chunk → Embedding → 向量库 → Retriever → 拼 Prompt → LLM
      </div>
    </div>
  );
}
