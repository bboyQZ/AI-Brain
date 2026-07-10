import { useState, useEffect, useMemo } from "react";
import { api, type TokenPiece } from "../../api/client";
import { LAB_SAMPLE_LIMITS, takePrefix, truncateHint } from "../../utils/labSample";
import "./TokenizeDemo.css";

type Props = {
  sampleText?: string;
};

export default function TokenizeDemo({ sampleText = "" }: Props) {
  const slice = useMemo(
    () => takePrefix(sampleText, LAB_SAMPLE_LIMITS.tokenizeChars),
    [sampleText],
  );
  const text = slice.text;
  const [tokens, setTokens] = useState<TokenPiece[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!text.trim()) {
        setTokens([]);
        return;
      }
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

  const limitHint = truncateHint(slice);

  return (
    <div className="tokenize-demo">
      <p className="demo-sample-hint">
        输入来自右侧共用「示例文本」
        {limitHint ? `。${limitHint}` : "，修改后当前演示会联动。"}
      </p>

      <div className="tokenize-stats">
        <span className="stat">
          <span className="stat-num">{loading ? "..." : tokens.length}</span>
          <span className="stat-label">Tokens</span>
        </span>
        <span className="stat">
          <span className="stat-num">{text.length}</span>
          <span className="stat-label">参与字符</span>
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
              title={`原文：${JSON.stringify(t.piece)} · ID ${t.id}`}
              onMouseEnter={() => setHoveredId(t.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
            >
              <span className="token-piece">{formatTokenPiece(t.piece)}</span>
              <span className="token-id">{t.id}</span>
            </span>
          );
        })}
        {tokens.length === 0 && !loading && (
          <span className="empty">在右侧写入示例文本后显示 Token 切分</span>
        )}
      </div>

      <div className="token-hint">
        悬停查看原文与 Token ID · 空格显示为 · · 换行显示为 ↵ · 相同 ID 会一起高亮
      </div>
    </div>
  );
}

/** 把空白/控制符变成可见符号，避免芯片里「空白」或方框问号 */
function formatTokenPiece(piece: string): string {
  if (piece === "") return "∅";
  let out = "";
  for (const ch of piece) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === " " || ch === "\u00a0") {
      out += "·";
    } else if (ch === "\n") {
      out += "↵";
    } else if (ch === "\r") {
      out += "␍";
    } else if (ch === "\t") {
      out += "→";
    } else if (code < 32 || code === 0x7f) {
      out += `\\u${code.toString(16).padStart(4, "0")}`;
    } else if (ch === "\uFFFD") {
      out += "[?]";
    } else {
      out += ch;
    }
  }
  return out;
}
