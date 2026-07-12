/**
 * PRIVATE chronicle — 公司大楼翼楼配色（晨光玻璃园区）。
 * 各部门有独立墙面/地板/玻璃色调，整体保持白底通透感。
 */
export type WingPalette = {
  id: string;
  /** 实体外墙 */
  wall: string;
  /** 墙裙 / 深色收边 */
  wallSkirt: string;
  /** 地板主色 */
  floor: string;
  /** 顶檐 / 门框强调色 */
  trim: string;
  /** 玻璃幕墙色调 */
  glass: string;
  /** 部门标签与光晕 */
  accent: string;
};

export const CAMPUS_COLORS = {
  sky: "#f4f7fb",
  ground: "#eef2f7",
  grid: "#dce4ef",
  courtyard: "#e8eef6",
  corridor: "#f8fafc",
  corridorEdge: "#cbd5e1",
  corridorLine: "#38bdf8",
  corridorGlow: "#7dd3fc",
  desk: "#ffffff",
  deskEdge: "#cbd5e1",
  chair: "#e2e8f0",
  monitor: "#334155",
  aisle: "#f1f5f9",
  plant: "#4ade80",
  cabinGlass: "#f8fafc",
  hubRing: "#0ea5e9",
} as const;

/** 侧栏部门顺序 */
export const ORG_WING_SIDEBAR_ORDER = [
  "boss",
  "dept-secret",
  "dept-manage",
  "dept-service",
  "dept-art",
  "dept-clean",
] as const;

/** 3D 翼楼标牌：部门名 + 业务线副标题 */
export const ORG_WING_META: Record<string, { title: string; subtitle: string }> = {
  "dept-secret": { title: "十秘", subtitle: "机要 · 老板日程" },
  "dept-manage": { title: "管理部", subtitle: "人事 · 行政" },
  "dept-service": { title: "服务部", subtitle: "线下 · 恋爱体验馆" },
  "dept-art": { title: "文艺部", subtitle: "短视频软件 · 网红" },
  "dept-clean": { title: "清洁部", subtitle: "全楼与老板间保洁" },
  boss: { title: "老板间", subtitle: "乔志 · 恋爱数据网" },
};

export type WallSide = "front" | "back" | "left" | "right";

export type WingDoorDef = {
  wingId: string;
  side: WallSide;
  /** 门洞宽（设计稿米制，× SCALE 后使用） */
  widthM: number;
};

/** 各翼楼朝向中庭的门洞 */
export const WING_DOOR_DEFS: WingDoorDef[] = [
  { wingId: "dept-secret", side: "right", widthM: 28 },
  { wingId: "dept-service", side: "back", widthM: 34 },
  { wingId: "dept-art", side: "left", widthM: 28 },
  { wingId: "dept-manage", side: "right", widthM: 26 },
  { wingId: "dept-clean", side: "front", widthM: 40 },
  { wingId: "boss", side: "front", widthM: 32 },
];

export const WING_PALETTES: Record<string, WingPalette> = {
  "dept-secret": {
    id: "dept-secret",
    wall: "#fff5f8",
    wallSkirt: "#f9a8d4",
    floor: "#fffbfd",
    trim: "#ec4899",
    glass: "#fce7f3",
    accent: "#db2777",
  },
  "dept-manage": {
    id: "dept-manage",
    wall: "#f0f9ff",
    wallSkirt: "#7dd3fc",
    floor: "#f8fcff",
    trim: "#0284c7",
    glass: "#e0f2fe",
    accent: "#0369a1",
  },
  "dept-service": {
    id: "dept-service",
    wall: "#f0fdf4",
    wallSkirt: "#6ee7b7",
    floor: "#f7fef9",
    trim: "#059669",
    glass: "#d1fae5",
    accent: "#047857",
  },
  "dept-art": {
    id: "dept-art",
    wall: "#faf5ff",
    wallSkirt: "#c4b5fd",
    floor: "#fdfbff",
    trim: "#7c3aed",
    glass: "#ede9fe",
    accent: "#6d28d9",
  },
  "dept-clean": {
    id: "dept-clean",
    wall: "#f8fafc",
    wallSkirt: "#94a3b8",
    floor: "#f1f5f9",
    trim: "#475569",
    glass: "#e2e8f0",
    accent: "#334155",
  },
  boss: {
    id: "boss",
    wall: "#fffbeb",
    wallSkirt: "#fcd34d",
    floor: "#fffef7",
    trim: "#d97706",
    glass: "#fef3c7",
    accent: "#b45309",
  },
};

export function wingPalette(wingId: string): WingPalette {
  return WING_PALETTES[wingId] ?? WING_PALETTES["dept-clean"];
}
