import { useState, useEffect, useMemo } from "react";
import { api, type TokenPiece } from "../../api/client";
import "./TokenizeDemo.css";

export default function TokenizeDemo() {
  const [text, setText] = useState("Hello, 世界！");
  const [tokens, setTokens] = useState<TokenPiece[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!text) { setTokens([]); return; }
      setLoading(true);
      try {
        const res = await api.tokenize(text);
        setTokens(res.tokens);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  const idCounts = useMemo(() => {
    const m = new Map<number, number>();
    tokens.forEach((t) => m.set(t.id, (m.get(t.id) || 0) + 1));
    return m;
  }, [tokens]);

  const cost = useMemo(() => {
    const inputCostPer1K = 0.03;
    return ((tokens.length / 1000) * inputCostPer1K).toFixed(5);
  }, [tokens.length]);

  return (
    <div className="tokenize-demo">
      <div className="demo-section">
        <label className="demo-label">输入文本</label>
        <textarea
          className="demo-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入文字，实时看 Token 切分"
          rows={2}
        />
      </div>

      <div className="tokenize-stats">
        <span className="stat">
          <span className="stat-num">{loading ? "..." : tokens.length}</span>
          <span className="stat-label">Tokens</span>
        </span>
        <span className="stat">
          <span className="stat-num">{text.length}</span>
          <span className="stat-label">字符数</span>
        </span>
        <span className="stat">
          <span className="stat-num">${cost}</span>
          <span className="stat-label">估算费用 (GPT-4 input)</span>
        </span>
      </div>

      <div className="token-grid">
        {tokens.map((t, i) => {
          const isDup = idCounts.get(t.id)! > 1;
          const isHovered = hoveredId === t.id;
          return (
            <span
              key={i}
              className={`token-chip ${isHovered ? "hovered" : ""} ${isDup && isHovered ? "dup" : ""}`}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
            >
              <span className="token-piece">{t.piece}</span>
              <span className="token-id">{t.id}</span>
            </span>
          );
        })}
        {tokens.length === 0 && !loading && (
          <span className="empty">输入文本后显示 Token 切分</span>
        )}
      </div>

      <div className="token-hint">
        悬停查看 Token ID · 相同 ID 的 token 会高亮 · 1 中文字符通常 ≈ 1-2 tokens
      </div>
    </div>
  );
}
