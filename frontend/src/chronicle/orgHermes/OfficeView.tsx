/**
 * PRIVATE chronicle — 部门内部视图（Hermes 版）。
 * 展开一个部门的所有员工，负责人置顶。
 * 参考 Hermes Dashboard 的列表页：细边、清爽、单 accent。
 */
import type { ChronicleNodeDef } from "../flows";
import { ORG_WING_META } from "../orgBuildingPalette";
import { HERMES_DEPT_INDEX, HERMES_DEPT_KEYWORD } from "./hermesTokens";
import type { OrgStaffSeat } from "./useOrgStaffData";

type Props = {
  wingId: string;
  roster: OrgStaffSeat[];
  nodeById: Map<string, ChronicleNodeDef>;
  selectedId: string;
  onSelect: (id: string) => void;
  onBackCampus: () => void;
};

export default function OfficeView({
  wingId,
  roster,
  nodeById,
  selectedId,
  onSelect,
  onBackCampus,
}: Props) {
  const meta = ORG_WING_META[wingId];
  if (!meta) return null;
  const head = roster.find((s) => s.isHead);
  const others = roster.filter((s) => !s.isHead);

  return (
    <div className="org-hermes-office">
      <header className="org-hermes-office-head">
        <button
          type="button"
          className="org-hermes-crumb"
          onClick={onBackCampus}
        >
          ← 返回目录
        </button>
        <div className="org-hermes-office-title-row">
          <span className="org-hermes-office-index">
            {HERMES_DEPT_INDEX[wingId]}
          </span>
          <div className="org-hermes-office-title-wrap">
            <div className="org-hermes-office-keyword">
              {HERMES_DEPT_KEYWORD[wingId]}
            </div>
            <h2 className="org-hermes-office-title">{meta.title}</h2>
            <div className="org-hermes-office-sub">{meta.subtitle}</div>
          </div>
          <div className="org-hermes-office-metric">
            <span className="org-hermes-office-metric-num">
              {roster.length.toString().padStart(2, "0")}
            </span>
            <span className="org-hermes-office-metric-label">在编</span>
          </div>
        </div>
      </header>

      <div className="org-hermes-office-body">
        {head && (
          <section className="org-hermes-office-section">
            <div className="org-hermes-office-section-title">负责人</div>
            <ul className="org-hermes-office-list org-hermes-office-list--head">
              <StaffRow
                seat={head}
                node={nodeById.get(head.id) ?? null}
                active={head.id === selectedId}
                onSelect={onSelect}
              />
            </ul>
          </section>
        )}

        <section className="org-hermes-office-section">
          <div className="org-hermes-office-section-title">
            成员
            <span className="org-hermes-office-section-count">
              {others.length}
            </span>
          </div>
          <ul className="org-hermes-office-list">
            {others.map((seat) => (
              <StaffRow
                key={seat.id}
                seat={seat}
                node={nodeById.get(seat.id) ?? null}
                active={seat.id === selectedId}
                onSelect={onSelect}
              />
            ))}
            {others.length === 0 && (
              <li className="org-hermes-office-empty">该部门暂无其他成员</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StaffRow({
  seat,
  node,
  active,
  onSelect,
}: {
  seat: OrgStaffSeat;
  node: ChronicleNodeDef | null;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const label = node?.label ?? seat.id;
  const subtitle = node?.subtitle;
  const initial = label.charAt(0);
  return (
    <li>
      <button
        type="button"
        className={"org-hermes-staff-row" + (active ? " active" : "")}
        onClick={() => onSelect(seat.id)}
      >
        <span className="org-hermes-staff-avatar" aria-hidden>
          {initial}
        </span>
        <span className="org-hermes-staff-main">
          <span className="org-hermes-staff-name">{label}</span>
          {subtitle && (
            <span className="org-hermes-staff-sub">{subtitle}</span>
          )}
        </span>
        {seat.isHead && (
          <span className="org-hermes-staff-tag">HEAD</span>
        )}
      </button>
    </li>
  );
}
