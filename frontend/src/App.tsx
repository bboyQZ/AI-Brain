import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LabPage from "./pages/LabPage";
import KnowledgePage from "./pages/KnowledgePage";

export default function App() {
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
          </div>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/knowledge/:docId" element={<KnowledgePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
