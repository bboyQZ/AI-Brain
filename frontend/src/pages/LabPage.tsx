import { useState } from "react";
import TokenizeDemo from "../components/lab/TokenizeDemo";
import AttentionDemo from "../components/lab/AttentionDemo";
import EmbeddingDemo from "../components/lab/EmbeddingDemo";
import "./LabPage.css";

type Tab = "tokenize" | "attention" | "embedding";

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: "tokenize", label: "Tokenize", desc: "看文本如何被切成 Token" },
  { key: "attention", label: "Attention", desc: "看注意力权重如何连接 Token" },
  { key: "embedding", label: "Embedding", desc: "看语义如何映射到向量空间" },
];

export default function LabPage() {
  const [tab, setTab] = useState<Tab>("tokenize");
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="lab-page">
      <div className="lab-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`lab-tab ${t.key === tab ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="lab-content">
        <div className="lab-header">
          <h2 className="lab-title">{current.label}</h2>
          <p className="lab-desc">{current.desc}</p>
        </div>
        {tab === "tokenize" && <TokenizeDemo />}
        {tab === "attention" && <AttentionDemo />}
        {tab === "embedding" && <EmbeddingDemo />}
      </div>
    </div>
  );
}
