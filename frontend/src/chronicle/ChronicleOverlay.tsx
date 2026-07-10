/**
 * PRIVATE chronicle — 全屏人物故事 Overlay。
 * 与 AI 课程 / 源码导读无关；勿从 guide/ 引用本模块。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CHRONICLE_FLOW } from "./flows";
import ChronicleNode, { type ChronicleNodeData } from "./ChronicleNode";
import ChronicleGroupNode, { type ChronicleGroupData } from "./ChronicleGroupNode";
import "./ChronicleOverlay.css";

const nodeTypes = {
  chronicle: ChronicleNode,
  chronicleGroup: ChronicleGroupNode,
};

function StoryImage({ src }: { src: string }) {
  const [ok, setOk] = useState(true);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (!ok) return null;
  return (
    <>
      <button
        type="button"
        className="chronicle-story-image-btn"
        onClick={() => setLightbox(true)}
        aria-label="查看原图"
      >
        <img
          className="chronicle-story-image"
          src={src}
          alt=""
          onError={() => setOk(false)}
        />
      </button>
      {lightbox && (
        <div
          className="chronicle-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="原图预览"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="chronicle-lightbox-close"
            onClick={() => setLightbox(false)}
          >
            关闭
          </button>
          <img
            className="chronicle-lightbox-image"
            src={src}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function FlowCanvas({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { setCenter, getNode, fitView } = useReactFlow();
  const flow = CHRONICLE_FLOW;

  const focusNode = useCallback(
    (nodeId: string) => {
      const n = getNode(nodeId);
      if (!n) return;
      let x = n.position.x;
      let y = n.position.y;
      if (n.parentId) {
        const parent = getNode(n.parentId);
        if (parent) {
          x += parent.position.x;
          y += parent.position.y;
        }
      }
      setCenter(x + 75, y + 40, { zoom: 0.9, duration: 320 });
    },
    [getNode, setCenter],
  );

  const initialNodes: Node[] = useMemo(() => {
    const asSource = new Set(flow.edges.map((e) => e.source));
    const asTarget = new Set(flow.edges.map((e) => e.target));

    const groupNodes: Node[] = flow.groups.map((g) => ({
      id: g.id,
      type: "chronicleGroup",
      position: g.position,
      data: { title: g.title } satisfies ChronicleGroupData,
      style: { width: g.width, height: g.height },
      selectable: false,
      draggable: false,
      connectable: false,
    }));

    const personNodes: Node[] = flow.nodes.map((n) => ({
      id: n.id,
      type: "chronicle",
      position: n.position,
      parentId: n.parentId,
      extent: n.parentId ? ("parent" as const) : undefined,
      data: {
        label: n.label,
        subtitle: n.subtitle,
        image: n.image,
        showTarget: asTarget.has(n.id),
        showSource: asSource.has(n.id),
      } satisfies ChronicleNodeData,
      draggable: false,
    }));

    return [...groupNodes, ...personNodes];
  }, [flow.groups, flow.nodes, flow.edges]);

  const initialEdges: Edge[] = useMemo(
    () =>
      flow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
        style: { stroke: "var(--accent)", strokeWidth: 1.5 },
        labelStyle: { fill: "var(--text-dim)", fontSize: 11, fontWeight: 600 },
        labelBgStyle: { fill: "var(--bg)", fillOpacity: 0.92 },
        labelBgPadding: [5, 3] as [number, number],
        labelBgBorderRadius: 4,
        pathOptions: { offset: 12 },
      })),
    [flow.edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

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
    const t = window.setTimeout(() => {
      fitView({ padding: 0.12, duration: 280, maxZoom: 0.95 });
    }, 80);
    return () => window.clearTimeout(t);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => {
        if (node.type === "chronicleGroup") return;
        onSelect(node.id);
        focusNode(node.id);
      }}
      minZoom={0.2}
      maxZoom={1.8}
      defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={20} color="var(--border)" />
      <Controls showFitView />
    </ReactFlow>
  );
}

type Props = {
  onClose: () => void;
};

export default function ChronicleOverlay({ onClose }: Props) {
  const flow = CHRONICLE_FLOW;
  const [selectedId, setSelectedId] = useState<string | null>(flow.nodes[0]?.id ?? null);
  const selected = flow.nodes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="chronicle-overlay" role="dialog" aria-modal="true" aria-label={flow.title}>
      <header className="chronicle-topbar">
        <div className="chronicle-title">{flow.title}</div>
        <button type="button" className="chronicle-close" onClick={onClose}>
          关闭
        </button>
      </header>

      <div className="chronicle-body">
        <div className="chronicle-canvas">
          <ReactFlowProvider>
            <FlowCanvas selectedId={selectedId} onSelect={setSelectedId} />
          </ReactFlowProvider>
        </div>

        <section className="chronicle-story-panel">
          {selected ? (
            <>
              <div className="chronicle-story-header">
                <div className="chronicle-story-name">{selected.label}</div>
                {selected.subtitle && (
                  <div className="chronicle-story-sub">{selected.subtitle}</div>
                )}
              </div>
              {selected.image && <StoryImage src={selected.image} />}
              <div className="chronicle-story-body">{selected.story}</div>
            </>
          ) : (
            <p className="chronicle-story-empty">选择一个节点查看故事</p>
          )}
        </section>
      </div>
    </div>
  );
}
