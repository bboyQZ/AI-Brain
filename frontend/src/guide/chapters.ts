export type GuideChapter = {
  id: string;
  title: string;
  file: string;
  ready: boolean;
};

/** 与 docs/guide 文件名对应 */
export const GUIDE_CHAPTERS: GuideChapter[] = [
  { id: "overview", title: "总览", file: "01-overview.md", ready: true },
  { id: "chat-rag", title: "一次对话（RAG）", file: "02-chat-rag.md", ready: true },
  { id: "ingest", title: "知识入库", file: "03-ingest.md", ready: true },
  { id: "frontend", title: "前端与主题", file: "04-frontend.md", ready: true },
  { id: "lab", title: "概念实验室", file: "05-lab.md", ready: true },
  { id: "prompts", title: "提示词与配置", file: "06-prompts.md", ready: true },
];
const rawModules = import.meta.glob("@guide/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function findRaw(file: string): string {
  const entry = Object.entries(rawModules).find(([key]) => key.replace(/\\/g, "/").endsWith(`/${file}`));
  return entry?.[1] ?? `# 未找到文稿\n\n缺少 \`docs/guide/${file}\`。`;
}

export function loadGuideMarkdown(chapterId: string): string {
  const chapter = GUIDE_CHAPTERS.find((c) => c.id === chapterId) ?? GUIDE_CHAPTERS[0];
  return findRaw(chapter.file);
}
