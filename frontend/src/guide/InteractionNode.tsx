import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export type InteractionNodeData = {
  label: string;
  blurb?: string;
  step?: number;
  selected?: boolean;
  relatedCodeId?: string;
  relatedCodeLabel?: string;
  onJump?: (nodeId: string) => void;
};

function InteractionNode({ data, selected }: NodeProps) {
  const d = data as InteractionNodeData;
  return (
    <div className={`interaction-node ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="target" position={Position.Top} id="in-top" />
      <Handle type="target" position={Position.Bottom} id="in-bottom" />
      <div className="interaction-node-badge">用户操作</div>
      {d.step != null && <div className="interaction-node-step">步骤 {d.step}</div>}
      <div className="interaction-node-label">{d.label}</div>
      {d.blurb && (
        <div className="interaction-node-note" title={d.blurb}>
          {d.blurb}
        </div>
      )}
      {d.relatedCodeId && d.relatedCodeLabel && (
        <button
          type="button"
          className="interaction-jump-btn"
          onClick={(e) => {
            e.stopPropagation();
            d.onJump?.(d.relatedCodeId!);
          }}
        >
          对应代码 → {d.relatedCodeLabel}
        </button>
      )}
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="source" position={Position.Top} id="out-top" />
      <Handle type="source" position={Position.Bottom} id="out-bottom" />
    </div>
  );
}

export default memo(InteractionNode);
