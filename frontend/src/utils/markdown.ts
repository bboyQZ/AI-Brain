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
    .replace(/\[引自[：:]\s*([^\]]+)\]/g, '<span class="source-tag">引自: $1</span>')
    .replace(/\n/g, "<br>");
}
