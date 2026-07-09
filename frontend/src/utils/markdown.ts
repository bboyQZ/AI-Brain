import type { KnowledgeDocInfo } from "../api/client";

/** 轻量 Markdown 转 HTML（仅覆盖聊天常见格式） */
export function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[引自[：:]\s*([^\]]+)\]/g, (_m, cite: string) => {
      const attr = cite.replace(/"/g, "&quot;");
      return `<span class="source-tag" data-cite="${attr}">引自: ${cite}</span>`;
    })
    .replace(/\n/g, "<br>");
}

const CN_DIGITS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

/** 解析 1~99 的中文或阿拉伯数字，如 "3"、"十二"、"二十" */
function parseNumber(s: string): number | null {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (!/^[一二三四五六七八九十]+$/.test(s)) return null;
  if (s === "十") return 10;
  const idx = s.indexOf("十");
  if (idx === -1) return s.length === 1 ? CN_DIGITS[s] ?? null : null;
  const tens = idx === 0 ? 1 : CN_DIGITS[s[0]] ?? 0;
  const ones = idx === s.length - 1 ? 0 : CN_DIGITS[s[s.length - 1]] ?? 0;
  return tens * 10 + ones;
}

/**
 * 把 LLM 自由文本引用（如 "课程第3节"、"笔记：xxx"）尽力匹配到知识库文档。
 * 匹配不到返回 null，调用方保持标签无动作。
 */
export function resolveCitation(
  cite: string,
  docs: KnowledgeDocInfo[],
): { docId: string } | null {
  const text = cite.trim();

  // 课程第X节 / 第X课 / Lesson X → lesson-NN 文件
  const lessonMatch =
    text.match(/(?:课程)?第\s*(\d+|[一二三四五六七八九十]+)\s*[节课讲]/) ||
    text.match(/lesson[-\s]*(\d+)/i);
  if (lessonMatch) {
    const n = parseNumber(lessonMatch[1]);
    if (n !== null) {
      const prefix = `lesson-${String(n).padStart(2, "0")}`;
      const doc = docs.find(
        (d) => d.source_type === "curriculum" && d.id.startsWith(prefix),
      );
      if (doc) return { docId: doc.id };
    }
  }

  // 笔记：标题 → 与笔记文档标题模糊匹配
  const noteMatch = text.match(/笔记[：:]\s*(.+)/);
  if (noteMatch) {
    const title = noteMatch[1].trim();
    const notes = docs.filter((d) => d.source_type === "note");
    const doc =
      notes.find((d) => d.title === title) ||
      notes.find((d) => d.title.includes(title) || title.includes(d.title));
    if (doc) return { docId: doc.id };
  }

  // 兜底：引用文本与任意文档标题互相包含
  const doc = docs.find(
    (d) => d.title.length >= 2 && (text.includes(d.title) || d.title.includes(text)),
  );
  return doc ? { docId: doc.id } : null;
}
