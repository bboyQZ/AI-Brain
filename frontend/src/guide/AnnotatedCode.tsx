import { useEffect, useMemo, useState } from "react";
import type { LineExplain } from "./flows";

type Props = {
  code: string;
  explains: LineExplain[];
};

type Block =
  | { kind: "plain"; line: number }
  | { kind: "group"; start: number; end: number; text: string };

function buildBlocks(total: number, explains: LineExplain[]): Block[] {
  const sorted = [...explains].sort((a, b) => a.line - b.line);
  const covered = new Set<number>();
  const groups: { start: number; end: number; text: string }[] = [];

  for (const e of sorted) {
    const start = Math.max(1, e.line);
    const end = Math.min(total, e.endLine ?? e.line);
    if (start > end) continue;
    let overlap = false;
    for (let i = start; i <= end; i++) {
      if (covered.has(i)) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;
    for (let i = start; i <= end; i++) covered.add(i);
    groups.push({ start, end, text: e.text });
  }

  const blocks: Block[] = [];
  let i = 1;
  while (i <= total) {
    const g = groups.find((x) => x.start === i);
    if (g) {
      blocks.push({ kind: "group", start: g.start, end: g.end, text: g.text });
      i = g.end + 1;
    } else {
      blocks.push({ kind: "plain", line: i });
      i += 1;
    }
  }
  return blocks;
}

function groupKey(start: number, end: number) {
  return `${start}-${end}`;
}

/** 去掉公共缩进，避免窄栏里行号后一大片空白 */
function dedentLines(lines: string[]): string[] {
  const expanded = lines.map((l) => l.replace(/\t/g, "  "));
  const indents = expanded
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^ */)?.[0].length ?? 0);
  if (indents.length === 0) return expanded;
  const min = Math.min(...indents);
  if (min <= 0) return expanded;
  return expanded.map((l) => (l.trim().length === 0 ? l : l.slice(min)));
}

export default function AnnotatedCode({ code, explains }: Props) {
  const lines = useMemo(
    () => dedentLines(code.replace(/\n$/, "").split("\n")),
    [code],
  );
  const blocks = useMemo(
    () => buildBlocks(lines.length, explains),
    [lines.length, explains],
  );

  const firstKey = useMemo(() => {
    const g = blocks.find((b) => b.kind === "group");
    return g && g.kind === "group" ? groupKey(g.start, g.end) : null;
  }, [blocks]);

  const [activeKey, setActiveKey] = useState<string | null>(firstKey);

  useEffect(() => {
    setActiveKey(firstKey);
  }, [code, firstKey]);

  const activeText = useMemo(() => {
    if (!activeKey) return null;
    const [a, b] = activeKey.split("-").map(Number);
    const fromExplain = explains.find(
      (e) => e.line === a && (e.endLine ?? e.line) === b,
    )?.text;
    if (fromExplain) return fromExplain;
    const fromBlock = blocks.find(
      (bl): bl is Extract<Block, { kind: "group" }> =>
        bl.kind === "group" && bl.start === a && bl.end === b,
    );
    return fromBlock?.text ?? null;
  }, [activeKey, explains, blocks]);

  return (
    <div className="annotated-code">
      <div className={`annotated-focus ${explains.length === 0 || !activeText ? "muted" : ""}`}>
        {explains.length === 0 || !activeText
          ? "这段还没有讲解，可以先自己看代码。"
          : activeText}
      </div>

      <div className="annotated-code-scroll">
        {blocks.map((block) => {
          if (block.kind === "plain") {
            const text = lines[block.line - 1] ?? "";
            return (
              <div key={`p-${block.line}`} className="annotated-line">
                <span className="annotated-lineno">{block.line}</span>
                <code className="annotated-src">{text || " "}</code>
              </div>
            );
          }

          const key = groupKey(block.start, block.end);
          const isActive = activeKey === key;
          const lineEls = [];
          for (let lineNo = block.start; lineNo <= block.end; lineNo++) {
            const text = lines[lineNo - 1] ?? "";
            lineEls.push(
              <div
                key={`g-${lineNo}`}
                className={[
                  "annotated-line",
                  "has-explain",
                  isActive ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveKey(key)}
              >
                <span className="annotated-lineno">{lineNo}</span>
                <code className="annotated-src">{text || " "}</code>
              </div>,
            );
          }

          return (
            <div key={key} className="annotated-group">
              <button
                type="button"
                className={`annotated-note-card ${isActive ? "active" : ""}`}
                onClick={() => setActiveKey(key)}
              >
                {block.text}
              </button>
              {lineEls}
            </div>
          );
        })}
      </div>
    </div>
  );
}
