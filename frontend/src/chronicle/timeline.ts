/**
 * PRIVATE chronicle — 恋爱星图时间轴：按 era 过滤可见人物与关系。
 * 未单独配置登场时间的角色默认仅在「现在」出现；后续逐人补故事即可覆盖。
 */
import type {
  ChronicleEdgeDef,
  ChronicleFlow,
  ChronicleNodeDef,
  RomanceMeta,
} from "./flows";
import { buildRomanceEdges } from "./romanceEdges";

export type ChronicleEra =
  | "y1-enroll"
  | "y1-military"
  | "y1-fall"
  | "y1-spring"
  | "y2-fall"
  | "y2-spring"
  | "y3-fall"
  | "y3-spring"
  | "y4-intern"
  | "graduation"
  | "company-founded"
  | "company-y1"
  | "now";

export type ChronicleEraDef = {
  id: ChronicleEra;
  label: string;
  /** 轴上短标签 */
  short: string;
};

export const CHRONICLE_ERAS: readonly ChronicleEraDef[] = [
  { id: "y1-enroll", label: "大一入学", short: "入学" },
  { id: "y1-military", label: "大一军训", short: "军训" },
  { id: "y1-fall", label: "大一上学期", short: "大一上" },
  { id: "y1-spring", label: "大一下学期", short: "大一下" },
  { id: "y2-fall", label: "大二上学期", short: "大二上" },
  { id: "y2-spring", label: "大二下学期", short: "大二下" },
  { id: "y3-fall", label: "大三上学期", short: "大三上" },
  { id: "y3-spring", label: "大三下学期", short: "大三下" },
  { id: "y4-intern", label: "大四实习期", short: "实习" },
  { id: "graduation", label: "毕业典礼", short: "毕业" },
  { id: "company-founded", label: "公司成立", short: "成立" },
  { id: "company-y1", label: "公司第一年", short: "第一年" },
  { id: "now", label: "现在", short: "现在" },
] as const;

export const DEFAULT_CHRONICLE_ERA: ChronicleEra = "now";

const ERA_INDEX = new Map<ChronicleEra, number>(
  CHRONICLE_ERAS.map((e, i) => [e.id, i]),
);

const STORAGE_KEY = "chronicle:timeline-era";

/** 未配置角色的默认登场节点：仅「现在」可见 */
const DEFAULT_APPEAR_FROM: ChronicleEra = "now";

/**
 * 角色首次出现在星图上的 era（可逐人覆盖）。
 * 主角乔志始终可见，不需写入。
 */
export const APPEAR_FROM_BY_ID: Partial<Record<string, ChronicleEra>> = {
  zhangdi: "y1-enroll",
  hansiying: "y1-enroll",
};

type EraSnapshot<T> = { from: ChronicleEra; value: T };

function eraIdx(era: ChronicleEra): number {
  return ERA_INDEX.get(era) ?? ERA_INDEX.get(DEFAULT_CHRONICLE_ERA)!;
}

function pickSnapshot<T>(snaps: EraSnapshot<T>[] | undefined, era: ChronicleEra): T | undefined {
  if (!snaps?.length) return undefined;
  const idx = eraIdx(era);
  let best: EraSnapshot<T> | undefined;
  for (const s of snaps) {
    if (eraIdx(s.from) <= idx && (!best || eraIdx(s.from) > eraIdx(best.from))) {
      best = s;
    }
  }
  return best?.value;
}

/** 关系标签随时间变化（已配置角色）；未配置则无恋爱边样式 */
const ROMANCE_TIMELINE_BY_ID: Record<string, EraSnapshot<RomanceMeta>[]> = {
  zhangdi: [
    { from: "y1-enroll", value: { kind: "暗恋", form: "秘密" } },
    { from: "graduation", value: { kind: "暧昧", form: "秘密" } },
    { from: "company-founded", value: { kind: "交往", form: "公开" } },
  ],
  hansiying: [
    { from: "y1-fall", value: { kind: "同寝", form: "室友" } },
    { from: "y1-spring", value: { kind: "热恋", form: "公开" } },
    { from: "y4-intern", value: { kind: "异地", form: "坚守" } },
    { from: "company-founded", value: { kind: "秘书", form: "贴身" } },
  ],
};

/** 副标题随时间变化（可选） */
const SUBTITLE_TIMELINE_BY_ID: Record<string, EraSnapshot<string>[]> = {
  zhangdi: [
    { from: "y1-enroll", value: "大学同学" },
    { from: "company-founded", value: "恋爱体验馆" },
  ],
  hansiying: [
    { from: "y1-enroll", value: "大学同学" },
    { from: "y1-spring", value: "406 室友" },
    { from: "company-founded", value: "十秘 · 秘书" },
  ],
};

export function isValidChronicleEra(v: string): v is ChronicleEra {
  return ERA_INDEX.has(v as ChronicleEra);
}

export function loadChronicleEra(): ChronicleEra {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isValidChronicleEra(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_CHRONICLE_ERA;
}

export function saveChronicleEra(era: ChronicleEra): void {
  try {
    localStorage.setItem(STORAGE_KEY, era);
  } catch {
    /* ignore */
  }
}

export function appearFromForNode(
  nodeId: string,
  protagonistId: string,
): ChronicleEra {
  if (nodeId === protagonistId) return CHRONICLE_ERAS[0]!.id;
  return APPEAR_FROM_BY_ID[nodeId] ?? DEFAULT_APPEAR_FROM;
}

export function isNodeVisibleAt(
  nodeId: string,
  era: ChronicleEra,
  protagonistId: string,
): boolean {
  return eraIdx(era) >= eraIdx(appearFromForNode(nodeId, protagonistId));
}

export function romanceMetaAtEra(
  nodeId: string,
  era: ChronicleEra,
): RomanceMeta | undefined {
  return pickSnapshot(ROMANCE_TIMELINE_BY_ID[nodeId], era);
}

export function subtitleAtEra(nodeId: string, era: ChronicleEra): string | undefined {
  return pickSnapshot(SUBTITLE_TIMELINE_BY_ID[nodeId], era);
}

export type FilteredRomanceFlow = Pick<
  ChronicleFlow,
  "protagonistId" | "nodes" | "edges"
>;

/** 按 era 切片恋爱星图：可见节点 + 对应关系标签 */
export function filterRomanceFlowForEra(
  flow: ChronicleFlow,
  era: ChronicleEra,
): FilteredRomanceFlow {
  const visibleNodes: ChronicleNodeDef[] = flow.nodes
    .filter((n) => isNodeVisibleAt(n.id, era, flow.protagonistId))
    .map((n) => {
      const romance = romanceMetaAtEra(n.id, era) ?? n.romance;
      const eraSubtitle = subtitleAtEra(n.id, era);
      return {
        ...n,
        ...(romance ? { romance } : {}),
        ...(eraSubtitle ? { subtitle: eraSubtitle } : {}),
      };
    });

  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const romanceEdges = buildRomanceEdges(visibleNodes, flow.protagonistId).map(
    (e) => {
      const meta = romanceMetaAtEra(e.target, era);
      return meta ? { ...e, romance: meta } : e;
    },
  );

  const edges: ChronicleEdgeDef[] = romanceEdges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
  );

  return {
    protagonistId: flow.protagonistId,
    nodes: visibleNodes,
    edges,
  };
}
