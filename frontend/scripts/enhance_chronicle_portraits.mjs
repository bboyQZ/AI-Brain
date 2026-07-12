/**
 * AI/高质量增强 chronicle 肖像 → enhanced/（默认 2× + 锐化 WebP）
 *
 * 若存在 tools/realesrgan-ncnn-vulkan/realesrgan-ncnn-vulkan.exe 则优先 Real-ESRGAN。
 * 否则用 sharp Lanczos 放大（本地可跑，无需 GPU）。
 *
 * 用法：npm run enhance-portraits
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, "..");
const REPO = path.resolve(FRONTEND, "..");
const PORTRAITS = path.join(FRONTEND, "public", "chronicle", "portraits");
const ENHANCED = path.join(PORTRAITS, "enhanced");
const REALESRGAN = path.join(
  REPO,
  "tools",
  "realesrgan-ncnn-vulkan",
  "realesrgan-ncnn-vulkan.exe",
);

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function upscaleFactor(longest) {
  if (longest >= 2800) return 1.25;
  if (longest >= 1800) return 1.5;
  return 2;
}

async function listSources() {
  const entries = await fs.readdir(PORTRAITS, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()));
}

async function enhanceWithRealEsrgan(srcPath, outPath) {
  const tmpPng = outPath.replace(/\.webp$/i, ".png");
  await execFileAsync(
    REALESRGAN,
    ["-i", srcPath, "-o", tmpPng, "-n", "realesrgan-x4plus", "-s", "2", "-f", "png"],
    { timeout: 600_000 },
  );
  await sharp(tmpPng)
    .webp({ quality: 95, effort: 5, smartSubsample: false })
    .toFile(outPath);
  await fs.unlink(tmpPng).catch(() => {});
}

async function enhanceWithSharp(srcPath, outPath) {
  const meta = await sharp(srcPath, { failOn: "none" }).rotate().metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error("无法读取尺寸");
  const factor = upscaleFactor(Math.max(w, h));
  let img = sharp(srcPath, { failOn: "none" }).rotate();
  if (factor > 1) {
    img = img.resize({
      width: Math.round(w * factor),
      height: Math.round(h * factor),
      kernel: sharp.kernel.lanczos3,
    });
  }
  await img
    .sharpen({ sigma: 0.9, m1: 0.55, m2: 0.35 })
    .webp({ quality: 95, effort: 5, smartSubsample: false })
    .toFile(outPath);
  return factor;
}

async function main() {
  await fs.mkdir(ENHANCED, { recursive: true });
  const sources = await listSources();
  if (!sources.length) {
    console.log("未找到可处理的肖像文件。");
    return;
  }

  let useAi = false;
  try {
    await fs.access(REALESRGAN);
    useAi = true;
    console.log("使用 Real-ESRGAN:", REALESRGAN);
  } catch {
    console.log("未找到 Real-ESRGAN，使用 sharp 2× 高质量放大 + 锐化。");
    console.log(
      "可选：将 realesrgan-ncnn-vulkan 解压到 tools/realesrgan-ncnn-vulkan/ 后重跑。",
    );
  }

  console.log(`增强 ${sources.length} 张 → enhanced/ …`);
  let ok = 0;
  for (const file of sources) {
    const srcPath = path.join(PORTRAITS, file);
    const stem = path.parse(file).name;
    const outPath = path.join(ENHANCED, `${stem}.webp`);
    try {
      if (useAi) {
        await enhanceWithRealEsrgan(srcPath, outPath);
        const stat = await fs.stat(outPath);
        console.log(`  ✓ ${file} → AI ${Math.round(stat.size / 102.4) / 10}KB`);
      } else {
        const factor = await enhanceWithSharp(srcPath, outPath);
        const stat = await fs.stat(outPath);
        console.log(
          `  ✓ ${file} → ${factor}× ${Math.round(stat.size / 102.4) / 10}KB`,
        );
      }
      ok += 1;
    } catch (err) {
      console.error(`  ✗ ${file}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`完成：${ok}/${sources.length} 张。全屏默认加载 enhanced/。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
