import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LabPage from "./pages/LabPage";
import KnowledgePage from "./pages/KnowledgePage";
import GuidePage from "./pages/GuidePage";
/** PRIVATE chronicle glue — 不进入导航/路由 */
import ChronicleOverlay from "./chronicle/ChronicleOverlay";

type Theme = "light" | "dark";

const THEME_KEY = "ai-brain-theme";
const CHRONICLE_LONG_PRESS_MS = 700;
const CHRONICLE_LONG_PRESS_MOVE_PX = 14;

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = readTheme();
    applyTheme(initial);
    return initial;
  });
  const [chronicleOpen, setChronicleOpen] = useState(() => {
    if (!import.meta.env.DEV) return false;
    const mode = new URLSearchParams(window.location.search).get("chronicle");
    return mode === "org" || mode === "1" || mode === "open";
  });
  const chronicleInitialView = (() => {
    if (!import.meta.env.DEV) return undefined;
    const mode = new URLSearchParams(window.location.search).get("chronicle");
    return mode === "org" ? ("org" as const) : undefined;
  })();
  const hotZoneRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore persistence failures
    }
  }, [theme]);

  useEffect(() => {
    const el = hotZoneRef.current;
    if (!el) return;

    const clearLongPress = () => {
      if (longPressTimer.current != null) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      longPressOrigin.current = null;
    };

    const triggerLongPress = () => {
      clearLongPress();
      setChronicleOpen(true);
      navigator.vibrate?.(12);
    };

    const scheduleLongPress = (x: number, y: number) => {
      clearLongPress();
      longPressOrigin.current = { x, y };
      longPressTimer.current = window.setTimeout(() => {
        longPressTimer.current = null;
        longPressOrigin.current = null;
        triggerLongPress();
      }, CHRONICLE_LONG_PRESS_MS);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        clearLongPress();
        return;
      }
      e.preventDefault();
      const t = e.touches[0];
      scheduleLongPress(t.clientX, t.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (longPressTimer.current == null || !longPressOrigin.current) return;
      if (e.touches.length !== 1) {
        clearLongPress();
        return;
      }
      const t = e.touches[0];
      const dx = t.clientX - longPressOrigin.current.x;
      const dy = t.clientY - longPressOrigin.current.y;
      if (Math.hypot(dx, dy) > CHRONICLE_LONG_PRESS_MOVE_PX) {
        clearLongPress();
      }
    };

    const onTouchEnd = () => {
      clearLongPress();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      clearLongPress();
    };
  }, []);

  const clearLongPress = () => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOrigin.current = null;
  };

  const onHotZonePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    e.preventDefault();
    clearLongPress();
    longPressOrigin.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      longPressOrigin.current = null;
      setChronicleOpen(true);
    }, CHRONICLE_LONG_PRESS_MS);
  };

  const onHotZonePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") return;
    if (longPressTimer.current == null || !longPressOrigin.current) return;
    const dx = e.clientX - longPressOrigin.current.x;
    const dy = e.clientY - longPressOrigin.current.y;
    if (Math.hypot(dx, dy) > CHRONICLE_LONG_PRESS_MOVE_PX) {
      clearLongPress();
    }
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="topnav">
          <div className="brand">AI-Brain</div>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              对话
            </NavLink>
            <NavLink to="/lab" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              概念实验室
            </NavLink>
            <NavLink to="/knowledge" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              知识库
            </NavLink>
            <NavLink to="/guide" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              源码导读
            </NavLink>
          </div>
          <button
            ref={hotZoneRef}
            type="button"
            className="chronicle-hotzone"
            aria-hidden="true"
            tabIndex={-1}
            onPointerDown={onHotZonePointerDown}
            onPointerMove={onHotZonePointerMove}
            onPointerUp={clearLongPress}
            onPointerCancel={clearLongPress}
            onContextMenu={(e) => e.preventDefault()}
          />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "切换为暗色" : "切换为浅色"}
          >
            {theme === "light" ? "暗色" : "浅色"}
          </button>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/knowledge/:docId" element={<KnowledgePage />} />
            <Route path="/guide" element={<GuidePage />} />
          </Routes>
        </main>
        {chronicleOpen && (
          <ChronicleOverlay
            onClose={() => setChronicleOpen(false)}
            initialViewMode={chronicleInitialView}
          />
        )}
      </div>
    </BrowserRouter>
  );
}
