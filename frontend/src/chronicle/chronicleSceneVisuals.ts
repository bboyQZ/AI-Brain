/**
 * PRIVATE chronicle — 恋爱线 3D 关系星图视觉资源。
 */
import * as THREE from "three";

export function readCssColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return value || fallback;
}

export function hexToThree(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function lighten(hex: string, amount = 0.28): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return `#${c.getHexString()}`;
}

export function makeAvatarTexture(
  _label: string,
  accent: string,
  isProtagonist: boolean,
): THREE.CanvasTexture {
  const size = 320;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const rayLen = isProtagonist ? 118 : 82;
  const coreR = isProtagonist ? 14 : 9;

  ctx.clearRect(0, 0, size, size);

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, rayLen * 1.35);
  halo.addColorStop(0, `${lighten(accent, 0.35)}aa`);
  halo.addColorStop(0.22, `${accent}55`);
  halo.addColorStop(0.55, `${accent}18`);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const drawRay = (angle: number, length: number, width: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.12, lighten(accent, 0.25));
    grad.addColorStop(0.45, `${accent}88`);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -width);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const rayW = isProtagonist ? 5.5 : 3.8;
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 4) * i;
    drawRay(angle, rayLen, rayW);
    drawRay(angle + Math.PI, rayLen * 0.72, rayW * 0.65);
  }

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.8);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.35, lighten(accent, 0.2));
  core.addColorStop(0.75, accent);
  core.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 2.8, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fillStyle = "#fffef8";
  ctx.shadowColor = accent;
  ctx.shadowBlur = isProtagonist ? 22 : 14;
  ctx.fill();
  ctx.shadowBlur = 0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export type NameSpriteOptions = {
  /** 世界空间宽高，默认适配恋爱线星图 */
  scale?: [number, number];
};

export function makeNameSprite(
  name: string,
  subtitle: string,
  accent: string,
  active: boolean,
  opts?: NameSpriteOptions,
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = subtitle ? 108 : 72;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const displayName = name.length > 9 ? `${name.slice(0, 9)}…` : name;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (active) {
    const pillW = Math.min(300, Math.max(120, displayName.length * 26 + 40));
    const pillH = subtitle ? 78 : 46;
    const px = (canvas.width - pillW) / 2;
    const py = 10;
    const r = 18;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + pillW, py, px + pillW, py + pillH, r);
    ctx.arcTo(px + pillW, py + pillH, px, py + pillH, r);
    ctx.arcTo(px, py + pillH, px, py, r);
    ctx.arcTo(px, py, px + pillW, py, r);
    ctx.closePath();
    ctx.fillStyle = "rgba(8, 10, 24, 0.72)";
    ctx.fill();
    ctx.strokeStyle = `${accent}aa`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.font = `700 ${active ? 30 : 24}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = active ? "#fff7ed" : "#e2e8f0";
  ctx.shadowColor = accent;
  ctx.shadowBlur = active ? 12 : 6;
  ctx.fillText(displayName, canvas.width / 2, subtitle ? 36 : canvas.height / 2);

  if (subtitle) {
    ctx.shadowBlur = 0;
    ctx.font = '500 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = `${accent}`;
    const displaySub =
      subtitle.length > 14 ? `${subtitle.slice(0, 14)}…` : subtitle;
    ctx.fillText(displaySub, canvas.width / 2, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const defaultScale: [number, number] = active
    ? [3.1, subtitle ? 0.95 : 0.62]
    : [2.5, subtitle ? 0.95 : 0.62];
  const [sx, sy] = opts?.scale ?? defaultScale;
  sprite.scale.set(sx, sy, 1);
  sprite.renderOrder = 12;
  return sprite;
}

export function createBuildingSky(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(90, 48, 48);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uTop: { value: new THREE.Color("#14213d") },
      uBottom: { value: new THREE.Color("#060a12") },
      uGlow: { value: new THREE.Color("#38bdf8") },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTop;
      uniform vec3 uBottom;
      uniform vec3 uGlow;
      varying vec3 vPos;
      void main() {
        vec3 dir = normalize(vPos);
        float h = dir.y * 0.5 + 0.5;
        vec3 col = mix(uBottom, uTop, pow(h, 0.9));
        float horizon = smoothstep(0.42, 0.48, dir.y);
        col += uGlow * horizon * 0.12;
        float stars = fract(sin(dot(dir.xy * 40.0, vec2(12.9898, 78.233))) * 43758.5453);
        col += vec3(stars * step(0.994, stars) * 0.45);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return new THREE.Mesh(geometry, material);
}

export function makeWingLabel(title: string, accent: string, light = false): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 280;
  canvas.height = 56;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = 248;
  const h = 40;
  const x = (canvas.width - w) / 2;
  const y = 8;
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = light ? "rgba(255,255,255,0.92)" : "rgba(10, 16, 32, 0.78)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = light ? "#334155" : "#e2e8f0";
  ctx.font = '700 22px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, canvas.width / 2, 28);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.6, 0.72, 1);
  sprite.renderOrder = 8;
  return sprite;
}

export function curveBetween(
  a: THREE.Vector3,
  b: THREE.Vector3,
): THREE.QuadraticBezierCurve3 {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const pull = a.distanceTo(b) * 0.28;
  mid.y += pull;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

/** 关系线端点：从星星光晕边缘起止，避免停在中心看起来「连偏」 */
export function linkEndpoints(
  from: THREE.Vector3,
  to: THREE.Vector3,
  fromInset: number,
  toInset: number,
): [THREE.Vector3, THREE.Vector3] {
  const delta = to.clone().sub(from);
  const dist = delta.length();
  if (dist <= fromInset + toInset + 0.05) {
    return [from.clone(), to.clone()];
  }
  const dir = delta.multiplyScalar(1 / dist);
  return [
    from.clone().add(dir.clone().multiplyScalar(fromInset)),
    to.clone().sub(dir.clone().multiplyScalar(toInset)),
  ];
}

export function disposeSprite(sprite: THREE.Sprite) {
  sprite.material.map?.dispose();
  sprite.material.dispose();
}
