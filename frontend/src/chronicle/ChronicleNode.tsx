/**
 * PRIVATE chronicle — 人物节点。非 guide/MethodNode。
 * 仅有职位连线的节点显示连接点。
 */
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type ChronicleNodeData = {
  label: string;
  subtitle?: string;
  image?: string;
  selected?: boolean;
  /** 是否显示上方入边连接点 */
  showTarget?: boolean;
  /** 是否显示下方出边连接点 */
  showSource?: boolean;
};

function ChronicleNode({ data, selected }: NodeProps) {
  const d = data as ChronicleNodeData;
  const [imgOk, setImgOk] = useState(Boolean(d.image));

  return (
    <div className={`chronicle-node ${selected || d.selected ? "selected" : ""}`}>
      {d.showTarget && <Handle type="target" position={Position.Top} id="in" />}
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
      {d.showSource && <Handle type="source" position={Position.Bottom} id="out" />}
    </div>
  );
}

export default memo(ChronicleNode);
