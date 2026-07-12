/**
 * PRIVATE chronicle — 人物长篇故事（narrative）注入。
 * 通过 Vite ?raw 从 docs/superpowers/specs 加载 md 全文，
 * 解析成 { chapters: [{ id, title, paragraphs }] }，供阅读层使用。
 */

// @ts-expect-error - Vite raw import
import zhangdiRaw from "../../../docs/superpowers/specs/2026-07-11-chronicle-story-zhangdi.md?raw";
// @ts-expect-error - Vite raw import
import hansiyingRaw from "../../../docs/superpowers/specs/2026-07-11-chronicle-story-hansiying.md?raw";

export type NarrativeChapter = {
  /** 目录锚点用 */
  id: string;
  /** 章节完整标题，例如 "一、九月 · 第一眼就想要" */
  title: string;
  /** 章节序号短标签，例如 "一" */
  ordinal: string;
  /** 章节副标，例如 "九月 · 第一眼就想要" */
  subtitle: string;
  paragraphs: string[];
};

export type Narrative = {
  chapters: NarrativeChapter[];
  /** 备用：整篇纯文本，供旧组件使用 */
  plain: string;
};

const CN_ORDINALS = "零一二三四五六七八九十";

function stripFrontMatter(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n");
  const idx = normalized.indexOf("\n---\n");
  if (idx > 0 && idx < 600) {
    return normalized.slice(idx + 5).trim();
  }
  return normalized.trim();
}

function cleanInline(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function splitTitle(title: string): { ordinal: string; subtitle: string } {
  // "一、九月 · 第一眼就想要" → ordinal "一", subtitle 后段
  const m = /^([一二三四五六七八九十百]+)[、\.\s]+(.+)$/.exec(title);
  if (m) return { ordinal: m[1], subtitle: m[2].trim() };
  // "1. xxx" → 转成中文数字
  const m2 = /^(\d+)[、\.\s]+(.+)$/.exec(title);
  if (m2) {
    const n = Number(m2[1]);
    const ordinal = n >= 0 && n < CN_ORDINALS.length ? CN_ORDINALS[n] : String(n);
    return { ordinal, subtitle: m2[2].trim() };
  }
  return { ordinal: "•", subtitle: title };
}

function parseNarrative(md: string): Narrative {
  const body = stripFrontMatter(md);
  const chapters: NarrativeChapter[] = [];
  let cur: NarrativeChapter | null = null;
  let buf: string[] = [];

  const flushPara = () => {
    if (!cur) return;
    const text = buf.join("").trim();
    if (text) cur.paragraphs.push(text);
    buf = [];
  };

  const lines = body.split("\n");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^---+$/.test(line)) {
      flushPara();
      continue;
    }
    const h = /^#{1,6}\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      const title = cleanInline(h[1].trim());
      const parts = splitTitle(title);
      cur = {
        id: `ch-${chapters.length + 1}`,
        title,
        ordinal: parts.ordinal,
        subtitle: parts.subtitle,
        paragraphs: [],
      };
      chapters.push(cur);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      continue;
    }
    // 同段续行：以单空格连接，避免中文段中出现换行断字
    buf.push(cleanInline(line.trim()));
    buf.push(" ");
  }
  flushPara();

  const plain = chapters
    .map((c) => `【${c.title}】\n\n${c.paragraphs.join("\n\n")}`)
    .join("\n\n");

  return { chapters, plain };
}

const zhangdi = parseNarrative(zhangdiRaw as string);
const hansiying = parseNarrative(hansiyingRaw as string);

/** 完整叙事（含分章）。 */
export const NARRATIVE_FULL: Record<string, Narrative> = {
  zhangdi,
  hansiying,
};

/** dock "与乔志" 卡片上的短简介（一段话，用于展示，不塞长文）。 */
export const ROMANCE_BRIEF_BY_ID: Record<string, string> = {
  zhangdi:
    "乔志大学同学。大一一见倾心却四年不敢表白；常年偷拍、偷闻、偷喝他喝过的水，体育馆储物柜里反复偷走他的袜子，攒满一抽屉，裁成多只口罩内衬贴脸戴出门。毕业应聘恋爱体验馆，按公司规矩完成牵手至舌吻的亲密面试，当众交出初吻，录用即成女友；确立关系当夜成为他的人。",
  hansiying:
    "乔志大学同学，全系最好看却不加陌生人微信，唯独对乔志例外。大一床位坍塌后谎称有小床位，把乔志拉进 406 同床；七周从背靠背到亲睡，确立关系。大学四年左韩右李，大四因实习短暂分开，公司成立后直接来做贴身秘书，办公室圆床续写 406。",
};

/** 兼容旧字段：不再向节点 narrative 注入长文（长文只走 NARRATIVE_FULL + 阅读层）。 */
export const NARRATIVE_BY_ID: Record<string, string> = {};
