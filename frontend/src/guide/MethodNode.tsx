import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type MethodNodeData = {
  label: string;
  file: string;
  symbol?: string;
  /** 方块上的一句话说明 */
  blurb?: string;
  selected?: boolean;
  jumpTargets?: { id: string; label: string }[];
  onJump?: (nodeId: string) => void;
};

function MethodNode({ data, selected }: NodeProps) {
  const d = data as MethodNodeData;
  const fileShort = d.file.includes("/") ? d.file.split("/").slice(-2).join("/") : d.file;
  return (
    <div className={`method-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="target" position={Position.Top} id="in-top" />
      <Handle type="target" position={Position.Bottom} id="in-bottom" />
      <div className="method-node-label">{d.label}</div>
      <div className="method-node-file" title={d.file}>
        {fileShort}
      </div>
      {d.symbol && <div className="method-node-symbol">{d.symbol}</div>}
      {d.blurb && (
        <div className="method-node-note" title={d.blurb}>
          {d.blurb}
        </div>
      )}
      {d.jumpTargets && d.jumpTargets.length > 0 && (
        <div className="method-node-jumps">
          {d.jumpTargets.map((j) => (
            <button
              key={j.id}
              type="button"
              className="method-jump-btn"
              onClick={(e) => {
                e.stopPropagation();
                d.onJump?.(j.id);
              }}
            >
              跳转 → {j.label}
            </button>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="source" position={Position.Top} id="out-top" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" />
    </div>
  );
}

export default memo(MethodNode);
