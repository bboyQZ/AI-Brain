/**
 * PRIVATE chronicle — Hermes 版席位数据 hook。
 * 结构：{ id, wingId, isHead }，按 orgMemberOrder.ts 编制展开。
 */
import { useMemo } from "react";
import { BOSS_ID, DEPT_SEAT_PLANS } from "../orgMemberOrder";

export type OrgStaffSeat = {
  id: string;
  wingId: string;
  isHead: boolean;
};

export function buildOrgStaffSeats(): OrgStaffSeat[] {
  const seats: OrgStaffSeat[] = [{ id: BOSS_ID, wingId: "boss", isHead: true }];
  for (const plan of DEPT_SEAT_PLANS) {
    if (plan.headId) seats.push({ id: plan.headId, wingId: plan.wingId, isHead: true });
    for (const grid of plan.grids) {
      for (const id of grid.ids) {
        seats.push({ id, wingId: plan.wingId, isHead: false });
      }
    }
  }
  return seats;
}

export function useOrgStaffData() {
  return useMemo(() => {
    const seats = buildOrgStaffSeats();
    const byWing = new Map<string, OrgStaffSeat[]>();
    for (const s of seats) {
      const arr = byWing.get(s.wingId) ?? [];
      arr.push(s);
      byWing.set(s.wingId, arr);
    }
    return { seats, staffCount: seats.length, byWing };
  }, []);
}
