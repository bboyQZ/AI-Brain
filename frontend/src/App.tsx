import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LabPage from "./pages/LabPage";

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
          </div>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/lab" element={<LabPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
