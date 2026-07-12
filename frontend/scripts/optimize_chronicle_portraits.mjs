/**
 * 批量生成 chronicle 肖像分级资源：
 * - thumbs/  最长边 800px  WebP（浮层预览、缩略图条）
 * - display/ 最长边 1920px WebP（全屏画廊默认）
 * 原图保留在 portraits/ 根目录，点「100%」时使用。
 *
 * 用法：npm run optimize-portraits（在 frontend 目录）
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, "..");
const PORTRAITS = path.join(FRONTEND, "public", "chronicle", "portraits");
const THUMBS = path.join(PORTRAITS, "thumbs");
const DISPLAY = path.join(PORTRAITS, "display");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const VARIANTS = [
  { dir: THUMBS, max: 1200, quality: 92, label: "thumb", sharpen: false },
  { dir: DISPLAY, max: 2560, quality: 94, label: "display", sharpen: true },
];

async function ensureDirs() {
  await fs.mkdir(THUMBS, { recursive: true });
  await fs.mkdir(DISPLAY, { recursive: true });
}

async function listSources() {
  const entries = await fs.readdir(PORTRAITS, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()));
}

async function writeVariant(srcPath, stem, variant) {
  const outPath = path.join(variant.dir, `${stem}.webp`);
  const meta = await sharp(srcPath, { failOn: "none" }).rotate().metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const longest = Math.max(w, h);
  let img = sharp(srcPath, { failOn: "none" }).rotate();
  if (longest > variant.max) {
    img = img.resize({
      width: w >= h ? variant.max : undefined,
      height: h > w ? variant.max : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  if (variant.sharpen) {
    img = img.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.35 });
  }
  await img.webp({ quality: variant.quality, effort: 5, smartSubsample: false }).toFile(outPath);
  const stat = await fs.stat(outPath);
  return { kb: Math.round(stat.size / 102.4) / 10 };
}

async function main() {
  await ensureDirs();
  const sources = await listSources();
  if (!sources.length) {
    console.log("未找到可处理的肖像文件。");
    return;
  }

  console.log(`处理 ${sources.length} 张原图 → thumbs/ + display/ …`);
  let ok = 0;
  for (const file of sources) {
    const srcPath = path.join(PORTRAITS, file);
    const stem = path.parse(file).name;
    try {
      const parts = [];
      for (const variant of VARIANTS) {
        const { kb } = await writeVariant(srcPath, stem, variant);
        parts.push(`${variant.label} ${kb}KB`);
      }
      console.log(`  ✓ ${file} → ${parts.join(", ")}`);
      ok += 1;
    } catch (err) {
      console.error(`  ✗ ${file}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`完成：${ok}/${sources.length} 张。预览用 display/，全屏用原图。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
