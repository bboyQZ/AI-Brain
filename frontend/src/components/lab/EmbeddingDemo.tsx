import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { api, type EmbedItem } from "../../api/client";
import { pca3 } from "../../utils/pca";
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

export default function EmbeddingDemo() {
  const [input, setInput] = useState(DEFAULT_WORDS);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const labelsRef = useRef<THREE.Group | null>(null);

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

  // 初始化 Three.js 场景
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(readCssColor("--bg", "#ffffff"));

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // 发光的散点着色器
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHoverIdx: { value: -1.0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aIdx;
        uniform float uTime;
        uniform float uHoverIdx;
        varying float vAlpha;
        varying float vGlow;
        void main() {
          vec3 pos = position;
          float pulse = sin(uTime * 2.0 + aIdx * 0.5) * 0.05;
          pos *= 1.0 + pulse;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;
          float isHover = step(abs(aIdx - uHoverIdx), 0.5);
          gl_PointSize = aSize * (1.0 + isHover * 1.5) * (300.0 / -mvPos.z);
          vAlpha = 0.7 + isHover * 0.3;
          vGlow = isHover;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vGlow;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.2, d);
          float halo = 1.0 - smoothstep(0.2, 0.5, d);
          vec3 color = mix(vec3(0.05, 0.65, 0.91), vec3(0.22, 0.74, 0.97), vGlow);
          float alpha = (core + halo * 0.3) * vAlpha;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pts = new THREE.Points(geometry, material);
    scene.add(pts);
    pointsRef.current = pts;

    const labelGroup = new THREE.Group();
    scene.add(labelGroup);
    labelsRef.current = labelGroup;

    // 光照（用于 sprite 标签）
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // 轨道控制（手动实现，避免额外依赖）
    let isDragging = false;
    let prevX = 0, prevY = 0;
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

    const onDown = (e: MouseEvent) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; };
    const onUp = () => { isDragging = false; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      theta -= dx * 0.01;
      phi -= dy * 0.01;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
      prevX = e.clientX; prevY = e.clientY;
      updateCamera();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius += e.deltaY * 0.01;
      radius = Math.max(3, Math.min(30, radius));
      updateCamera();
    };
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      raycaster.params.Points = { threshold: 0.3 };
      if (pointsRef.current) {
        const hits = raycaster.intersectObject(pointsRef.current);
        if (hits.length > 0) {
          const idx = hits[0].index;
          if (idx !== undefined && idx < points.length) {
            setHovered(points[idx].text);
            (material.uniforms.uHoverIdx.value as number) = idx;
          }
        } else {
          setHovered(null);
          (material.uniforms.uHoverIdx.value as number) = -1;
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      (material.uniforms.uTime.value as number) = performance.now() * 0.001;
      if (labelsRef.current) {
        labelsRef.current.children.forEach((child) => {
          const sprite = child as THREE.Sprite;
          sprite.lookAt(camera.position);
        });
      }
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

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    const syncBackground = () => {
      scene.background = new THREE.Color(readCssColor("--bg", "#ffffff"));
    };
    const themeObserver = new MutationObserver(syncBackground);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      themeObserver.disconnect();
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // 更新散点数据
  useEffect(() => {
    if (!pointsRef.current || !labelsRef.current || points.length === 0) return;

    const positions = new Float32Array(points.length * 3);
    const sizes = new Float32Array(points.length);
    const indices = new Float32Array(points.length);

    points.forEach((p, i) => {
      positions[i * 3] = p.pos[0];
      positions[i * 3 + 1] = p.pos[1];
      positions[i * 3 + 2] = p.pos[2];
      sizes[i] = 30;
      indices[i] = i;
    });

    const geometry = pointsRef.current.geometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aIdx", new THREE.BufferAttribute(indices, 1));

    // 清除旧标签
    while (labelsRef.current.children.length > 0) {
      labelsRef.current.remove(labelsRef.current.children[0]);
    }

    // 添加文字标签
    points.forEach((p) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;
      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = readCssColor("--text", "#0f172a");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(p.pos[0], p.pos[1] + 0.3, p.pos[2]);
      sprite.scale.set(1.5, 0.4, 1);
      labelsRef.current!.add(sprite);
    });
  }, [points]);

  return (
    <div className="embedding-demo">
      <div className="demo-section">
        <label className="demo-label">输入词/句子（每行一个，至少 2 个）</label>
        <textarea
          className="demo-input embedding-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
        />
        <button className="demo-btn" onClick={compute} disabled={loading}>
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
