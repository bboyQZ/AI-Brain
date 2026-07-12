/**
 * PRIVATE chronicle — 全屏人物故事 Overlay。
 * 与 AI 课程 / 源码导读无关；勿从 guide/ 引用本模块。
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CHRONICLE_FLOW,
  nodeBio,
  nodeImages,
  type ChronicleFlow,
  type ChronicleNodeDef,
  type ChronicleViewMode,
} from "./flows";
import ChronicleScene3D from "./ChronicleScene3D";
import ChronicleOrgScene from "./ChronicleOrgScene";
import ChronicleStoryReader from "./ChronicleStoryReader";
import ChronicleTimeline from "./ChronicleTimeline";
import { NARRATIVE_FULL } from "./narratives";
import { BOSS_ID, WING_HEAD_IDS } from "./orgMemberOrder";
import "./ChronicleOverlay.css";
import {
  portraitBundles,
  type PortraitBundle,
} from "./portraitAssets";
import {
  filterRomanceFlowForEra,
  loadChronicleEra,
  saveChronicleEra,
  type ChronicleEra,
} from "./timeline";

const PORTRAIT_FALLBACK_CHAIN = ["display", "thumb", "full"] as const;
type PortraitFallbackStage = (typeof PORTRAIT_FALLBACK_CHAIN)[number];

function portraitSrcAtStage(bundle: PortraitBundle, stage: PortraitFallbackStage) {
  return bundle[stage];
}

function nextPortraitFallbackStage(
  stage: PortraitFallbackStage,
): PortraitFallbackStage | null {
  const i = PORTRAIT_FALLBACK_CHAIN.indexOf(stage);
  return i < PORTRAIT_FALLBACK_CHAIN.length - 1
    ? PORTRAIT_FALLBACK_CHAIN[i + 1]!
    : null;
}

function PortraitImage({
  bundle,
  className,
  initialStage = "thumb",
  onExhausted,
}: {
  bundle: PortraitBundle;
  className?: string;
  initialStage?: PortraitFallbackStage;
  onExhausted?: () => void;
}) {
  const [stage, setStage] = useState<PortraitFallbackStage>(initialStage);
  const src = portraitSrcAtStage(bundle, stage);

  useEffect(() => {
    setStage(initialStage);
  }, [bundle.full, initialStage]);

  return (
    <img
      className={className}
      src={src}
      alt=""
      decoding="async"
      onError={() => {
        const next = nextPortraitFallbackStage(stage);
        if (next) setStage(next);
        else onExhausted?.();
      }}
    />
  );
}

const LIGHTBOX_ZOOM_MIN = 0.1;
const LIGHTBOX_ZOOM_MAX = 6;
const LIGHTBOX_ZOOM_STEP = 0.15;

function clampLightboxZoom(z: number) {
  return Math.min(LIGHTBOX_ZOOM_MAX, Math.max(LIGHTBOX_ZOOM_MIN, z));
}

function StoryLightbox({
  bundles,
  index,
  onClose,
  onIndexChange,
}: {
  bundles: PortraitBundle[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const multi = bundles.length > 1;
  const bundle = bundles[index]!;
  /** 全屏默认增强图；「100%」切原图 1:1 */
  const [useOriginal, setUseOriginal] = useState(false);
  const [wantNative, setWantNative] = useState(false);
  const activeSrc = useOriginal ? bundle.full : bundle.enhanced;
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [vp, setVp] = useState({ w: 0, h: 0 });
  /** 1 = 适应视口；>1 放大；<1 缩小（相对适应基准） */
  const [userScale, setUserScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
  });

  const fitRatio =
    natural.w && vp.w
      ? Math.min(vp.w / natural.w, vp.h / natural.h)
      : 1;
  const effectiveRatio = fitRatio * userScale;
  const renderW = Math.round(natural.w * effectiveRatio);
  const renderH = Math.round(natural.h * effectiveRatio);
  const canPan = renderW > vp.w + 2 || renderH > vp.h + 2;
  const displayPercent = Math.round(effectiveRatio * 100);

  const measureViewport = useCallback(() => {
    const vpEl = viewportRef.current;
    if (vpEl) {
      setVp({ w: vpEl.clientWidth, h: vpEl.clientHeight });
    }
  }, []);

  const fitToWindow = useCallback(() => {
    setUseOriginal(false);
    setWantNative(false);
    setUserScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const resetToNative = useCallback(() => {
    setUseOriginal(true);
    setWantNative(true);
    setUserScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const adjustScale = useCallback((delta: number) => {
    setUserScale((s) => clampLightboxZoom(s + delta));
  }, []);

  useEffect(() => {
    setUseOriginal(false);
    setWantNative(false);
    setNatural({ w: 0, h: 0 });
    setUserScale(1);
    setPan({ x: 0, y: 0 });
  }, [index, bundle.full, bundle.enhanced]);

  useEffect(() => {
    setNatural({ w: 0, h: 0 });
    setUserScale(1);
    setPan({ x: 0, y: 0 });
  }, [activeSrc]);

  useEffect(() => {
    if (!wantNative || !natural.w || !vp.w) return;
    const fr = Math.min(vp.w / natural.w, vp.h / natural.h);
    if (fr > 0) setUserScale(1 / fr);
    setWantNative(false);
  }, [wantNative, natural.w, natural.h, vp.w, vp.h]);

  useLayoutEffect(() => {
    measureViewport();
    const ro = new ResizeObserver(measureViewport);
    const vpEl = viewportRef.current;
    if (vpEl) ro.observe(vpEl);
    return () => ro.disconnect();
  }, [measureViewport, index, bundle.full, bundle.enhanced]);

  useEffect(() => {
    if (!canPan) setPan({ x: 0, y: 0 });
  }, [canPan, userScale, renderW, renderH, vp.w, vp.h]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && !canPan) {
        onIndexChange((index - 1 + bundles.length) % bundles.length);
      }
      if (e.key === "ArrowRight" && !canPan) {
        onIndexChange((index + 1) % bundles.length);
      }
      if (e.key === "+" || e.key === "=") {
        adjustScale(LIGHTBOX_ZOOM_STEP);
      }
      if (e.key === "-") {
        adjustScale(-LIGHTBOX_ZOOM_STEP);
      }
      if (e.key === "0") fitToWindow();
      if (e.key === "1") resetToNative();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    onClose,
    onIndexChange,
    index,
    bundles.length,
    canPan,
    adjustScale,
    fitToWindow,
    resetToNative,
  ]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      adjustScale(e.deltaY < 0 ? 0.1 : -0.1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [adjustScale]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canPan) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.active = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    requestAnimationFrame(measureViewport);
  };

  const isNear = (a: number, b: number, eps = 0.04) => Math.abs(a - b) <= eps;
  const isFit = !useOriginal && isNear(userScale, 1);
  const isNative = useOriginal && isNear(effectiveRatio, 1);
  const hasPan = pan.x !== 0 || pan.y !== 0;

  return createPortal(
    <div
      className="chronicle-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="照片画廊"
      onClick={onClose}
    >
      <button
        type="button"
        className="chronicle-lightbox-close"
        onClick={onClose}
      >
        关闭
      </button>
      <div className="chronicle-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="chronicle-lightbox-zoom-btn"
          onClick={() => adjustScale(-LIGHTBOX_ZOOM_STEP)}
          aria-label="缩小"
        >
          −
        </button>
        <span className="chronicle-lightbox-zoom-label">
          {displayPercent}%
        </span>
        <button
          type="button"
          className="chronicle-lightbox-zoom-btn"
          onClick={() => adjustScale(LIGHTBOX_ZOOM_STEP)}
          aria-label="放大"
        >
          +
        </button>
        <button
          type="button"
          className={`chronicle-lightbox-zoom-reset${isFit ? " active" : ""}`}
          onClick={fitToWindow}
        >
          适应
        </button>
        <button
          type="button"
          className={`chronicle-lightbox-zoom-reset${isNative ? " active" : ""}`}
          onClick={resetToNative}
        >
          100%
        </button>
      </div>
      <div
        className="chronicle-lightbox-stage"
        onClick={(e) => e.stopPropagation()}
      >
        {multi && (
          <button
            type="button"
            className="chronicle-lightbox-nav chronicle-lightbox-nav--prev"
            onClick={() => onIndexChange((index - 1 + bundles.length) % bundles.length)}
            aria-label="上一张"
          >
            ‹
          </button>
        )}
        <div
          ref={viewportRef}
          className={`chronicle-lightbox-viewport${
            canPan ? " chronicle-lightbox-viewport--pan" : ""
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={() => {
            if (isNative) fitToWindow();
            else resetToNative();
          }}
        >
          <img
            ref={imgRef}
            className={`chronicle-lightbox-image${
              natural.w ? "" : " chronicle-lightbox-image--loading"
            }`}
            src={activeSrc}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="high"
            onLoad={onImageLoad}
            onError={() => {
              if (!useOriginal) setUseOriginal(true);
            }}
            style={{
              ...(natural.w
                ? { width: renderW, height: renderH }
                : undefined),
              transform: hasPan
                ? `translate(${pan.x}px, ${pan.y}px)`
                : undefined,
            }}
          />
        </div>
        {multi && (
          <button
            type="button"
            className="chronicle-lightbox-nav chronicle-lightbox-nav--next"
            onClick={() => onIndexChange((index + 1) % bundles.length)}
            aria-label="下一张"
          >
            ›
          </button>
        )}
      </div>
      {multi && (
        <>
          <p className="chronicle-lightbox-counter">
            {index + 1} / {bundles.length}
          </p>
          <div
            className="chronicle-lightbox-filmstrip"
            onClick={(e) => e.stopPropagation()}
          >
            {bundles.map((b, i) => (
              <button
                key={b.full}
                type="button"
                className={`chronicle-lightbox-thumb${
                  i === index ? " active" : ""
                }`}
                onClick={() => onIndexChange(i)}
              >
                <img src={b.thumb} alt="" onError={(e) => { e.currentTarget.src = b.display; }} />
              </button>
            ))}
          </div>
        </>
      )}
      <p className="chronicle-lightbox-hint">
        滚轮缩放 · 拖拽平移 · 双击在「适应」与「100%」间切换
      </p>
    </div>,
    document.body,
  );
}

function StoryGallery({
  images,
  variant = "panel",
}: {
  images: string[];
  variant?: "panel" | "dock" | "reader";
}) {
  const bundles = useMemo(() => portraitBundles(images), [images.join("|")]);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, true>>({});

  const visibleIndices = bundles
    .map((_, i) => i)
    .filter((i) => !failed[i]);
  const visibleBundles = visibleIndices.map((i) => bundles[i]!);
  const safeIndex = Math.min(index, Math.max(0, visibleBundles.length - 1));
  const current = visibleBundles[safeIndex];
  const multi = visibleBundles.length > 1;

  useEffect(() => {
    setIndex(0);
    setFailed({});
  }, [images.join("|")]);

  if (!visibleBundles.length || !current) return null;

  const openLightbox = (at: number) => {
    setLightboxIndex(at);
    setLightbox(true);
  };

  const go = (delta: number) => {
    setIndex((i) => {
      const cur = Math.min(i, visibleBundles.length - 1);
      return (cur + delta + visibleBundles.length) % visibleBundles.length;
    });
  };

  return (
    <>
      <div
        className={`chronicle-gallery${
          variant === "dock"
            ? " chronicle-gallery--dock"
            : variant === "reader"
              ? " chronicle-gallery--reader"
              : ""
        }`}
      >
        <div className="chronicle-gallery-main">
          {multi && (
            <button
              type="button"
              className="chronicle-gallery-nav chronicle-gallery-nav--prev"
              onClick={() => go(-1)}
              aria-label="上一张"
            >
              ‹
            </button>
          )}
          <button
            type="button"
            className={`chronicle-story-image-btn${
              variant === "dock"
                ? " chronicle-story-image-btn--dock"
                : variant === "reader"
                  ? " chronicle-story-image-btn--reader"
                  : ""
            }`}
            onClick={() => openLightbox(safeIndex)}
            aria-label="查看大图"
          >
            <PortraitImage
              bundle={current}
              className="chronicle-story-image"
              initialStage="display"
              onExhausted={() => {
                const orig = visibleIndices[safeIndex];
                if (orig !== undefined) {
                  setFailed((f) => ({ ...f, [orig]: true }));
                }
              }}
            />
          </button>
          {multi && (
            <button
              type="button"
              className="chronicle-gallery-nav chronicle-gallery-nav--next"
              onClick={() => go(1)}
              aria-label="下一张"
            >
              ›
            </button>
          )}
        </div>
        {multi && (
          <div className="chronicle-gallery-thumbs" role="tablist" aria-label="切换照片">
            {visibleBundles.map((b, i) => (
              <button
                key={b.full}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                className={`chronicle-gallery-thumb${i === safeIndex ? " active" : ""}`}
                onClick={() => setIndex(i)}
              >
                <PortraitImage bundle={b} initialStage="thumb" />
              </button>
            ))}
          </div>
        )}
        {multi && (
          <div className="chronicle-gallery-count">
            {safeIndex + 1} / {visibleBundles.length}
          </div>
        )}
      </div>
      {lightbox && (
        <StoryLightbox
          bundles={visibleBundles}
          index={lightboxIndex}
          onClose={() => setLightbox(false)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}

function matchPersonScore(node: ChronicleNodeDef, q: string): number {
  const label = node.label.toLowerCase();
  const sub = (node.subtitle ?? "").toLowerCase();
  const id = node.id.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (sub.includes(q)) return 40;
  if (id.includes(q)) return 20;
  return 0;
}

function ChroniclePersonSearch({
  nodes,
  protagonistId,
  onPick,
}: {
  nodes: ChronicleNodeDef[];
  protagonistId: string;
  onPick: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? nodes
          .map((n) => ({ n, score: matchPersonScore(n, q) }))
          .filter((x) => x.score > 0)
          .sort(
            (a, b) =>
              b.score - a.score ||
              a.n.label.localeCompare(b.n.label, "zh"),
          )
          .map((x) => x.n)
      : [...nodes].sort((a, b) => {
          if (a.id === protagonistId) return -1;
          if (b.id === protagonistId) return 1;
          return a.label.localeCompare(b.label, "zh");
        });
    return list.slice(0, 24);
  }, [nodes, query, protagonistId]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (id: string) => {
    onPick(id);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[activeIdx]!.id);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`chronicle-person-search${open ? " chronicle-person-search--open" : ""}`}
    >
      <input
        ref={inputRef}
        type="search"
        className="chronicle-person-search-input"
        placeholder="搜索姓名、部门…"
        value={query}
        aria-label="搜索人物"
        aria-expanded={open}
        aria-controls="chronicle-person-search-list"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id="chronicle-person-search-list"
          className="chronicle-person-search-list"
          role="listbox"
        >
          {results.length === 0 ? (
            <li className="chronicle-person-search-empty">无匹配人物</li>
          ) : (
            results.map((node, i) => (
              <li key={node.id} role="option" aria-selected={i === activeIdx}>
                <button
                  type="button"
                  className={`chronicle-person-search-item${
                    i === activeIdx ? " active" : ""
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => pick(node.id)}
                >
                  <span className="chronicle-person-search-name">
                    {node.label}
                    {node.id === protagonistId && (
                      <span className="chronicle-person-search-tag">主角</span>
                    )}
                  </span>
                  {node.subtitle && (
                    <span className="chronicle-person-search-sub">
                      {node.subtitle}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function orgStaffRoleChips(node: ChronicleNodeDef): string[] {
  const chips: string[] = [];
  if (node.id === BOSS_ID) chips.push("老板");
  if (Object.values(WING_HEAD_IDS).includes(node.id)) chips.push("负责人");
  return chips;
}

/** 与恋爱线星图 dock「与乔志」卡片同源；主角用 protagonistIntro。 */
function nodeRomanceBrief(node: ChronicleNodeDef, flow: ChronicleFlow): string {
  if (node.id === flow.protagonistId) return flow.protagonistIntro;
  return node.romanceBrief?.trim() || "暂无";
}

type StoryContentProps = {
  selected: ChronicleNodeDef;
  viewMode: ChronicleViewMode;
  flow: ChronicleFlow;
  layout?: "panel" | "dock";
  onOpenReader?: () => void;
  hasFullStory?: boolean;
};

function StoryContent({
  selected,
  viewMode,
  flow,
  layout = "panel",
  onOpenReader,
  hasFullStory,
}: StoryContentProps) {
  const isProtagonist = selected.id === flow.protagonistId;
  const images = nodeImages(selected);

  const storySections =
    viewMode === "org" ? (
      <>
        <div className="chronicle-story-section chronicle-story-section--staff">
          <div className="chronicle-story-section-title">人物档案</div>
          <div className="chronicle-story-body">{nodeBio(selected)}</div>
        </div>
        <div className="chronicle-story-section chronicle-story-section--staff">
          <div className="chronicle-story-section-title">人物关系</div>
          <div className="chronicle-story-body">
            {nodeRomanceBrief(selected, flow)}
          </div>
        </div>
        <p className="chronicle-story-tip">
          六部门翼楼 + 走廊互通；侧栏可快速切换部门。
        </p>
      </>
    ) : isProtagonist ? (
      <div className="chronicle-story-section">
        <div className="chronicle-story-section-title">主角</div>
        <div className="chronicle-story-body">{flow.protagonistIntro}</div>
        <p className="chronicle-story-tip">
          点选乔志可查看全员关系线；点选员工进入单人故事。
        </p>
      </div>
    ) : (
      <>
        <div className="chronicle-story-section">
          <div className="chronicle-story-section-title">公司</div>
          <div className="chronicle-story-body">{nodeBio(selected)}</div>
        </div>
        <div className="chronicle-story-section">
          <div className="chronicle-story-section-title">与乔志</div>
          {selected.romance && (
            <div className="chronicle-romance-pills">
              <span className="chronicle-pill">{selected.romance.kind}</span>
              <span className="chronicle-pill">{selected.romance.form}</span>
            </div>
          )}
          <div className="chronicle-story-body">
            {selected.romanceBrief?.trim() || "简介待补。"}
          </div>
          {hasFullStory && onOpenReader && (
            <button
              type="button"
              className="chronicle-story-cta"
              onClick={onOpenReader}
            >
              <span className="chronicle-story-cta-label">阅读完整故事</span>
              <span className="chronicle-story-cta-arrow" aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </>
    );

  if (layout === "dock") {
    return (
      <div className="chronicle-dock-layout">
        {images.length > 0 && (
          <aside className="chronicle-dock-photo">
            <StoryGallery images={images} variant="dock" />
          </aside>
        )}
        <div className="chronicle-dock-main">
          <div className="chronicle-story-header">
            <div className="chronicle-story-name">{selected.label}</div>
            {selected.subtitle && (
              <div className="chronicle-story-sub">{selected.subtitle}</div>
            )}
          </div>
          <div className="chronicle-dock-scroll">{storySections}</div>
        </div>
      </div>
    );
  }

  if (viewMode === "org") {
    return (
      <>
        {images.length > 0 && (
          <div className="chronicle-story-profile chronicle-story-profile--compact">
            <StoryGallery images={images} />
          </div>
        )}
        {storySections}
      </>
    );
  }

  return (
    <>
      <div className="chronicle-story-profile">
        {images.length > 0 && <StoryGallery images={images} />}
        <div className="chronicle-story-header">
          <div className="chronicle-story-name">{selected.label}</div>
          {selected.subtitle && (
            <div className="chronicle-story-sub">{selected.subtitle}</div>
          )}
        </div>
      </div>
      {storySections}
    </>
  );
}

type Props = {
  onClose: () => void;
  /** 开发/深链直达某视图（如 ?chronicle=org） */
  initialViewMode?: ChronicleViewMode;
};

export default function ChronicleOverlay({ onClose, initialViewMode }: Props) {
  const flow = CHRONICLE_FLOW;
  const [viewMode, setViewMode] = useState<ChronicleViewMode>(
    initialViewMode ?? flow.defaultView,
  );
  const [era, setEra] = useState<ChronicleEra>(() => loadChronicleEra());
  const [selectedId, setSelectedId] = useState<string>(flow.protagonistId);
  const [readerOpen, setReaderOpen] = useState(false);

  const romanceFlow = useMemo(
    () => filterRomanceFlowForEra(flow, era),
    [flow, era],
  );
  const visibleNodes =
    viewMode === "romance" ? romanceFlow.nodes : flow.nodes;

  const selected =
    visibleNodes.find((n) => n.id === selectedId) ??
    flow.nodes.find((n) => n.id === selectedId) ??
    null;
  const displayTitle =
    viewMode === "romance" ? flow.romanceTitle : flow.title;
  const isProtagonist = selected?.id === flow.protagonistId;
  const showRomanceDock =
    viewMode === "romance" && selected && !isProtagonist;
  const selectedNarrative = selected ? NARRATIVE_FULL[selected.id] : undefined;
  const hasFullStory = Boolean(selectedNarrative?.chapters.length);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleEraChange = useCallback((next: ChronicleEra) => {
    setEra(next);
    saveChronicleEra(next);
  }, []);

  useEffect(() => {
    if (viewMode !== "romance") return;
    if (!romanceFlow.nodes.some((n) => n.id === selectedId)) {
      setSelectedId(flow.protagonistId);
    }
  }, [viewMode, era, romanceFlow.nodes, selectedId, flow.protagonistId]);

  return (
    <div
      className={`chronicle-overlay ${viewMode === "romance" ? "chronicle-overlay--romance" : "chronicle-overlay--org"}`}
      role="dialog"
      aria-modal="true"
      aria-label={displayTitle}
    >
      <header className="chronicle-topbar">
        <div className="chronicle-topbar-start">
          <div
            className="chronicle-view-switch"
            role="tablist"
            aria-label="视图切换"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "romance"}
              className={viewMode === "romance" ? "active" : ""}
              onClick={() => setViewMode("romance")}
            >
              恋爱线
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "org"}
              className={viewMode === "org" ? "active" : ""}
              onClick={() => setViewMode("org")}
            >
              公司大楼
            </button>
          </div>
          <div className="chronicle-title">{displayTitle}</div>
        </div>
        <div className="chronicle-topbar-end">
          <ChroniclePersonSearch
            nodes={visibleNodes}
            protagonistId={flow.protagonistId}
            onPick={setSelectedId}
          />
          {viewMode === "romance" && !isProtagonist && (
            <button
              type="button"
              className="chronicle-back-protagonist"
              onClick={() => setSelectedId(flow.protagonistId)}
            >
              回到乔志
            </button>
          )}
          {viewMode === "org" && (
            <button
              type="button"
              className="chronicle-back-protagonist"
              onClick={() => setSelectedId(flow.protagonistId)}
            >
              返回目录
            </button>
          )}
          <button type="button" className="chronicle-close" onClick={onClose}>
            关闭
          </button>
        </div>
      </header>

      <div
        className={`chronicle-body${showRomanceDock ? " chronicle-body--romance-dock" : ""}`}
      >
        <div className="chronicle-canvas">
          {viewMode === "romance" ? (
            <ChronicleScene3D
              key={era}
              flow={romanceFlow}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : (
            <ChronicleOrgScene
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {viewMode === "romance" && (
            <ChronicleTimeline era={era} onEraChange={handleEraChange} />
          )}
          {showRomanceDock && (
            <section
              className="chronicle-romance-dock"
              aria-label={`${selected.label} 的故事`}
            >
              <StoryContent
                selected={selected}
                viewMode={viewMode}
                flow={flow}
                layout="dock"
                hasFullStory={hasFullStory}
                onOpenReader={() => setReaderOpen(true)}
              />
            </section>
          )}
        </div>

        {readerOpen && selected && selectedNarrative && (
          <ChronicleStoryReader
            personLabel={selected.label}
            personSubtitle={selected.subtitle}
            narrative={selectedNarrative}
            photo={
              nodeImages(selected).length > 0 ? (
                <StoryGallery images={nodeImages(selected)} variant="reader" />
              ) : undefined
            }
            onClose={() => setReaderOpen(false)}
          />
        )}


        {viewMode === "org" && (
          <section className="chronicle-story-panel chronicle-story-panel--staff-dossier">
            {selected ? (
              <>
                <div className="chronicle-staff-dossier-head">
                  <span className="chronicle-staff-dossier-led" aria-hidden />
                  <div>
                    <div className="chronicle-staff-dossier-kicker">员工档案</div>
                    <div className="chronicle-staff-dossier-name">{selected.label}</div>
                    {selected.subtitle && (
                      <div className="chronicle-staff-dossier-sub">{selected.subtitle}</div>
                    )}
                    <div className="chronicle-staff-role-chips">
                      {orgStaffRoleChips(selected).map((chip) => (
                        <span key={chip} className="chronicle-staff-role-chip">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <StoryContent
                  selected={selected}
                  viewMode={viewMode}
                  flow={flow}
                />
              </>
            ) : (
              <p className="chronicle-story-empty">选择一名员工查看档案</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
