/**
 * PRIVATE chronicle — 恋爱星图右侧竖向星轨时间轴。
 */
import { useCallback, useEffect, useRef } from "react";
import {
  CHRONICLE_ERAS,
  type ChronicleEra,
} from "./timeline";

type Props = {
  era: ChronicleEra;
  onEraChange: (era: ChronicleEra) => void;
};

export default function ChronicleTimeline({ era, onEraChange }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const activeIdx = CHRONICLE_ERAS.findIndex((e) => e.id === era);
  const activeDef = CHRONICLE_ERAS[activeIdx] ?? CHRONICLE_ERAS[CHRONICLE_ERAS.length - 1]!;

  const scrollActiveIntoView = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLButtonElement>(
      `[data-era="${era}"]`,
    );
    btn?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [era]);

  useEffect(() => {
    scrollActiveIntoView();
  }, [scrollActiveIntoView]);

  const step = (delta: number) => {
    const next = Math.max(0, Math.min(CHRONICLE_ERAS.length - 1, activeIdx + delta));
    onEraChange(CHRONICLE_ERAS[next]!.id);
  };

  return (
    <aside className="chronicle-timeline" aria-label="星轨时间轴">
      <div className="chronicle-timeline-head">
        <span className="chronicle-timeline-kicker">星轨</span>
        <span className="chronicle-timeline-active" aria-live="polite">
          {activeDef.label}
        </span>
      </div>

      <div
        className="chronicle-timeline-rail-wrap"
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            step(-1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            step(1);
          }
        }}
      >
        <div
          ref={railRef}
          className="chronicle-timeline-rail"
          role="listbox"
          aria-label="选择时间节点"
          tabIndex={0}
        >
          <div className="chronicle-timeline-track" aria-hidden />
          {CHRONICLE_ERAS.map((def, i) => {
            const isActive = def.id === era;
            const isPast = i < activeIdx;
            return (
              <button
                key={def.id}
                type="button"
                role="option"
                aria-selected={isActive}
                data-era={def.id}
                className={[
                  "chronicle-timeline-tick",
                  isActive ? "active" : "",
                  isPast ? "past" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={def.label}
                onClick={() => onEraChange(def.id)}
              >
                <span className="chronicle-timeline-dot" aria-hidden />
                <span className="chronicle-timeline-short">{def.short}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
