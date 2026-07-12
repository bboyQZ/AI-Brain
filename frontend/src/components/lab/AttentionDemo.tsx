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

  const activeQ = lockedQ ?? hoverCell?.q ?? null;

  const topTargets = useMemo(() => {
    if (activeQ === null || !weights[activeQ]) return [];
    return weights[activeQ]
      .map((weight, k) => ({ token: tokens[k], weight, k }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [activeQ, weights, tokens]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || weights.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const labelPad = 88;
    const cellSize = Math.max(28, Math.min(60, 600 / seqLen));
    const gap = 2;
    const total = cellSize + gap;
    canvas.width = tokens.length * total + labelPad;
    canvas.height = tokens.length * total + labelPad;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const activeK = hoverCell?.k ?? -1;
    const focusQ = lockedQ ?? hoverCell?.q ?? -1;

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("被看谁（Key）→", labelPad + (tokens.length * total) / 2, 22);
    ctx.save();
    ctx.translate(22, labelPad + (tokens.length * total) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("正在看谁（Query）↓", 0, 0);
    ctx.restore();
    ctx.font = "12px monospace";

    for (let q = 0; q < seqLen; q++) {
      const yLabel = tokens[q];
      ctx.fillStyle = q === focusQ ? "#0ea5e9" : "#64748b";
      ctx.font = q === focusQ ? "bold 12px monospace" : "12px monospace";
      ctx.fillText(yLabel, labelPad - 28, labelPad + q * total + cellSize / 2);
      ctx.font = "12px monospace";

      for (let k = 0; k < seqLen; k++) {
        if (q === 0) {
          ctx.fillStyle = k === activeK ? "#0ea5e9" : "#64748b";
          ctx.font = k === activeK ? "bold 12px monospace" : "12px monospace";
          ctx.fillText(tokens[k], labelPad + k * total + cellSize / 2, labelPad - 28);
          ctx.font = "12px monospace";
        }
        const w = weights[q]?.[k] ?? 0;
        const r = Math.round(14 + w * 40);
        const g = Math.round(165 - w * 40);
        const b = Math.round(233 - w * 40);
        const rowDimmed = lockedQ !== null && lockedQ !== q;
        const alpha = rowDimmed ? 0.12 : 0.15 + w * 0.85;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;

        const x = labelPad + k * total;
        const y = labelPad + q * total;
        const isHoveredCell = hoverCell?.q === q && hoverCell?.k === k;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 4);
        ctx.fill();

        if (isHoveredCell || (lockedQ === q && k === activeK)) {
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

  const resolveCell = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const labelPad = 88;
    const cellSize = Math.max(28, Math.min(60, 600 / seqLen));
    const total = cellSize + 2;
    const k = Math.floor((x - labelPad) / total);
    const q = Math.floor((y - labelPad) / total);
    if (q >= 0 && q < seqLen && k >= 0 && k < seqLen) {
      return { q, k };
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = resolveCell(e.clientX, e.clientY);
    if (!cell) {
      setHoverCell(null);
      return;
    }
    setHoverCell(lockedQ !== null ? { q: lockedQ, k: cell.k } : cell);
  };

  const hoverWeight =
    hoverCell && weights.length > 0
      ? weights[hoverCell.q]?.[hoverCell.k] ?? 0
      : null;

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
          <div className="attn-guide">
            <p><strong>怎么读这张图？</strong></p>
            <ul>
              <li><strong>左边</strong>是「正在看谁」——模型处理到这一行 token 时，要决定去看谁。</li>
              <li><strong>上边</strong>是「被看谁」——这一列 token 可能被前面的 token 关注。</li>
              <li><strong>格子</strong>越亮 = 左边这一行对上边这一列的关注越高（一行加起来约 100%）。</li>
            </ul>
            <p className="attn-guide-note">[CLS] / [SEP] 是模型自动加的特殊标记，可暂时忽略。</p>
          </div>

          <div className="attn-controls">
            <label>
              层（Layer）
              <select value={layer} onChange={(e) => setLayer(Number(e.target.value))}>
                {Array.from({ length: data.num_layers }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            <label>
              头（Head）
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

          <div className="attn-legend" aria-hidden="true">
            <span className="attn-legend-label">低</span>
            <span className="attn-legend-bar" />
            <span className="attn-legend-label">高</span>
            <span className="attn-legend-caption">颜色越亮，注意力权重越大</span>
          </div>

          <div className="attn-weight-readout" aria-live="polite">
            {hoverCell && hoverWeight !== null ? (
              <>
                <span className="attn-weight-sentence">
                  处理到 <code>{tokens[hoverCell.q]}</code> 时，模型把{" "}
                  <strong>{(hoverWeight * 100).toFixed(1)}%</strong> 的注意力放在{" "}
                  <code>{tokens[hoverCell.k]}</code> 上
                </span>
                <span className="attn-weight-value">w = {hoverWeight.toFixed(4)}</span>
              </>
            ) : (
              <span className="attn-weight-placeholder">把鼠标移到某个格子上，看「左边 token 关注上边哪个 token」</span>
            )}
          </div>

          {topTargets.length > 0 && activeQ !== null && (
            <div className="attn-top-list">
              <div className="attn-top-title">
                「{tokens[activeQ]}」最关注的前 {topTargets.length} 个 token
              </div>
              {topTargets.map((item) => (
                <div key={item.k} className="attn-top-row">
                  <span className="attn-top-token">{item.token}</span>
                  <span className="attn-top-bar-wrap">
                    <span
                      className="attn-top-bar"
                      style={{ width: `${Math.max(item.weight * 100, 1)}%` }}
                    />
                  </span>
                  <span className="attn-top-pct">{(item.weight * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}

          <div className="attn-hint">
            悬停看单个格子 · 点击某一行可锁定，只看该 token 的注意力分布 · 不同「头」关注不同语义关系
          </div>
        </>
      )}
    </div>
  );
}
