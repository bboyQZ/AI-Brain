/**
 * PRIVATE chronicle — 恋爱视图径向布局。
 */
import { Position } from "@xyflow/react";
import type { ChronicleNodeDef } from "./flows";

const SECTOR_ORDER = [
  "dept-secret",
  "dept-manage",
  "dept-service",
  "dept-art",
  "dept-clean",
  "other",
] as const;

const CARD_W = 150;
const CARD_HALF_W = CARD_W / 2;
const CARD_HALF_H = 40;
const MIN_GAP = 28;
const SECTOR_GAP = 0.04; // 扇区间隙（弧度）

function handlesForAngle(angle: number): {
  sourcePosition: Position;
  targetPosition: Position;
} {
  const deg = (((angle * 180) / Math.PI) % 360 + 360) % 360;
  if (deg >= 315 || deg < 45) {
    return { sourcePosition: Position.Right, targetPosition: Position.Left };
  }
  if (deg >= 45 && deg < 135) {
    return { sourcePosition: Position.Bottom, targetPosition: Position.Top };
  }
  if (deg >= 135 && deg < 225) {
    return { sourcePosition: Position.Left, targetPosition: Position.Right };
  }
  return { sourcePosition: Position.Top, targetPosition: Position.Bottom };
}

/** 在给定半径下，相邻节点中心所需的最小弧度 */
function minAngleStep(radius: number): number {
  return (CARD_W + MIN_GAP) / Math.max(radius, 120);
}

export type RomanceLayoutItem = {
  id: string;
  position: { x: number; y: number };
  sourcePosition: Position;
  targetPosition: Position;
  isProtagonist: boolean;
};

export function layoutRomance(
  nodes: ChronicleNodeDef[],
  protagonistId: string,
  center = { x: 600, y: 420 },
): RomanceLayoutItem[] {
  const employees = nodes.filter((n) => n.id !== protagonistId);
  const buckets = new Map<string, ChronicleNodeDef[]>();
  for (const key of SECTOR_ORDER) buckets.set(key, []);

  for (const emp of employees) {
    const key = emp.parentId ?? "other";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(emp);
  }

  const result: RomanceLayoutItem[] = [
    {
      id: protagonistId,
      position: { x: center.x - CARD_HALF_W, y: center.y - CARD_HALF_H },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      isProtagonist: true,
    },
  ];

  const sectors = SECTOR_ORDER.map((id) => ({
    id,
    members: buckets.get(id) ?? [],
  })).filter((s) => s.members.length > 0);

  const totalMembers = employees.length;
  if (totalMembers === 0) return result;

  const usableArc = 2 * Math.PI - sectors.length * SECTOR_GAP;
  let cursor = -Math.PI / 2;

  const baseRadius = 240;
  const radiusStep = 125;

  for (const sector of sectors) {
    const span = (sector.members.length / totalMembers) * usableArc;
    const sectorStart = cursor;
    const sectorEnd = cursor + span;

    let idx = 0;
    let ring = 0;

    while (idx < sector.members.length) {
      const r = baseRadius + ring * radiusStep;
      const step = minAngleStep(r);
      const capacity = Math.max(1, Math.floor(span / step));
      const count = Math.min(capacity, sector.members.length - idx);

      for (let j = 0; j < count; j++) {
        const emp = sector.members[idx + j]!;
        const angle =
          sectorStart + ((j + 0.5) / count) * (sectorEnd - sectorStart);
        const handles = handlesForAngle(angle);

        result.push({
          id: emp.id,
          position: {
            x: center.x + r * Math.cos(angle) - CARD_HALF_W,
            y: center.y + r * Math.sin(angle) - CARD_HALF_H,
          },
          sourcePosition: handles.sourcePosition,
          targetPosition: handles.targetPosition,
          isProtagonist: false,
        });
      }

      idx += count;
      ring += 1;
    }

    cursor = sectorEnd + SECTOR_GAP;
  }

  return result;
}
