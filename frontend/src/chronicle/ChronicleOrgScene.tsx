/**
 * PRIVATE chronicle — 公司大楼视图（Hermes Agent 官网风）。
 * 用 HTML + 极简卡片承载，不再使用 Canvas / 像素画。
 * 双景别：目录（俯瞰六部门）↔ 部门详情（员工列表）。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { CHRONICLE_FLOW } from "./flows";
import { headIdForWing } from "./orgMemberOrder";
import CampusView from "./orgHermes/CampusView";
import OfficeView from "./orgHermes/OfficeView";
import OrgHermesChrome from "./orgHermes/OrgHermesChrome";
import { useOrgStaffData } from "./orgHermes/useOrgStaffData";

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

type ViewMode = "campus" | "wing";

export default function ChronicleOrgScene({ selectedId, onSelect }: Props) {
  const { seats, staffCount, byWing } = useOrgStaffData();
  const nodeById = useMemo(() => {
    const m = new Map();
    for (const n of CHRONICLE_FLOW.nodes) m.set(n.id, n);
    return m;
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>("campus");
  const [focusWingId, setFocusWingId] = useState<string | null>(null);

  const focusCampus = useCallback(() => {
    setViewMode("campus");
    setFocusWingId(null);
    onSelect(CHRONICLE_FLOW.protagonistId);
  }, [onSelect]);

  const focusWing = useCallback(
    (wingId: string) => {
      setViewMode("wing");
      setFocusWingId(wingId);
      onSelect(headIdForWing(wingId));
    },
    [onSelect],
  );

  useEffect(() => {
    if (selectedId === CHRONICLE_FLOW.protagonistId) return;
    const seat = seats.find((s) => s.id === selectedId);
    if (seat && seat.wingId !== focusWingId) {
      setViewMode("wing");
      setFocusWingId(seat.wingId);
    }
  }, [selectedId, seats, focusWingId]);

  const activeRoster =
    focusWingId ? byWing.get(focusWingId) ?? [] : [];

  return (
    <div className="org-hermes-wrap">
      <OrgHermesChrome
        seats={seats}
        byWing={byWing}
        staffCount={staffCount}
        viewMode={viewMode}
        focusWingId={focusWingId}
        onFocusCampus={focusCampus}
        onFocusWing={focusWing}
      />
      <div className="org-hermes-stage">
        {viewMode === "campus" || !focusWingId ? (
          <CampusView
            seats={seats}
            byWing={byWing}
            nodeById={nodeById}
            selectedId={selectedId}
            onEnterWing={focusWing}
            onSelect={onSelect}
          />
        ) : (
          <OfficeView
            wingId={focusWingId}
            roster={activeRoster}
            nodeById={nodeById}
            selectedId={selectedId}
            onSelect={onSelect}
            onBackCampus={focusCampus}
          />
        )}
      </div>
    </div>
  );
}
