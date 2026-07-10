import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { api, type GuideSource } from "../api/client";
import { GUIDE_FLOWS } from "../guide/flows";
import { explainsFor } from "../guide/explains";
import AnnotatedCode from "../guide/AnnotatedCode";
import MethodNode, { type MethodNodeData } from "../guide/MethodNode";
import "./GuidePage.css";

const nodeTypes = { method: MethodNode };
/** 疏朗布局；默认对准当前方块，需要整图时用左下角「适应」 */
const POS_SCALE_X = 1.85;
const POS_SCALE_Y = 2.05;

function FlowCanvas({
  flowId,
  selectedId,
  onSelect,
}: {
  flowId: string;
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
}) {
  const flow = GUIDE_FLOWS.find((f) => f.id === flowId)!;
  const { setCenter, getNode } = useReactFlow();

  const jumpMap = useMemo(() => {
    const map: Record<string, { id: string; label: string }[]> = {};
    for (const e of flow.edges) {
      if (!e.jump) continue;
      const target = flow.nodes.find((n) => n.id === e.target);
      if (!target) continue;
      (map[e.source] ||= []).push({ id: e.target, label: target.label });
    }
    return map;
  }, [flow]);

  const focusNode = useCallback(
    (nodeId: string, zoom = 1) => {
      const n = getNode(nodeId);
      if (n) {
        setCenter(n.position.x + 120, n.position.y + 70, { zoom, duration: 350 });
        return;
      }
      const def = flow.nodes.find((x) => x.id === nodeId);
      if (!def) return;
      setCenter(def.position.x * POS_SCALE_X + 120, def.position.y * POS_SCALE_Y + 70, {
        zoom,
        duration: 350,
      });
    },
    [flow.nodes, getNode, setCenter],
  );

  const onJump = useCallback(
    (nodeId: string) => {
      onSelect(nodeId);
      focusNode(nodeId, 1);
    },
    [focusNode, onSelect],
  );

  const initialNodes: Node[] = useMemo(
    () =>
      flow.nodes.map((n) => {
        const ex = explainsFor(n.id);
        return {
          id: n.id,
          type: "method",
          position: {
            x: n.position.x * POS_SCALE_X,
            y: n.position.y * POS_SCALE_Y,
          },
          data: {
            label: n.label,
            file: n.file,
            symbol: n.symbol,
            blurb: ex.blurb || n.note,
            jumpTargets: jumpMap[n.id] || [],
            onJump,
          } satisfies MethodNodeData,
        };
      }),
    [flow, jumpMap, onJump],
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      flow.edges
        .filter((e) => !e.jump)
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? "out",
          targetHandle: e.targetHandle ?? "in",
          label: e.label,
          type: "smoothstep",
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          style: { stroke: "var(--accent)", strokeWidth: 2.25 },
          labelStyle: { fill: "var(--text)", fontSize: 12, fontWeight: 600 },
          labelBgStyle: { fill: "var(--bg)", fillOpacity: 0.92 },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 6,
        })),
    [flow],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedId },
        selected: n.id === selectedId,
      })),
    );
  }, [selectedId, setNodes]);

  useEffect(() => {
    const firstId = flow.nodes[0]?.id;
    if (!firstId) return;
    const t = window.setTimeout(() => focusNode(firstId, 1), 60);
    return () => window.clearTimeout(t);
  }, [flowId, flow.nodes, focusNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => {
        onSelect(node.id);
        focusNode(node.id, 1);
      }}
      minZoom={0.25}
      maxZoom={1.8}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} color="var(--border)" />
      <Controls showFitView />
    </ReactFlow>
  );
}

export default function GuidePage() {
  const [flowId, setFlowId] = useState(GUIDE_FLOWS[0].id);
  const flow = GUIDE_FLOWS.find((f) => f.id === flowId)!;
  const [selectedId, setSelectedId] = useState<string | null>(flow.nodes[0]?.id ?? null);
  const [source, setSource] = useState<GuideSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedNode = flow.nodes.find((n) => n.id === selectedId) ?? null;
  const selectedExplain = selectedId ? explainsFor(selectedId) : { blurb: "", lines: [] };

  useEffect(() => {
    setSelectedId(flow.nodes[0]?.id ?? null);
  }, [flowId, flow.nodes]);

  useEffect(() => {
    if (!selectedNode) {
      setSource(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getGuideSource(selectedNode.file, selectedNode.symbol)
      .then((res) => {
        if (!cancelled) setSource(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setSource(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedNode]);

  return (
    <div className="guide-page">
      <aside className="guide-sidebar">
        <div className="guide-sidebar-title">源码导读</div>
        <p className="guide-sidebar-hint">点方块对准视角 · 右栏看源码讲解 · 左下可适应整图</p>
        <nav className="guide-nav">
          {GUIDE_FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`guide-nav-item ${f.id === flowId ? "active" : ""}`}
              onClick={() => setFlowId(f.id)}
            >
              {f.title}
            </button>
          ))}
        </nav>
        <p className="guide-flow-summary">{flow.summary}</p>
      </aside>

      <div className="guide-workspace">
        <div className="guide-canvas">
          <ReactFlowProvider>
            <FlowCanvas
              key={flowId}
              flowId={flowId}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </ReactFlowProvider>
        </div>

        <section className="guide-code-panel">
          <div className="guide-code-header">
            <div>
              <div className="guide-code-title">
                {selectedNode?.label || "选择一个方法方块"}
              </div>
              {selectedNode && (
                <div className="guide-code-path">
                  {selectedNode.file}
                  {selectedNode.symbol ? ` · ${selectedNode.symbol}` : ""}
                </div>
              )}
            </div>
          </div>
          {selectedExplain.blurb && (
            <p className="guide-code-note">{selectedExplain.blurb}</p>
          )}
          {selectedNode?.note && selectedNode.note !== selectedExplain.blurb && (
            <p className="guide-code-note subtle">{selectedNode.note}</p>
          )}
          {loading && <p className="guide-code-status">加载源码中…</p>}
          {error && <p className="guide-code-error">{error}</p>}
          {!loading && source && (
            <AnnotatedCode code={source.code} explains={selectedExplain.lines} />
          )}
        </section>
      </div>
    </div>
  );
}
