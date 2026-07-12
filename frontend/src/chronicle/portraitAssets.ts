/**
 * Chronicle 肖像分级 URL：原图 / 预览(display) / 缩略图(thumb)。
 * 由 frontend/scripts/optimize_chronicle_portraits.mjs 与 enhance_chronicle_portraits.mjs 生成。
 * 全屏画廊默认 enhanced/；底部浮层 display/；「100%」用原图。
 */

const PORTRAIT_PREFIX = "/chronicle/portraits/";

export type PortraitBundle = {
  full: string;
  display: string;
  thumb: string;
  enhanced: string;
};

function portraitStemFromUrl(url: string): string | null {
  if (!url.startsWith(PORTRAIT_PREFIX)) return null;
  const name = url.slice(PORTRAIT_PREFIX.length);
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return null;
  return name.slice(0, dot);
}

export function portraitThumbUrl(original: string): string {
  const stem = portraitStemFromUrl(original);
  return stem ? `${PORTRAIT_PREFIX}thumbs/${stem}.webp` : original;
}

export function portraitDisplayUrl(original: string): string {
  const stem = portraitStemFromUrl(original);
  return stem ? `${PORTRAIT_PREFIX}display/${stem}.webp` : original;
}

export function portraitEnhancedUrl(original: string): string {
  const stem = portraitStemFromUrl(original);
  return stem ? `${PORTRAIT_PREFIX}enhanced/${stem}.webp` : original;
}

export function portraitBundle(original: string): PortraitBundle {
  return {
    full: original,
    display: portraitDisplayUrl(original),
    thumb: portraitThumbUrl(original),
    enhanced: portraitEnhancedUrl(original),
  };
}

export function portraitBundles(originals: string[]): PortraitBundle[] {
  return originals.map(portraitBundle);
}
