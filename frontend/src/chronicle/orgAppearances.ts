/**
 * PRIVATE chronicle — 每位员工的 3D 小人独立外观配置（方案 A）。
 */
import type { ChronicleAppearance } from "./flows";

type A = ChronicleAppearance;

const p = (
  hair: string,
  hairColor: string,
  outfit: string,
  outfitColor: string,
  accentColor?: string,
  skinColor = "#f5d0c5",
): A => ({
  hair,
  hairColor,
  outfit,
  outfitColor,
  accentColor: accentColor ?? outfitColor,
  skinColor,
});

/** id → 独立外观；场景与 resolveAppearance 优先读取 node.appearance */
export const ORG_CHARACTER_APPEARANCES: Record<string, A> = {
  qiaozhi: p("short", "#2a1f14", "blazer-skirt", "#C9922E", "#F5C842", "#edd5c8"),

  yangtinghan: p("hime-cut", "#1a1a2e", "blazer-skirt", "#F472B6", "#FFB7D5"),
  hansiying: p("long-wavy", "#3d2817", "wrap-dress", "#F9A8D4", "#FBCFE8"),
  liyanjia: p("ponytail", "#4a3728", "pencil-skirt", "#EC4899", "#F9A8D4"),
  jiangyingshan: p("bob", "#2c1810", "silk-blouse", "#DB2777", "#F472B6"),
  shenglei: p("low-bun", "#5c3d2e", "cardigan-skirt", "#E879A8", "#FBCFE8"),
  wenyi: p("side-braid", "#6b4423", "a-line", "#F472B6", "#FDA4AF"),
  xumingzhu: p("twin-tails", "#2a1f3d", "office-vest", "#EC4899", "#F9A8D4"),
  zhangxinrui: p("curly-medium", "#8b5a3c", "knit-dress", "#DB2777", "#F472B6"),
  cuichenglin: p("long-straight", "#1f1410", "tweed-set", "#E879A8", "#FBCFE8"),
  houbeifang: p("bun", "#4a2040", "sleeveless-dress", "#F472B6", "#F9A8D4"),

  hubiru: p("bob", "#2c1810", "blazer-skirt", "#3B82F6", "#93C5FD"),
  liulinlin: p("ponytail", "#3d2817", "pencil-skirt", "#60A5FA", "#BFDBFE"),
  wangyipin: p("hime-cut", "#1a1a2e", "cardigan-skirt", "#2563EB", "#93C5FD"),

  zhangyujie: p("long-straight", "#2a1f14", "blazer-skirt", "#10B981", "#6EE7B7"),
  liyuetong: p("ponytail", "#4a3728", "wrap-dress", "#34D399", "#A7F3D0"),
  anjia: p("bob", "#5c3d2e", "a-line", "#059669", "#6EE7B7"),
  liyunhao: p("short", "#1f1410", "office-vest", "#10B981", "#34D399"),
  dujingwen: p("long-wavy", "#6b4423", "silk-blouse", "#14B8A6", "#99F6E4"),
  panxinru: p("twin-tails", "#8b5a3c", "knit-dress", "#2DD4BF", "#A7F3D0"),
  zhangdi: p("side-braid", "#2a1f3d", "pencil-skirt", "#10B981", "#6EE7B7"),
  maoshiyu: p("curly-medium", "#4a2040", "cardigan-skirt", "#059669", "#34D399"),

  pengshiliu: p("long-wavy", "#1f1410", "wrap-dress", "#A855F7", "#D8B4FE"),
  shashengyuwan: p("twin-tails", "#4a2040", "a-line", "#C084FC", "#E9D5FF"),
  yedaoshengou: p("pixie", "#2a1f3d", "sleeveless-dress", "#9333EA", "#D8B4FE"),
  baizhouxiaoxiong: p("bob", "#8b5a3c", "knit-dress", "#A855F7", "#E9D5FF"),
  shizhikuangsan: p("twin-tails", "#1a0a0a", "gothic-lolita", "#7f1d1d", "#EF4444"),

  wangxingmeng: p("hime-cut", "#2c1810", "blazer-skirt", "#64748B", "#94A3B8"),
  zhaozhan: p("ponytail", "#3d2817", "pencil-skirt", "#6B8CAE", "#A8BFD4"),
  wangjinghan: p("long-straight", "#4a3728", "office-vest", "#64748B", "#94A3B8"),
  liangyingdan: p("bob", "#5c3d2e", "cardigan-skirt", "#7C94B0", "#B8C9DC"),
  baochang: p("low-bun", "#6b4423", "a-line", "#64748B", "#94A3B8"),
  zhangjiayan: p("side-braid", "#1a1a2e", "wrap-dress", "#6B8CAE", "#A8BFD4"),
  lishuang: p("curly-medium", "#2a1f3d", "silk-blouse", "#7C94B0", "#CBD5E1"),
  gaoxinyun: p("twin-tails", "#8b5a3c", "knit-dress", "#64748B", "#94A3B8"),
  tianyu: p("short", "#1f1410", "pencil-skirt", "#6B8CAE", "#A8BFD4"),
  limin: p("long-wavy", "#3d2817", "tweed-set", "#7C94B0", "#B8C9DC"),
  mawenyue: p("ponytail", "#4a3728", "sleeveless-dress", "#64748B", "#94A3B8"),
  yangyongfang: p("bun", "#5c3d2e", "cardigan-skirt", "#6B8CAE", "#A8BFD4"),
  heanqi: p("hime-cut", "#6b4423", "blazer-skirt", "#7C94B0", "#CBD5E1"),
  liuyusong: p("long-straight", "#2c1810", "office-vest", "#64748B", "#94A3B8"),
  lijing: p("bob", "#4a2040", "wrap-dress", "#6B8CAE", "#A8BFD4"),
  liyufeng: p("side-braid", "#3d2817", "a-line", "#7C94B0", "#B8C9DC"),
  wangyixuan: p("low-bun", "#1a1a2e", "pencil-skirt", "#64748B", "#94A3B8"),
  zhangshiqing: p("curly-medium", "#8b5a3c", "silk-blouse", "#6B8CAE", "#A8BFD4"),
  liuhao: p("pixie", "#1f1410", "knit-dress", "#7C94B0", "#CBD5E1"),
  gaiyinghua: p("ponytail", "#5c3d2e", "cardigan-skirt", "#64748B", "#94A3B8"),
  jiaheming: p("long-wavy", "#4a3728", "tweed-set", "#6B8CAE", "#A8BFD4"),
  liyanping: p("twin-tails", "#2a1f3d", "sleeveless-dress", "#7C94B0", "#B8C9DC"),
  liyue: p("hime-cut", "#6b4423", "blazer-skirt", "#64748B", "#94A3B8"),
  wangruoqi: p("long-straight", "#3d2817", "office-vest", "#6B8CAE", "#A8BFD4"),
  zhangdanyang: p("bob", "#4a3728", "wrap-dress", "#7C94B0", "#CBD5E1"),
  wangshanshan: p("bun", "#2c1810", "a-line", "#64748B", "#94A3B8"),
};

export function appearanceForNode(id: string): ChronicleAppearance | undefined {
  return ORG_CHARACTER_APPEARANCES[id];
}
