import { Link } from "react-router-dom";
import { useState } from "react";
import TokenizeDemo from "../components/lab/TokenizeDemo";
import AttentionDemo from "../components/lab/AttentionDemo";
import EmbeddingDemo from "../components/lab/EmbeddingDemo";
import RagDemo from "../components/lab/RagDemo";
import FunctionCallingDemo from "../components/lab/FunctionCallingDemo";
import ReActLoopDemo from "../components/lab/ReActLoopDemo";
import LabRichText from "../components/lab/LabRichText";
import "./LabPage.css";

type Tab = "tokenize" | "attention" | "embedding" | "rag" | "function-calling" | "react-loop" | "architecture";

const TABS: { key: Tab; label: string; desc: string }[] = [
  { key: "tokenize", label: "Tokenize", desc: "看文本如何被切成 Token" },
  { key: "attention", label: "Attention", desc: "看注意力权重如何连接 Token" },
  { key: "embedding", label: "Embedding", desc: "看语义如何映射到向量空间" },
  { key: "rag", label: "RAG", desc: "Chunk 切块 + 向量库检索（Lesson 6～7）" },
  { key: "function-calling", label: "Function Calling", desc: "LLM 不执行代码，只输出 JSON（Lesson 9）" },
  { key: "react-loop", label: "ReAct Loop", desc: "Reason → Act → Observe 真实循环（Lesson 10）" },
  { key: "architecture", label: "Architecture", desc: "跳到源码导读：方法方块 + 真代码" },
];

export default function LabPage() {
  const [tab, setTab] = useState<Tab>("tokenize");
  const [sampleText, setSampleText] = useState("");
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div className="lab-page">
      <div className="lab-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`lab-tab ${t.key === tab ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="lab-split">
        <section className="lab-demo-pane" aria-label="当前示例">
          <div className="lab-header">
            <h2 className="lab-title">{current.label}</h2>
            <p className="lab-desc">{current.desc}</p>
          </div>
          <div className="lab-demo-body">
            {tab === "tokenize" && <TokenizeDemo sampleText={sampleText} />}
            {tab === "attention" && <AttentionDemo sampleText={sampleText} />}
            {tab === "embedding" && <EmbeddingDemo sampleText={sampleText} />}
            {tab === "rag" && <RagDemo sampleText={sampleText} />}
            {tab === "function-calling" && <FunctionCallingDemo sampleText={sampleText} />}
            {tab === "react-loop" && <ReActLoopDemo sampleText={sampleText} />}
            {tab === "architecture" && (
              <div className="lab-architecture">
                <p className="lab-architecture-text">
                  完整学习入口在顶栏「源码导读」：每条流程由真实方法方块组成，点方块可看函数源码，箭头表示调用关系。
                </p>
                <Link className="lab-architecture-link" to="/guide">
                  打开源码导读（方法方块图）→
                </Link>
              </div>
            )}
          </div>
        </section>

        <aside className="lab-notes-pane" aria-label="示例文本">
          <div className="lab-notes-label">示例文本（全 Tab 共用）</div>
          <LabRichText onPlainTextChange={setSampleText} />
        </aside>
      </div>
    </div>
  );
}
