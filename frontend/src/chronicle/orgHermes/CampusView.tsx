/**
 * PRIVATE chronicle — 俯瞰视图（Hermes 版）。
 * 六张部门卡片，每张：章节编号 + 衬线部门名 + 岗位类别 + 副标题 + 员工点阵条。
 * 参考 Hermes Dashboard 风：奶油底 + 深青细边 + 单一 accent，几乎无阴影。
 */
import type { ChronicleNodeDef } from "../flows";
import { ORG_WING_META, ORG_WING_SIDEBAR_ORDER } from "../orgBuildingPalette";
import { HERMES_DEPT_INDEX, HERMES_DEPT_KEYWORD } from "./hermesTokens";
import type { OrgStaffSeat } from "./useOrgStaffData";

type Props = {
  seats: OrgStaffSeat[];
  byWing: Map<string, OrgStaffSeat[]>;
  nodeById: Map<string, ChronicleNodeDef>;
  selectedId: string;
  onEnterWing: (wingId: string) => void;
  onSelect: (id: string) => void;
};

export default function CampusView({
  seats,
  byWing,
  nodeById,
  selectedId,
  onEnterWing,
  onSelect,
}: Props) {
  return (
    <div className="org-hermes-campus">
      <header className="org-hermes-campus-head">
        <div className="org-hermes-campus-eyebrow">
          <span className="org-hermes-dot" aria-hidden />
          <span>Chronicle · Corporate Directory</span>
        </div>
        <h1 className="org-hermes-campus-title">
          乔志 <span className="org-hermes-campus-title-mono">/ inc.</span>
        </h1>
        <p className="org-hermes-campus-lead">
          六个部门，{seats.length} 名员工。点击任一部门卡片查看内部编制与工位。
          <br />
          <span className="org-hermes-campus-lead-mono">
            hermes chronicle open —dept &lt;id&gt;
          </span>
        </p>
      </header>

      <ol className="org-hermes-dept-grid">
        {ORG_WING_SIDEBAR_ORDER.map((wingId) => {
          const meta = ORG_WING_META[wingId];
          if (!meta) return null;
          const roster = byWing.get(wingId) ?? [];
          const head = roster.find((s) => s.isHead);
          const headNode = head ? nodeById.get(head.id) : null;
          return (
            <li key={wingId}>
              <button
                type="button"
                className="org-hermes-dept-card"
                onClick={() => onEnterWing(wingId)}
                aria-label={`进入 ${meta.title}`}
              >
                <div className="org-hermes-dept-card-head">
                  <span className="org-hermes-dept-index">
                    {HERMES_DEPT_INDEX[wingId]}
                  </span>
                  <span className="org-hermes-dept-keyword">
                    {HERMES_DEPT_KEYWORD[wingId]}
                  </span>
                </div>
                <div className="org-hermes-dept-title">{meta.title}</div>
                <div className="org-hermes-dept-sub">{meta.subtitle}</div>
                <div className="org-hermes-dept-meta">
                  <span className="org-hermes-dept-meta-num">
                    {roster.length.toString().padStart(2, "0")}
                  </span>
                  <span className="org-hermes-dept-meta-label">在编</span>
                  {headNode && (
                    <>
                      <span className="org-hermes-dept-meta-sep">·</span>
                      <span className="org-hermes-dept-meta-head">
                        负责人 {headNode.label}
                      </span>
                    </>
                  )}
                </div>
                <div
                  className="org-hermes-dept-dots"
                  aria-hidden
                  data-count={roster.length}
                >
                  {roster.map((s) => (
                    <span
                      key={s.id}
                      className={
                        "org-hermes-dept-dot" +
                        (s.isHead ? " org-hermes-dept-dot--head" : "") +
                        (s.id === selectedId ? " org-hermes-dept-dot--active" : "")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(s.id);
                      }}
                      role="button"
                      tabIndex={-1}
                      title={nodeById.get(s.id)?.label ?? s.id}
                    />
                  ))}
                </div>
                <span className="org-hermes-dept-cta" aria-hidden>
                  查看部门 →
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
