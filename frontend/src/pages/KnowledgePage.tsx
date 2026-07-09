import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, type KnowledgeDocInfo, type KnowledgeDocDetail } from "../api/client";
import "./KnowledgePage.css";

/** 标题文本 → 稳定锚点 id（与 loc 参数匹配用） */
function headingId(text: string): string {
  return `h-${encodeURIComponent(text.trim().toLowerCase().replace(/\s+/g, "-"))}`;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}

function makeHeading(Tag: "h1" | "h2" | "h3" | "h4") {
  return function Heading({ children }: { children?: React.ReactNode }) {
    const text = extractText(children);
    return <Tag id={headingId(text)}>{children}</Tag>;
  };
}

const mdComponents = {
  h1: makeHeading("h1"),
  h2: makeHeading("h2"),
  h3: makeHeading("h3"),
  h4: makeHeading("h4"),
};

export default function KnowledgePage() {
  const { docId } = useParams<{ docId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [docs, setDocs] = useState<KnowledgeDocInfo[]>([]);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [doc, setDoc] = useState<KnowledgeDocDetail | null>(null);
  const [docState, setDocState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const articleRef = useRef<HTMLDivElement>(null);

  const loadList = () => {
    setListState("loading");
    api.listKnowledgeDocs()
      .then((list) => {
        setDocs(list);
        setListState("ready");
      })
      .catch(() => setListState("error"));
  };

  useEffect(loadList, []);

  // 无选中文档时默认打开第一篇
  useEffect(() => {
    if (!docId && listState === "ready" && docs.length > 0) {
      navigate(`/knowledge/${encodeURIComponent(docs[0].id)}`, { replace: true });
    }
  }, [docId, listState, docs, navigate]);

  useEffect(() => {
    if (!docId) {
      setDoc(null);
      setDocState("idle");
      return;
    }
    let cancelled = false;
    setDocState("loading");
    api.getKnowledgeDoc(docId)
      .then((d) => {
        if (cancelled) return;
        setDoc(d);
        setDocState("ready");
      })
      .catch(() => {
        if (!cancelled) setDocState("error");
      });
    return () => { cancelled = true; };
  }, [docId]);

  // 文档渲染完成后按 ?loc= 滚动定位并高亮
  const loc = searchParams.get("loc") || "";
  useEffect(() => {
    if (docState !== "ready" || !articleRef.current) return;
    const container = articleRef.current;
    if (!loc) {
      container.closest(".knowledge-main")?.scrollTo({ top: 0 });
      return;
    }
    const headings = Array.from(container.querySelectorAll("h1, h2, h3, h4"));
    const needle = loc.trim().toLowerCase();
    const target =
      headings.find((h) => (h.textContent || "").trim().toLowerCase() === needle) ||
      headings.find((h) => (h.textContent || "").trim().toLowerCase().includes(needle));
    if (!target) {
      container.closest(".knowledge-main")?.scrollTo({ top: 0 });
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("heading-highlight");
    const timer = setTimeout(() => target.classList.remove("heading-highlight"), 2000);
    return () => clearTimeout(timer);
  }, [docState, loc, doc]);

  const groups = useMemo(() => ({
    curriculum: docs.filter((d) => d.source_type === "curriculum"),
    note: docs.filter((d) => d.source_type === "note"),
  }), [docs]);

  return (
    <div className="knowledge-page">
      <aside className="knowledge-sidebar">
        {listState === "loading" && <div className="knowledge-hint">加载中...</div>}
        {listState === "error" && (
          <div className="knowledge-hint">
            加载失败
            <button type="button" className="retry-btn" onClick={loadList}>重试</button>
          </div>
        )}
        {listState === "ready" && (
          <>
            <div className="doc-group">
              <div className="doc-group-title">课程</div>
              {groups.curriculum.length === 0 && <div className="doc-group-empty">暂无课程</div>}
              {groups.curriculum.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`doc-item ${d.id === docId ? "active" : ""}`}
                  title={d.title}
                  onClick={() => navigate(`/knowledge/${encodeURIComponent(d.id)}`)}
                >
                  {d.title}
                </button>
              ))}
            </div>
            <div className="doc-group">
              <div className="doc-group-title">笔记</div>
              {groups.note.length === 0 && <div className="doc-group-empty">暂无笔记</div>}
              {groups.note.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`doc-item ${d.id === docId ? "active" : ""}`}
                  title={d.title}
                  onClick={() => navigate(`/knowledge/${encodeURIComponent(d.id)}`)}
                >
                  {d.title}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
      <div className="knowledge-main">
        <div className="knowledge-main-inner">
          {docState === "loading" && <div className="knowledge-hint">加载中...</div>}
          {docState === "error" && (
            <div className="knowledge-hint">文档不存在或加载失败（{docId}）</div>
          )}
          {docState === "ready" && doc && (
            <>
              <header className="doc-header">
                <span className={`doc-type-badge ${doc.source_type}`}>
                  {doc.source_type === "note" ? "笔记" : "课程"}
                </span>
                <span className="doc-file-name">{doc.id}</span>
              </header>
              <article ref={articleRef} className="doc-article">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {doc.content}
                </ReactMarkdown>
              </article>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
