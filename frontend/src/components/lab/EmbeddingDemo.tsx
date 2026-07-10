import { useState, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { api, type EmbedItem } from "../../api/client";
import { pca3 } from "../../utils/pca";
import { LAB_SAMPLE_LIMITS, takeLines } from "../../utils/labSample";
import "./EmbeddingDemo.css";

interface Point {
  text: string;
  pos: [number, number, number];
}

const DEFAULT_WORDS = "北京\n上海\n广州\n苹果\n香蕉\n西瓜\n手机\n电脑\n汽车";

function readCssColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

function makeLabelSprite(text: string, pos: [number, number, number]): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const bg = readCssColor("--bg-elevated", "#f8fafc");
  const fg = readCssColor("--text", "#0f172a");
  const border = readCssColor("--border", "#e2e8f0");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const label = text.length > 12 ? `${text.slice(0, 12)}…` : text;
  ctx.font = "600 26px sans-serif";
  const width = Math.min(240, Math.max(48, ctx.measureText(label).width + 28));
  const x = (256 - width) / 2;
  const y = 14;
  const h = 36;
  const r = 10;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + h, r);
  ctx.arcTo(x + width, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(pos[0], pos[1] + 0.35, pos[2]);
  sprite.scale.set(1.4, 0.35, 1);
  sprite.userData.labelText = text;
  sprite.userData.labelPos = pos;
  return sprite;
}

export default function EmbeddingDemo({ sampleText }: { sampleText?: string }) {
  const rawInput = sampleText ?? DEFAULT_WORDS;
  const lineSlice = useMemo(
    () =>
      takeLines(
        rawInput,
        LAB_SAMPLE_LIMITS.embeddingLines,
        LAB_SAMPLE_LIMITS.embeddingLineChars,
      ),
    [rawInput],
  );
  const input = lineSlice.text;
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const labelsRef = useRef<THREE.Group | null>(null);
  const pointsDataRef = useRef<Point[]>([]);
  const rebuildLabelsRef = useRef<(() => void) | null>(null);

  const compute = async () => {
    const texts = input.split("\n").map((t) => t.trim()).filter(Boolean);
    if (texts.length < 2) {
      setError("至少输入 2 个词/句子");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.embedVectors(texts);
      const coords = pca3(res.items.map((it: EmbedItem) => it.vector));
      const pts = texts.map((text, i) => ({
        text,
        pos: coords[i] || [0, 0, 0],
      })) as Point[];
      setPoints(pts);
    } catch (e) {
      setError(`出错了：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pointsDataRef.current = points;
  }, [points]);

  // 初始化 Three.js 场景
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(readCssColor("--bg", "#ffffff"));

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uHoverIdx: { value: -1.0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aIdx;
        uniform float uHoverIdx;
        varying float vGlow;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPos;
          float isHover = step(abs(aIdx - uHoverIdx), 0.5);
          gl_PointSize = aSize * (1.0 + isHover * 0.55) * (280.0 / -mvPos.z);
          vGlow = isHover;
        }
      `,
      fragmentShader: `
        varying float vGlow;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;

          // 实心圆 + 轻微边缘，正常混合（浅/暗都清晰，无叠加光斑）
          float alpha = 1.0 - smoothstep(0.42, 0.5, d);
          vec3 base = vec3(0.05, 0.65, 0.91);
          vec3 hover = vec3(0.02, 0.52, 0.78);
          vec3 fill = mix(base, hover, vGlow);
          float rim = smoothstep(0.32, 0.48, d);
          fill = mix(fill, fill * 0.72, rim);

          gl_FragColor = vec4(fill, alpha);
        }
      `,
      transparent: true,
      depthWrite: true,
      blending: THREE.NormalBlending,
    });

    const pts = new THREE.Points(geometry, material);
    scene.add(pts);
    pointsRef.current = pts;

    const labelGroup = new THREE.Group();
    scene.add(labelGroup);
    labelsRef.current = labelGroup;

    const rebuildLabels = () => {
      if (!labelsRef.current) return;
      while (labelsRef.current.children.length > 0) {
        const child = labelsRef.current.children[0] as THREE.Sprite;
        child.material.map?.dispose();
        child.material.dispose();
        labelsRef.current.remove(child);
      }
      for (const p of pointsDataRef.current) {
        labelsRef.current.add(makeLabelSprite(p.text, p.pos));
      }
    };
    rebuildLabelsRef.current = rebuildLabels;

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let radius = 8;
    let theta = Math.PI / 4;
    let phi = Math.PI / 3;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const onDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => {
      isDragging = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      theta -= dx * 0.01;
      phi -= dy * 0.01;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
      prevX = e.clientX;
      prevY = e.clientY;
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius += e.deltaY * 0.01;
      radius = Math.max(3, Math.min(30, radius));
      updateCamera();
    };
    const onClick = (e: MouseEvent) => {
      const data = pointsDataRef.current;
      if (data.length === 0 || !pointsRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      raycaster.params.Points = { threshold: 0.35 };
      const hits = raycaster.intersectObject(pointsRef.current);
      if (hits.length > 0) {
        const idx = hits[0].index;
        if (idx !== undefined && idx < data.length) {
          setHovered(data[idx].text);
          material.uniforms.uHoverIdx.value = idx;
          return;
        }
      }
      setHovered(null);
      material.uniforms.uHoverIdx.value = -1;
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    const syncTheme = () => {
      scene.background = new THREE.Color(readCssColor("--bg", "#ffffff"));
      rebuildLabels();
    };
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      rebuildLabelsRef.current = null;
      themeObserver.disconnect();
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // 更新散点与标签
  useEffect(() => {
    if (!pointsRef.current || !labelsRef.current || points.length === 0) return;

    const positions = new Float32Array(points.length * 3);
    const sizes = new Float32Array(points.length);
    const indices = new Float32Array(points.length);

    points.forEach((p, i) => {
      positions[i * 3] = p.pos[0];
      positions[i * 3 + 1] = p.pos[1];
      positions[i * 3 + 2] = p.pos[2];
      sizes[i] = 26;
      indices[i] = i;
    });

    const geometry = pointsRef.current.geometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aIdx", new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();

    rebuildLabelsRef.current?.();
  }, [points]);

  return (
    <div className="embedding-demo">
      <div className="demo-section">
        <p className="demo-sample-hint">
          词表来自右侧共用「示例文本」（建议每行一个词）
          {lineSlice.truncated
            ? `。性能优化：最多 ${LAB_SAMPLE_LIMITS.embeddingLines} 行、每行 ${LAB_SAMPLE_LIMITS.embeddingLineChars} 字（当前用 ${lineSlice.lineCount} 行）`
            : "。改右侧后点下方按钮重新生成。"}
        </p>
        <button type="button" className="demo-btn" onClick={compute} disabled={loading || !input.trim()}>
          {loading ? "计算中..." : "生成 3D 向量空间"}
        </button>
        {error && <div className="demo-error">{error}</div>}
      </div>

      <div className="embedding-canvas-wrap">
        <div ref={mountRef} className="embedding-canvas" />
        {hovered && (
          <div className="hover-tooltip">{hovered}</div>
        )}
      </div>

      <div className="embedding-hint">
        拖拽旋转 · 滚轮缩放 · 点击散点高亮 · 语义相近的词在 3D 空间中更靠近
      </div>
    </div>
  );
}
