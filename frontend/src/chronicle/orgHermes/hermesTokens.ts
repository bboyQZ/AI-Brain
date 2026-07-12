/**
 * PRIVATE chronicle — 公司大楼「Hermes Agent 官网风」设计 tokens。
 * 参考 Hermes Agent 官方 DESIGN.md：calm developer console，
 * Hermes Teal 主题（深青 + 奶油），单一 accent，几乎无阴影，
 * 衬线正文与无衬线 UI 的分工排版。
 */

export const HERMES = {
  bg: "#f5efe4",
  bgSubtle: "#efe7d8",
  bgElevated: "#fbf7ee",
  surface: "#ffffff",
  ink: "#0d2a2a",
  inkMuted: "#5b6b6b",
  inkFaint: "#8a9797",
  teal: "#0d3d3a",
  tealSoft: "#164947",
  tealLine: "#c8d3d0",
  tealSurface: "#e9efec",
  amber: "#c17a2b",
  amberSoft: "#f2e4cf",
  divider: "#d9d1c0",
} as const;

export const HERMES_TYPE = {
  serif: `'Noto Serif SC', 'Source Han Serif SC', Georgia, 'Times New Roman', serif`,
  sans: `'Inter', 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif`,
  mono: `'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace`,
} as const;

/** 六部门在 Hermes 目录里的编号，与官网章节风一致。 */
export const HERMES_DEPT_INDEX: Record<string, string> = {
  boss: "01",
  "dept-secret": "02",
  "dept-manage": "03",
  "dept-service": "04",
  "dept-art": "05",
  "dept-clean": "06",
};

/** 每个部门在 Hermes 视觉里的定位关键词（做副标题第二行用，编号感）。 */
export const HERMES_DEPT_KEYWORD: Record<string, string> = {
  boss: "PRINCIPAL",
  "dept-secret": "CHIEF-OF-STAFF",
  "dept-manage": "OPERATIONS",
  "dept-service": "FIELD",
  "dept-art": "CREATIVE",
  "dept-clean": "FACILITIES",
};
