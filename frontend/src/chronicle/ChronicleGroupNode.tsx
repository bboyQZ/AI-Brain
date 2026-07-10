/**
 * PRIVATE chronicle — 部门分组框。
 */
import { memo } from "react";
import type { NodeProps } from "@xyflow/react";

export type ChronicleGroupData = {
  title: string;
};

function ChronicleGroupNode({ data }: NodeProps) {
  const d = data as ChronicleGroupData;
  return (
    <div className="chronicle-group">
      <div className="chronicle-group-title">{d.title}</div>
    </div>
  );
}

export default memo(ChronicleGroupNode);
