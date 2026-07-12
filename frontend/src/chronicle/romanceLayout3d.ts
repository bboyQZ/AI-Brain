/**
 * PRIVATE chronicle — 恋爱视图 3D 球面布局。
 */
import type { ChronicleNodeDef } from "./flows";

const DEPT_ORDER = [
  "dept-secret",
  "dept-manage",
  "dept-service",
  "dept-art",
  "dept-clean",
  "other",
] as const;

export type Node3DLayout = {
  id: string;
  position: [number, number, number];
  isProtagonist: boolean;
  parentId?: string;
};

function fibonacciSphere(
  i: number,
  n: number,
  radius: number,
): [number, number, number] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const theta = golden * i;
  const y = 1 - (2 * (i + 0.5)) / n;
  const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const x = Math.cos(theta) * rAtY;
  const z = Math.sin(theta) * rAtY;
  return [x * radius, y * radius * 0.72, z * radius];
}

export function layoutRomance3D(
  nodes: ChronicleNodeDef[],
  protagonistId: string,
  radius = 9,
): Node3DLayout[] {
  const employees = nodes.filter((n) => n.id !== protagonistId);
  const sorted = [...employees].sort((a, b) => {
    const ia = DEPT_ORDER.indexOf(
      (a.parentId ?? "other") as (typeof DEPT_ORDER)[number],
    );
    const ib = DEPT_ORDER.indexOf(
      (b.parentId ?? "other") as (typeof DEPT_ORDER)[number],
    );
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const result: Node3DLayout[] = [
    {
      id: protagonistId,
      position: [0, 0, 0],
      isProtagonist: true,
    },
  ];

  sorted.forEach((emp, i) => {
    result.push({
      id: emp.id,
      position: fibonacciSphere(i, sorted.length, radius),
      isProtagonist: false,
      parentId: emp.parentId,
    });
  });

  return result;
}

export const DEPT_GLOW: Record<string, string> = {
  "dept-secret": "#f472b6",
  "dept-manage": "#60a5fa",
  "dept-service": "#34d399",
  "dept-art": "#c084fc",
  "dept-clean": "#94a3b8",
  other: "#64748b",
};

export const PROTAGONIST_GLOW = "#f5c842";
