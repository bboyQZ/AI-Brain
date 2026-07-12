/**
 * PRIVATE chronicle — 恋爱边生成与筛选。
 */
import type { ChronicleEdgeDef, ChronicleNodeDef } from "./flows";

export function buildRomanceEdges(
  nodes: ChronicleNodeDef[],
  protagonistId: string,
): ChronicleEdgeDef[] {
  return nodes
    .filter((n) => n.id !== protagonistId)
    .map((n) => ({
      id: `r-${protagonistId}-${n.id}`,
      source: protagonistId,
      target: n.id,
      kind: "romance" as const,
      romance: n.romance,
    }));
}

export type RomanceEdgeFilterOptions = {
  edgeDisplay: "focus" | "all";
  selectedId: string | null;
  protagonistId: string;
  kindFilters: ReadonlySet<string>;
  formFilters: ReadonlySet<string>;
};

export function filterRomanceEdges(
  edges: ChronicleEdgeDef[],
  options: RomanceEdgeFilterOptions,
): ChronicleEdgeDef[] {
  let filtered = edges.filter((e) => e.kind === "romance");

  if (options.kindFilters.size > 0) {
    filtered = filtered.filter(
      (e) => e.romance?.kind && options.kindFilters.has(e.romance.kind),
    );
  }
  if (options.formFilters.size > 0) {
    filtered = filtered.filter(
      (e) => e.romance?.form && options.formFilters.has(e.romance.form),
    );
  }

  if (options.edgeDisplay === "focus") {
    if (!options.selectedId || options.selectedId === options.protagonistId) {
      return [];
    }
    return filtered.filter((e) => e.target === options.selectedId);
  }

  return filtered;
}

export function collectRomanceTags(nodes: ChronicleNodeDef[]) {
  const kinds = new Set<string>();
  const forms = new Set<string>();
  for (const n of nodes) {
    if (n.romance?.kind) kinds.add(n.romance.kind);
    if (n.romance?.form) forms.add(n.romance.form);
  }
  return {
    kinds: [...kinds].sort(),
    forms: [...forms].sort(),
  };
}

const KIND_COLORS: Record<string, string> = {
  暗恋: "#e11d48",
  暧昧: "#d97706",
  交往: "#be123c",
  复杂关系: "#7c3aed",
};

export function romanceEdgeStroke(kind?: string): string {
  if (kind && KIND_COLORS[kind]) return KIND_COLORS[kind];
  return "var(--chronicle-romance-default, var(--accent))";
}

export function romanceEdgeDash(form?: string): string | undefined {
  if (form === "秘密") return "7 5";
  if (form === "单向") return "3 5";
  return undefined;
}
