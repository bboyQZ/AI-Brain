/**
 * PRIVATE chronicle — Hermes 版侧栏 + 底部状态栏。
 * Hermes Dashboard 风：深青底 + 编号 pill + 单一 accent。
 */
import { ORG_WING_META, ORG_WING_SIDEBAR_ORDER } from "../orgBuildingPalette";
import { HERMES_DEPT_INDEX } from "./hermesTokens";
import type { OrgStaffSeat } from "./useOrgStaffData";

type Props = {
  seats: OrgStaffSeat[];
  byWing: Map<string, OrgStaffSeat[]>;
  staffCount: number;
  viewMode: "campus" | "wing";
  focusWingId: string | null;
  onFocusCampus: () => void;
  onFocusWing: (wingId: string) => void;
};

export default function OrgHermesChrome({
  byWing,
  staffCount,
  viewMode,
  focusWingId,
  onFocusCampus,
  onFocusWing,
}: Props) {
  const activeWingId = viewMode === "wing" ? focusWingId : null;
  const activeMeta = activeWingId ? ORG_WING_META[activeWingId] : null;

  return (
    <>
      <aside className="org-hermes-sidebar" aria-label="部门导航">
        <button
          type="button"
          className={
            "org-hermes-sidebar-home" +
            (viewMode === "campus" ? " active" : "")
          }
          onClick={onFocusCampus}
        >
          <span className="org-hermes-sidebar-home-eyebrow">
            Chronicle · Org
          </span>
          <span className="org-hermes-sidebar-home-title">目录</span>
        </button>
        <div className="org-hermes-sidebar-divider" role="presentation" />
        <ul className="org-hermes-wing-list">
          {ORG_WING_SIDEBAR_ORDER.map((wingId) => {
            const meta = ORG_WING_META[wingId];
            if (!meta) return null;
            const active = activeWingId === wingId;
            const count = byWing.get(wingId)?.length ?? 0;
            return (
              <li key={wingId}>
                <button
                  type="button"
                  className={
                    "org-hermes-wing-item" + (active ? " active" : "")
                  }
                  onClick={() => onFocusWing(wingId)}
                >
                  <span className="org-hermes-wing-index">
                    {HERMES_DEPT_INDEX[wingId]}
                  </span>
                  <span className="org-hermes-wing-text">
                    <span className="org-hermes-wing-title">{meta.title}</span>
                    <span className="org-hermes-wing-sub">{meta.subtitle}</span>
                  </span>
                  <span className="org-hermes-wing-count">{count}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <footer className="org-hermes-statusbar" aria-label="大楼状态">
        <span className="org-hermes-status-pill org-hermes-status-pill--ok">
          <span className="org-hermes-status-dot" aria-hidden /> ready
        </span>
        <span className="org-hermes-status-pill">
          <span className="org-hermes-status-key">staff</span>
          <span className="org-hermes-status-val">{staffCount}</span>
        </span>
        <span className="org-hermes-status-pill">
          <span className="org-hermes-status-key">view</span>
          <span className="org-hermes-status-val">
            {activeMeta ? activeMeta.title : "目录"}
          </span>
        </span>
      </footer>
    </>
  );
}
