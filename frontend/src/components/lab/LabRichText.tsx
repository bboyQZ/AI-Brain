import { useCallback, useEffect, useRef, useState } from "react";
import defaultHtml from "../../lab-notes/default.html?raw";
import "./LabRichText.css";

const STORAGE_KEY = "ai-brain-lab-richtext";
const MAX_CHARS = 10000;

function clampHtml(html: string): string {
  if (html.length <= MAX_CHARS) return html;
  return html.slice(0, MAX_CHARS);
}

function readDraft(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeDraft(html: string) {
  try {
    localStorage.setItem(STORAGE_KEY, html);
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function htmlToPlain(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.innerText || el.textContent || "").replace(/\u00a0/g, " ").trimEnd();
}

type Props = {
  onPlainTextChange?: (plain: string) => void;
};

export default function LabRichText({ onPlainTextChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [chars, setChars] = useState(0);
  const [ready, setReady] = useState(false);

  const emitPlain = useCallback(
    (html: string) => {
      onPlainTextChange?.(htmlToPlain(html));
    },
    [onPlainTextChange],
  );

  const fill = useCallback(
    (html: string) => {
      const el = editorRef.current;
      if (!el) return;
      const next = clampHtml(html);
      el.innerHTML = next;
      setChars(next.length);
      emitPlain(next);
    },
    [emitPlain],
  );

  const syncFromEditor = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    let html = el.innerHTML;
    if (html.length > MAX_CHARS) {
      html = clampHtml(html);
      el.innerHTML = html;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setChars(html.length);
    writeDraft(html);
    emitPlain(html);
  }, [emitPlain]);

  useEffect(() => {
    const draft = readDraft();
    const html = draft && draft.length > 0 ? draft : defaultHtml;
    const t = window.setTimeout(() => {
      fill(html);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [fill]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncFromEditor();
  };

  const restoreDefault = () => {
    clearDraft();
    fill(defaultHtml);
  };

  return (
    <div className="lab-richtext">
      <div className="lab-richtext-toolbar">
        <button type="button" className="lab-richtext-btn" onClick={() => exec("bold")} title="粗体">
          B
        </button>
        <button type="button" className="lab-richtext-btn italic" onClick={() => exec("italic")} title="斜体">
          I
        </button>
        <button type="button" className="lab-richtext-btn" onClick={() => exec("insertUnorderedList")} title="无序列表">
          • 列表
        </button>
        <button type="button" className="lab-richtext-btn" onClick={() => exec("insertOrderedList")} title="有序列表">
          1. 列表
        </button>
        <button type="button" className="lab-richtext-btn" onClick={() => exec("removeFormat")} title="清除格式">
          清除格式
        </button>
        <button type="button" className="lab-richtext-btn ghost" onClick={restoreDefault}>
          恢复默认
        </button>
        <span className={`lab-richtext-count ${chars >= MAX_CHARS ? "full" : ""}`}>
          {chars} / {MAX_CHARS}
        </span>
      </div>
      <div
        ref={editorRef}
        className="lab-richtext-editor"
        contentEditable={ready}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="共用示例文本"
        onInput={syncFromEditor}
        onPaste={() => {
          window.setTimeout(syncFromEditor, 0);
        }}
      />
    </div>
  );
}
