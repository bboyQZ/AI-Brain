import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { api, type AttentionResponse } from "../../api/client";
import { LAB_SAMPLE_LIMITS, takePrefix, truncateHint } from "../../utils/labSample";
import "./AttentionDemo.css";

type Props = {
  sampleText?: string;
};

export default function AttentionDemo({ sampleText = "" }: Props) {
  const slice = useMemo(
    () => takePrefix(sampleText, LAB_SAMPLE_LIMITS.attentionChars),
    [sampleText],
  );
  const text = slice.text;
  const [data, setData] = useState<AttentionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [layer, setLayer] = useState(0);
  const [head, setHead] = useState(0);
  const [hoverCell, setHoverCell] = useState<{ q: number; k: number } | null>(null);
  const [lockedQ, setLockedQ] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchAttention = useCallback(async () => {
    if (!text.trim()) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.attention(text);
      setData(res);
      setLayer(0);
      setHead(0);
      setLockedQ(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [text]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void fetchAttention();
    }, 300);
    return () => window.clearTimeout(t);
  }, [fetchAttention]);

  const limitHint = truncateHint(slice);

  const tokens = data?.tokens || [];
  const seqLen = tokens.length;
  const currentLayer = data?.layers[layer];
  const weights = currentLayer?.heads[head] || [];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || weights.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellSize = Math.max(28, Math.min(60, 600 / seqLen));
    const gap = 2;
    const total = cellSize + gap;
    canvas.width = tokens.length * total + 60;
    canvas.height = tokens.length * total + 60;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const activeQ = lockedQ ?? hoverCell?.q ?? -1;
    const activeK = hoverCell?.k ?? -1;

    for (let q = 0; q < seqLen; q++) {
      const yLabel = tokens[q];
      ctx.fillStyle = q === activeQ ? "#0ea5e9" : "#64748b";
      ctx.fillText(yLabel, 28, 60 + q * total + cellSize / 2);

      for (let k = 0; k < seqLen; k++) {
        if (q === 0) {
          ctx.fillStyle = k === activeK ? "#0ea5e9" : "#64748b";
          ctx.fillText(tokens[k], 60 + k * total + cellSize / 2, 28);
        }
        const w = weights[q]?.[k] ?? 0;
        const r = Math.round(14 + w * 40);
        const g = Math.round(165 - w * 40);
        const b = Math.round(233 - w * 40);
        const alpha = lockedQ !== null && lockedQ !== q ? 0.15 : 1;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * (0.15 + w * 0.85)})`;

        const x = 60 + k * total;
        const y = 60 + q * total;
        const isActive = (q === activeQ || k === activeK) && lockedQ === null;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 4);
        ctx.fill();

        if (isActive) {
          ctx.strokeStyle = "#0ea5e9";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }
  }, [weights, tokens, seqLen, hoverCell, lockedQ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (lockedQ !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellSize = Math.max(28, Math.min(60, 600 / seqLen));
    const total = cellSize + 2;
    const k = Math.floor((x - 60) / total);
    const q = Math.floor((y - 60) / total);
    if (q >= 0 && q < seqLen && k >= 0 && k < seqLen) {
      setHoverCell({ q, k });
    } else {
      setHoverCell(null);
    }
  };

  const handleClick = () => {
    if (lockedQ !== null) {
      setLockedQ(null);
    } else if (hoverCell) {
      setLockedQ(hoverCell.q);
    }
  };

  return (
    <div className="attention-demo">
      <p className="demo-sample-hint">
        输入来自右侧共用「示例文本」
        {limitHint
          ? `。${limitHint}（注意力矩阵随长度平方增长）`
          : "，修改后会自动重新分析。"}
      </p>
      {text.trim() && (
        <p className="demo-sample-used">
          本次分析：<code>{text}</code>
        </p>
      )}
      <div className="attn-input-row">
        <button type="button" className="demo-btn" onClick={fetchAttention} disabled={loading || !text.trim()}>
          {loading ? "计算中..." : "重新分析"}
        </button>
      </div>

      {data && (
        <>
          <div className="attn-controls">
            <label>
              Layer
              <select value={layer} onChange={(e) => setLayer(Number(e.target.value))}>
                {Array.from({ length: data.num_layers }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            <label>
              Head
              <select value={head} onChange={(e) => setHead(Number(e.target.value))}>
                {Array.from({ length: data.num_heads }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            {lockedQ !== null && (
              <button className="demo-btn" onClick={() => setLockedQ(null)}>
                解除锁定（{tokens[lockedQ]}）
              </button>
            )}
          </div>

          <div className="attn-canvas-wrap">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverCell(null)}
              onClick={handleClick}
            />
          </div>

          <div className="attn-hint">
            悬停查看权重 · 点击行锁定（高亮该 token 对所有 token 的注意力）· 颜色越亮权重越高
          </div>
        </>
      )}
    </div>
  );
}
