/**
 * PRIVATE chronicle — 人物节点。非 guide/MethodNode。
 */
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type ChronicleNodeData = {
  label: string;
  subtitle?: string;
  image?: string;
  selected?: boolean;
  isProtagonist?: boolean;
  showTarget?: boolean;
  showSource?: boolean;
  targetPosition?: Position;
  sourcePosition?: Position;
};

function ChronicleNode({ data, selected }: NodeProps) {
  const d = data as ChronicleNodeData;
  const [imgOk, setImgOk] = useState(Boolean(d.image));
  const targetPos = d.targetPosition ?? Position.Top;
  const sourcePos = d.sourcePosition ?? Position.Bottom;

  return (
    <div
      className={`chronicle-node ${d.isProtagonist ? "chronicle-node--protagonist" : ""} ${selected || d.selected ? "selected" : ""}`}
    >
      {d.showTarget && (
        <Handle type="target" position={targetPos} id="in" />
      )}
      {d.image && imgOk && (
        <img
          className="chronicle-node-avatar"
          src={d.image}
          alt=""
          draggable={false}
          onError={() => setImgOk(false)}
        />
      )}
      <div className="chronicle-node-text">
        <div className="chronicle-node-label">{d.label}</div>
        {d.subtitle && <div className="chronicle-node-sub">{d.subtitle}</div>}
      </div>
      {d.showSource && (
        <Handle type="source" position={sourcePos} id="out" />
      )}
    </div>
  );
}

export default memo(ChronicleNode);
