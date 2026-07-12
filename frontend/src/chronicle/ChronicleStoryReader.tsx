/**
 * PRIVATE chronicle — 人物长篇故事沉浸阅读层。
 * 视觉延续恋爱线星图：深空玻璃面板 + 冷色星辉描边 + 左侧肖像。
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Narrative } from "./narratives";

type Props = {
  personLabel: string;
  personSubtitle?: string;
  narrative: Narrative;
  /** 左侧肖像区（由 Overlay 传入 StoryGallery） */
  photo?: ReactNode;
  onClose: () => void;
};

export default function ChronicleStoryReader({
  personLabel,
  personSubtitle,
  narrative,
  photo,
  onClose,
}: Props) {
  const { chapters } = narrative;
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chapterRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = (visible[0].target as HTMLElement).dataset.chapterId;
          if (id) setActiveId(id);
        }
      },
      {
        root,
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0, 0.1, 0.5, 1],
      },
    );
    Object.values(chapterRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [chapters]);

  const totalWords = useMemo(
    () =>
      chapters.reduce(
        (acc, c) => acc + c.paragraphs.reduce((a, p) => a + p.length, 0),
        0,
      ),
    [chapters],
  );

  const jumpTo = (id: string) => {
    const el = chapterRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="chronicle-reader"
      role="dialog"
      aria-modal="true"
      aria-label={`${personLabel} 的完整故事`}
    >
      <div className="chronicle-reader-veil" aria-hidden="true" />
      <article className="chronicle-reader-sheet">
        {photo && <aside className="chronicle-reader-photo">{photo}</aside>}

        <div className="chronicle-reader-body">
          <header className="chronicle-reader-head">
            <div className="chronicle-reader-head-main">
              <div className="chronicle-reader-eyebrow">恋爱线 · 星轨叙事</div>
              <h1 className="chronicle-reader-title">
                <span className="chronicle-reader-name">{personLabel}</span>
                {personSubtitle && (
                  <span className="chronicle-reader-sub">{personSubtitle}</span>
                )}
              </h1>
              <div className="chronicle-reader-meta">
                <span>共 {chapters.length} 章</span>
                <span className="chronicle-reader-dot" aria-hidden="true">
                  ·
                </span>
                <span>约 {Math.round(totalWords / 100) / 10} 千字</span>
              </div>
            </div>
            <button
              type="button"
              className="chronicle-reader-close"
              onClick={onClose}
              aria-label="返回星图"
            >
              <span className="chronicle-reader-close-arrow" aria-hidden="true">
                ←
              </span>
              返回星图
            </button>
          </header>

          <div className="chronicle-reader-layout">
            <nav className="chronicle-reader-toc" aria-label="章节目录">
              <div className="chronicle-reader-toc-label">星轨目录</div>
              <ol className="chronicle-reader-toc-list">
                {chapters.map((c) => (
                  <li
                    key={c.id}
                    className={`chronicle-reader-toc-item${activeId === c.id ? " is-active" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => jumpTo(c.id)}
                      aria-current={activeId === c.id ? "true" : undefined}
                    >
                      <span className="chronicle-reader-toc-star" aria-hidden="true" />
                      <span className="chronicle-reader-toc-ordinal">{c.ordinal}</span>
                      <span className="chronicle-reader-toc-title">{c.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="chronicle-reader-scroll" ref={scrollRef}>
              <div className="chronicle-reader-column">
                {chapters.map((c) => (
                  <section
                    key={c.id}
                    className="chronicle-chapter"
                    data-chapter-id={c.id}
                    ref={(el) => {
                      chapterRefs.current[c.id] = el;
                    }}
                  >
                    <div className="chronicle-chapter-head">
                      <span className="chronicle-chapter-star" aria-hidden="true" />
                      <span className="chronicle-chapter-ordinal">{c.ordinal}</span>
                      <h2 className="chronicle-chapter-title">{c.subtitle}</h2>
                    </div>
                    {c.paragraphs.map((p, i) => (
                      <p key={i} className="chronicle-chapter-para">
                        {p}
                      </p>
                    ))}
                  </section>
                ))}
                <footer className="chronicle-reader-foot">
                  <span className="chronicle-reader-foot-orbit" aria-hidden="true" />
                  <span>轨道尽处</span>
                  <span className="chronicle-reader-foot-orbit" aria-hidden="true" />
                </footer>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
