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
const CHRONICLE_LONG_PRESS_MS = 800;

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
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore persistence failures
    }
  }, [theme]);

  const clearLongPress = () => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onHotZonePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      setChronicleOpen(true);
    }, CHRONICLE_LONG_PRESS_MS);
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
            type="button"
            className="chronicle-hotzone"
            aria-hidden="true"
            tabIndex={-1}
            onPointerDown={onHotZonePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={clearLongPress}
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
          <ChronicleOverlay onClose={() => setChronicleOpen(false)} />
        )}
      </div>
    </BrowserRouter>
  );
}
