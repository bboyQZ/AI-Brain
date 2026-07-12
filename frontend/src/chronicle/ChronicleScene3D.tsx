/**
 * PRIVATE chronicle — 恋爱线 3D 关系星图。
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ChronicleFlow } from "./flows";
import {
  DEPT_GLOW,
  PROTAGONIST_GLOW,
  layoutRomance3D,
} from "./romanceLayout3d";
import { romanceEdgeStroke } from "./romanceEdges";
import {
  curveBetween,
  disposeSprite,
  hexToThree,
  linkEndpoints,
  makeAvatarTexture,
  makeNameSprite,
} from "./chronicleSceneVisuals";

/** 连线落在光晕外缘（世界单位），与 sprite 缩放大致匹配 */
const STAR_LINK_INSET = {
  protagonist: 1.55,
  employee: 1.0,
} as const;

type SceneFlow = Pick<ChronicleFlow, "nodes" | "edges" | "protagonistId">;

type Props = {
  flow: SceneFlow;
  selectedId: string;
  onSelect: (id: string) => void;
};

type NodeObj = {
  id: string;
  group: THREE.Group;
  avatar: THREE.Sprite;
  name: THREE.Sprite;
  halo: THREE.Sprite;
  isProtagonist: boolean;
  accent: string;
  label: string;
  subtitle: string;
};

export default function ChronicleScene3D({ flow, selectedId, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const cameraControlRef = useRef<{ focusOn: (id: string) => void } | null>(
    null,
  );

  useEffect(() => {
    selectedRef.current = selectedId;
    cameraControlRef.current?.focusOn(selectedId);
  }, [selectedId]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const layout = layoutRomance3D(flow.nodes, flow.protagonistId, 10.5);
    const layoutMap = new Map(layout.map((l) => [l.id, l]));
    const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060814);

    const camera = new THREE.PerspectiveCamera(
      48,
      mount.clientWidth / mount.clientHeight,
      0.1,
      220,
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x9eb4ff, 0.28);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffe7ba, 0.55);
    keyLight.position.set(4, 8, 6);
    scene.add(keyLight);

    const coreLight = new THREE.PointLight(0xffd27a, 3.2, 42);
    coreLight.position.set(0, 0.2, 0);
    scene.add(coreLight);

    const rimLight = new THREE.PointLight(0x7c5cff, 0.9, 50);
    rimLight.position.set(-8, -2, -6);
    scene.add(rimLight);

    const nodeObjs: NodeObj[] = [];
    const pickMeshes: THREE.Mesh[] = [];

    for (const item of layout) {
      const def = nodeMap.get(item.id)!;
      const isProtagonist = item.isProtagonist;
      const accent = isProtagonist
        ? PROTAGONIST_GLOW
        : DEPT_GLOW[item.parentId ?? "other"] ?? DEPT_GLOW.other;
      const group = new THREE.Group();
      group.position.set(...item.position);

      const avatarTex = makeAvatarTexture(def.label, accent, isProtagonist);
      const avatarMat = new THREE.SpriteMaterial({
        map: avatarTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const avatar = new THREE.Sprite(avatarMat);
      const avatarScale = isProtagonist ? 2.1 : 1.45;
      avatar.scale.set(avatarScale, avatarScale, 1);
      avatar.renderOrder = 6;
      group.add(avatar);

      const haloCanvas = document.createElement("canvas");
      haloCanvas.width = 128;
      haloCanvas.height = 128;
      const hctx = haloCanvas.getContext("2d")!;
      const grad = hctx.createRadialGradient(64, 64, 8, 64, 64, 64);
      grad.addColorStop(0, `${accent}66`);
      grad.addColorStop(0.45, `${accent}22`);
      grad.addColorStop(1, "transparent");
      hctx.fillStyle = grad;
      hctx.fillRect(0, 0, 128, 128);
      const haloTex = new THREE.CanvasTexture(haloCanvas);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.scale.set(isProtagonist ? 3.6 : 2.4, isProtagonist ? 3.6 : 2.4, 1);
      halo.renderOrder = 4;
      group.add(halo);

      const name = makeNameSprite(
        def.label,
        def.subtitle ?? "",
        accent,
        false,
      );
      name.position.set(0, isProtagonist ? -1.55 : -1.15, 0);
      group.add(name);

      const pick = new THREE.Mesh(
        new THREE.SphereGeometry(isProtagonist ? 1.2 : 0.85, 10, 10),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      pick.userData.id = item.id;
      group.add(pick);
      pickMeshes.push(pick);

      scene.add(group);
      nodeObjs.push({
        id: item.id,
        group,
        avatar,
        name,
        halo,
        isProtagonist,
        accent,
        label: def.label,
        subtitle: def.subtitle ?? "",
      });
    }

    const dustCount = 680;
    const dustPos = new Float32Array(dustCount * 3);
    const dustSize = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      const r = 18 + Math.random() * 42;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      dustPos[i * 3 + 2] = r * Math.cos(phi);
      dustSize[i] = 0.03 + Math.random() * 0.1;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute("size", new THREE.BufferAttribute(dustSize, 1));
    const dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color("#c4d4ff") } },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = size * (220.0 / -mv.z);
          vAlpha = smoothstep(55.0, 8.0, -mv.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = (1.0 - smoothstep(0.15, 0.5, d)) * vAlpha;
          gl_FragColor = vec4(uColor, a * 0.75);
        }
      `,
    });
    scene.add(new THREE.Points(dustGeo, dustMat));

    let beamGroup: THREE.Group | null = null;
    let beamPulse = 0;

    const disposeBeam = () => {
      if (!beamGroup) return;
      scene.remove(beamGroup);
      beamGroup.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      });
      beamGroup = null;
    };

    const nodeAnchor = (obj: NodeObj) => {
      const v = new THREE.Vector3();
      obj.group.getWorldPosition(v);
      return v;
    };

    const rebuildBeam = (focusId: string) => {
      disposeBeam();
      beamPulse = 0;

      const bossObj = nodeObjs.find((o) => o.isProtagonist);
      if (!bossObj) return;
      const bossPos = nodeAnchor(bossObj);

      if (focusId === flow.protagonistId) {
        const segments: number[] = [];
        for (const obj of nodeObjs) {
          if (obj.isProtagonist) continue;
          const empPos = nodeAnchor(obj);
          const [a, b] = linkEndpoints(
            bossPos,
            empPos,
            STAR_LINK_INSET.protagonist,
            STAR_LINK_INSET.employee,
          );
          segments.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
        if (segments.length === 0) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array(segments), 3),
        );
        const allLines = new THREE.LineSegments(
          geo,
          new THREE.LineBasicMaterial({
            color: 0xf5c842,
            transparent: true,
            opacity: 0.28,
            depthTest: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        beamGroup = new THREE.Group();
        beamGroup.add(allLines);
        scene.add(beamGroup);
        return;
      }

      const targetObj = nodeObjs.find((o) => o.id === focusId);
      if (!targetObj) return;

      const employee = nodeMap.get(focusId);
      const strokeRaw = romanceEdgeStroke(employee?.romance?.kind);
      const strokeHex = strokeRaw.startsWith("#")
        ? strokeRaw
        : targetObj.accent ?? PROTAGONIST_GLOW;
      const strokeColor = hexToThree(strokeHex);
      const [start, end] = linkEndpoints(
        bossPos,
        nodeAnchor(targetObj),
        STAR_LINK_INSET.protagonist,
        STAR_LINK_INSET.employee,
      );
      const curve = curveBetween(start, end);

      const outerGeo = new THREE.TubeGeometry(curve, 72, 0.11, 10, false);
      const outerMat = new THREE.MeshBasicMaterial({
        color: strokeColor,
        transparent: true,
        opacity: 0.16,
        depthTest: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const innerGeo = new THREE.TubeGeometry(curve, 72, 0.028, 8, false);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0xfff1d6,
        transparent: true,
        opacity: 0.92,
        depthTest: true,
        depthWrite: false,
      });

      beamGroup = new THREE.Group();
      beamGroup.add(new THREE.Mesh(outerGeo, outerMat));
      beamGroup.add(new THREE.Mesh(innerGeo, innerMat));
      scene.add(beamGroup);
    };

    const refreshNameSprite = (obj: NodeObj, active: boolean) => {
      disposeSprite(obj.name);
      const next = makeNameSprite(obj.label, obj.subtitle, obj.accent, active);
      next.position.copy(obj.name.position);
      obj.group.remove(obj.name);
      obj.group.add(next);
      obj.name = next;
    };

    let lastBeamFocus = "";

    const updateFocus = (focusId: string) => {
      const isBoss = focusId === flow.protagonistId;
      for (const obj of nodeObjs) {
        const isRelated = obj.isProtagonist || obj.id === focusId;
        const isActive = obj.id === focusId;

        let targetOpacity: number;
        let targetScale: number;
        let haloOpacity: number;
        let nameOpacity: number;

        if (isBoss) {
          obj.group.visible = true;
          if (obj.isProtagonist) {
            targetOpacity = 1;
            targetScale = 1;
            haloOpacity = 0.85;
            nameOpacity = 1;
          } else {
            targetOpacity = 0.88;
            targetScale = 0.94;
            haloOpacity = 0.42;
            nameOpacity = 0.88;
          }
        } else {
          const visible = isRelated;
          targetOpacity = visible ? 1 : 0;
          targetScale = visible ? (isActive ? 1.12 : 1) : 0.001;
          haloOpacity = visible ? (obj.isProtagonist ? 0.9 : 0.65) : 0;
          nameOpacity = visible ? 1 : 0;
          const avMat = obj.avatar.material as THREE.SpriteMaterial;
          obj.group.visible = visible || avMat.opacity > 0.03;
        }

        const avMat = obj.avatar.material as THREE.SpriteMaterial;
        avMat.opacity = THREE.MathUtils.lerp(avMat.opacity, targetOpacity, 0.14);
        obj.group.scale.setScalar(
          THREE.MathUtils.lerp(obj.group.scale.x, targetScale, 0.1),
        );

        const haloMat = obj.halo.material as THREE.SpriteMaterial;
        haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, haloOpacity, 0.12);

        const nameMat = obj.name.material as THREE.SpriteMaterial;
        nameMat.opacity = THREE.MathUtils.lerp(nameMat.opacity, nameOpacity, 0.14);

        if (isActive !== obj.name.userData.active) {
          refreshNameSprite(obj, isActive);
          obj.name.userData.active = isActive;
        }
      }
      if (focusId !== lastBeamFocus) {
        rebuildBeam(focusId);
        lastBeamFocus = focusId;
      }
    };

    let radius = 15;
    let theta = 0.62;
    let phi = 1.12;
    let targetTheta = theta;
    let targetPhi = phi;
    let targetRadius = radius;
    const lookAt = new THREE.Vector3(0, 0, 0);
    const targetLook = new THREE.Vector3(0, 0, 0);

    const focusCharacter = (id: string) => {
      if (id === flow.protagonistId) {
        targetLook.set(0, 0, 0);
        targetRadius = 15;
        return;
      }
      const targetObj = nodeObjs.find((o) => o.id === id);
      if (targetObj) {
        targetLook.copy(nodeAnchor(targetObj));
      } else {
        const pos = layoutMap.get(id)?.position ?? [0, 0, 0];
        targetLook.set(pos[0], pos[1], pos[2]);
      }
      targetRadius = 10.5;
    };

    const applyCamera = () => {
      const sinP = Math.sin(phi);
      camera.position.set(
        lookAt.x + radius * sinP * Math.cos(theta),
        lookAt.y + radius * Math.cos(phi),
        lookAt.z + radius * sinP * Math.sin(theta),
      );
      camera.lookAt(lookAt);
    };
    applyCamera();

    let dragging = false;
    let moved = false;
    let prevX = 0;
    let prevY = 0;

    const onDown = (e: MouseEvent) => {
      dragging = true;
      moved = false;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => {
      dragging = false;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      targetTheta -= dx * 0.007;
      targetPhi -= dy * 0.007;
      targetPhi = Math.max(0.35, Math.min(Math.PI - 0.35, targetPhi));
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetRadius += e.deltaY * 0.01;
      targetRadius = Math.max(7, Math.min(26, targetRadius));
    };

    const raycaster = new THREE.Raycaster();
    const onClick = (e: MouseEvent) => {
      if (moved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const hits = raycaster.intersectObjects(pickMeshes);
      if (hits.length > 0) {
        const id = hits[0].object.userData.id as string;
        if (id) {
          onSelectRef.current(id);
          focusCharacter(id);
        }
      }
    };

    renderer.domElement.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    let animId = 0;
    const start = performance.now();
    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const t = (now - start) * 0.001;
      beamPulse += 0.04;

      if (!dragging && selectedRef.current === flow.protagonistId) {
        targetTheta += 0.0009;
      }

      theta += (targetTheta - theta) * 0.07;
      phi += (targetPhi - phi) * 0.07;
      radius += (targetRadius - radius) * 0.06;
      lookAt.lerp(targetLook, 0.1);
      applyCamera();

      updateFocus(selectedRef.current);

      const boss = nodeObjs.find((o) => o.isProtagonist);
      if (boss) {
        const pulse = 1 + Math.sin(t * 2.2) * 0.12;
        boss.halo.scale.setScalar(3.6 * pulse);
      }

      if (beamGroup) {
        const focusId = selectedRef.current;
        const isBoss = focusId === flow.protagonistId;
        const pulse = 0.85 + Math.sin(beamPulse) * 0.12;
        beamGroup.children.forEach((child) => {
          if (child instanceof THREE.LineSegments) {
            const mat = child.material as THREE.LineBasicMaterial;
            mat.opacity = 0.28 * pulse;
          } else if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshBasicMaterial;
            const i = beamGroup!.children.indexOf(child);
            mat.opacity = (i === 0 ? 0.16 : 0.92) * pulse;
          }
        });
        if (isBoss) {
          beamGroup.rotation.y = t * 0.02;
        }
      }

      renderer.render(scene, camera);
    };
    animate(performance.now());

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);
    onResize();

    updateFocus(selectedRef.current);
    targetLook.set(0, 0, 0);
    targetRadius = 15;

    cameraControlRef.current = {
      focusOn: focusCharacter,
    };

    return () => {
      cameraControlRef.current = null;
      cancelAnimationFrame(animId);
      renderer.domElement.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      ro.disconnect();

      disposeBeam();
      dustGeo.dispose();
      dustMat.dispose();

      for (const obj of nodeObjs) {
        obj.avatar.material.map?.dispose();
        obj.avatar.material.dispose();
        obj.halo.material.map?.dispose();
        obj.halo.material.dispose();
        disposeSprite(obj.name);
      }

      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [flow.nodes, flow.edges, flow.protagonistId]);

  return (
    <div className="chronicle-scene3d-wrap">
      <div ref={mountRef} className="chronicle-scene3d" />
      <p className="chronicle-scene3d-hint">
        拖拽旋转 · 滚轮缩放 · 点主角看全部关系 · 点员工看单人故事
      </p>
    </div>
  );
}
