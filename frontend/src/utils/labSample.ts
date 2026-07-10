/** 实验室 Demo 从共用示例文本取样时的性能上限 */

export const LAB_SAMPLE_LIMITS = {
  /** Tokenize：过长会拖慢实时请求与芯片渲染 */
  tokenizeChars: 800,
  /** Attention：矩阵 O(n²)，只取短句前缀 */
  attentionChars: 24,
  /** Embedding：每行一词，限制行数与单行长度 */
  embeddingLines: 24,
  embeddingLineChars: 48,
  /** RAG 切块：可用较长正文（与富文本上限对齐） */
  ragChars: 10000,
} as const;

export type SampleSlice = {
  text: string;
  truncated: boolean;
  originalLen: number;
  limit: number;
};

export function takePrefix(raw: string, maxChars: number): SampleSlice {
  const text = raw.replace(/\u00a0/g, " ");
  const originalLen = text.length;
  if (originalLen <= maxChars) {
    return { text, truncated: false, originalLen, limit: maxChars };
  }
  return { text: text.slice(0, maxChars), truncated: true, originalLen, limit: maxChars };
}

/** 按行取样：空行丢弃，行过长截断 */
export function takeLines(
  raw: string,
  maxLines: number,
  maxLineChars: number,
): SampleSlice & { lineCount: number } {
  const originalLen = raw.length;
  const sourceLines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const truncated =
    sourceLines.length > maxLines || sourceLines.some((l) => l.length > maxLineChars);

  const kept = sourceLines
    .slice(0, maxLines)
    .map((l) => (l.length > maxLineChars ? l.slice(0, maxLineChars) : l));

  return {
    text: kept.join("\n"),
    truncated,
    originalLen,
    limit: maxLines,
    lineCount: kept.length,
  };
}

export function truncateHint(slice: SampleSlice, unit = "字"): string | null {
  if (!slice.truncated) return null;
  return `性能优化：仅使用前 ${slice.limit}${unit}（原文 ${slice.originalLen}${unit}）`;
}
