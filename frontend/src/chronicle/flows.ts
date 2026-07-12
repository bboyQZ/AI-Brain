/**
 * PRIVATE chronicle — 公司人物图 + 恋爱线数据。
 * 与 AI 课程 / 源码导读（guide/）无关，请勿混入 GUIDE_FLOWS。
 *
 * 布局：老板在上；各部门各自在带标题的分组框内。
 * 图片：frontend/public/chronicle/portraits/ + flows.ts 的 PORTRAIT_BY_ID（支持多张）。
 */

import { buildRomanceEdges } from "./romanceEdges";
import { ORG_CHARACTER_APPEARANCES } from "./orgAppearances";
import { NARRATIVE_BY_ID, ROMANCE_BRIEF_BY_ID } from "./narratives";

/** 恋爱关系标签（种类 / 形式）；时间写在 narrative 正文 */
export type RomanceMeta = {
  kind: string;
  form: string;
};

/** 公司大楼 3D 小人外观（方案 A：预设 + 配色） */
export type ChronicleAppearance = {
  hair?: string;
  hairColor?: string;
  outfit?: string;
  outfitColor?: string;
  accentColor?: string;
  skinColor?: string;
};

export type ChronicleNodeDef = {
  id: string;
  label: string;
  /** 首张肖像（兼容旧字段，等于 images[0]） */
  image?: string;
  /** 人物肖像列表，多张时可切换 / 画廊浏览 */
  images?: string[];
  subtitle?: string;
  bio?: string;
  romance?: RomanceMeta;
  /** dock "与乔志" 卡片上的简介短文本（一段话即可，不塞长文） */
  romanceBrief?: string;
  narrative?: string;
  /** @deprecated 优先 bio / narrative */
  story?: string;
  /** 公司大楼 3D 小人外观；缺省则按 id 哈希生成 */
  appearance?: ChronicleAppearance;
  /** 所属部门框；相对框内坐标（公司图） */
  parentId?: string;
  position: { x: number; y: number };
};

export type ChronicleGroupDef = {
  id: string;
  title: string;
  position: { x: number; y: number };
  width: number;
  height: number;
};

export type ChronicleEdgeDef = {
  id: string;
  source: string;
  target: string;
  kind: "reportsTo" | "romance";
  label?: string;
  romance?: RomanceMeta;
};

export type ChronicleViewMode = "romance" | "org";

export type ChronicleFlow = {
  title: string;
  romanceTitle: string;
  protagonistId: string;
  protagonistIntro: string;
  defaultView: ChronicleViewMode;
  groups: ChronicleGroupDef[];
  nodes: ChronicleNodeDef[];
  edges: ChronicleEdgeDef[];
};

export function nodeBio(node: ChronicleNodeDef): string {
  return node.bio ?? node.story ?? "";
}

/** 节点全部肖像 URL（images 优先，兼容旧 image） */
export function nodeImages(node: ChronicleNodeDef): string[] {
  if (node.images?.length) return node.images;
  if (node.image) return [node.image];
  return [];
}

const NX = 168;
const NY = 108;
const CARD_W = 150;
/** 框内上边留给部门标题 */
const PAD_TOP = 52;
const PAD_X = 28;
const PAD_BOTTOM = 28;

function person(
  id: string,
  label: string,
  subtitle: string,
  bio: string,
  x: number,
  y: number,
  parentId: string,
): ChronicleNodeDef {
  return { id, label, subtitle, bio, parentId, position: { x, y } };
}

function orgEdge(
  source: string,
  target: string,
  label?: string,
): ChronicleEdgeDef {
  return { id: `e-${source}-${target}`, source, target, kind: "reportsTo", label };
}

function gridInBox(
  items: { id: string; label: string; subtitle: string; story: string }[], // story → bio
  parentId: string,
  boxW: number,
  startY: number,
  cols: number,
  originX?: number,
): ChronicleNodeDef[] {
  const gridW = (cols - 1) * NX + CARD_W;
  const left = originX ?? (boxW - gridW) / 2;
  return items.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return person(
      item.id,
      item.label,
      item.subtitle,
      item.story,
      left + col * NX,
      startY + row * NY,
      parentId,
    );
  });
}

function headInBox(boxW: number) {
  return (boxW - CARD_W) / 2;
}

const secretMembers = [
  {
    id: "hansiying",
    label: "韩思莹",
    subtitle: "十秘",
    story:
      "班花，追求者众，不加陌生人微信，唯独对乔志例外。谎床同寝，七周从背靠背到成为他的人；必须亲睡。公司成立直来做贴身秘书，办公室圆床续写406。",
  },
  { id: "liyanjia", label: "李彦佳", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "jiangyingshan", label: "姜璎珊", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "shenglei", label: "盛蕾", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "wenyi", label: "文怡", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "xumingzhu", label: "许明珠", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "zhangxinrui", label: "张新蕊", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "cuichenglin", label: "崔程琳", subtitle: "十秘", story: "乔志的秘书之一。" },
  { id: "houbeifang", label: "侯北芳", subtitle: "十秘", story: "乔志的秘书之一。" },
];

const manageMembers = [
  { id: "liulinlin", label: "刘琳琳", subtitle: "管理部 · HR", story: "管理部门成员，同时是 HR。" },
  { id: "wangyipin", label: "王依品", subtitle: "管理部 · HR", story: "管理部门成员，同时是 HR。" },
];

const serviceMembers = [
  { id: "liyuetong", label: "李阅彤", subtitle: "恋爱体验馆", story: "恋爱体验馆一线接待。" },
  { id: "anjia", label: "安佳", subtitle: "恋爱体验馆", story: "恋爱体验馆一线接待。" },
  { id: "liyunhao", label: "李云浩", subtitle: "恋爱体验馆", story: "恋爱体验馆一线接待。" },
  { id: "dujingwen", label: "杜静玟", subtitle: "恋爱体验馆", story: "恋爱体验馆一线接待。" },
  { id: "panxinru", label: "潘心茹", subtitle: "恋爱体验馆", story: "恋爱体验馆一线接待。" },
  {
    id: "zhangdi",
    label: "张迪",
    subtitle: "恋爱体验馆",
    story:
      "大学同学，第一眼就想要，四年不敢开口。经常偷袜子与内裤，恋味成瘾；狼人杀、考研英语请教乔志后落榜。面试舌吻录用，当夜成为他的人。",
  },
  { id: "maoshiyu", label: "毛诗雨", subtitle: "恋爱体验馆", story: "恋爱体验馆一线接待。" },
];

const artMembers = [
  { id: "shashengyuwan", label: "杀生鱼丸", subtitle: "短视频网红", story: "短视频软件签约创作者。" },
  { id: "yedaoshengou", label: "夜刀神狗", subtitle: "短视频网红", story: "短视频软件签约创作者。" },
  { id: "baizhouxiaoxiong", label: "白昼小熊", subtitle: "短视频网红", story: "短视频软件签约创作者。" },
  { id: "shizhikuangsan", label: "时崎狂三", subtitle: "短视频网红", story: "短视频软件签约创作者。" },
];

const cleanLeft = [
  { id: "liangyingdan", label: "梁潆丹", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "baochang", label: "包畅", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "zhangjiayan", label: "张家炎", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "lishuang", label: "李爽", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "gaoxinyun", label: "高鑫芸", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "tianyu", label: "田宇", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "limin", label: "李敏", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "mawenyue", label: "马文悦", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "yangyongfang", label: "杨永芳", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "heanqi", label: "何安琪", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "liuyusong", label: "刘雨松", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
];

const cleanRight = [
  { id: "lijing", label: "李静", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "liyufeng", label: "李玉凤", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "wangyixuan", label: "王艺璇", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "zhangshiqing", label: "张诗晴", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "liuhao", label: "刘皓", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "gaiyinghua", label: "盖英华", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "jiaheming", label: "贾贺鸣", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "liyanping", label: "李艳萍", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "liyue", label: "李悦", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "wangruoqi", label: "王若琦", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "zhangdanyang", label: "张丹阳", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
  { id: "wangshanshan", label: "王珊杉", subtitle: "全楼保洁", story: "负责办公区日常清洁。" },
];

const GW_SECRET = PAD_X * 2 + 3 * NX - (NX - CARD_W);
const GW_MANAGE = PAD_X * 2 + 2 * NX - (NX - CARD_W);
const GW_SERVICE = PAD_X * 2 + 3 * NX - (NX - CARD_W);
const GW_CLEAN = PAD_X * 2 + 10 * NX - (NX - CARD_W);
const GW_ART = PAD_X * 2 + 3 * NX - (NX - CARD_W);

const GH_SECRET = PAD_TOP + 88 + NY * 3 + PAD_BOTTOM;
const GH_MANAGE = PAD_TOP + 88 + NY * 1 + PAD_BOTTOM;
const GH_SERVICE = PAD_TOP + 88 + NY * 3 + PAD_BOTTOM;
const GH_CLEAN = PAD_TOP + 88 + NY + 16 + NY * 3 + PAD_BOTTOM;
const GH_ART = PAD_TOP + 88 + NY * 2 + PAD_BOTTOM;

const GAP = 48;
const Y_GROUPS = 160;

const groups: ChronicleGroupDef[] = [
  {
    id: "dept-secret",
    title: "十秘",
    position: { x: 0, y: Y_GROUPS },
    width: GW_SECRET,
    height: GH_SECRET,
  },
  {
    id: "dept-manage",
    title: "管理部门",
    position: { x: GW_SECRET + GAP, y: Y_GROUPS },
    width: GW_MANAGE,
    height: GH_MANAGE,
  },
  {
    id: "dept-service",
    title: "服务部 · 恋爱体验馆",
    position: { x: GW_SECRET + GAP + GW_MANAGE + GAP, y: Y_GROUPS },
    width: GW_SERVICE,
    height: GH_SERVICE,
  },
  {
    id: "dept-clean",
    title: "清洁部 · 全楼保洁",
    position: {
      x: GW_SECRET + GAP + GW_MANAGE + GAP + GW_SERVICE + GAP,
      y: Y_GROUPS,
    },
    width: GW_CLEAN,
    height: GH_CLEAN,
  },
  {
    id: "dept-art",
    title: "文艺部 · 短视频网红",
    position: {
      x: GW_SECRET + GAP + GW_MANAGE + GAP + GW_SERVICE + GAP + GW_CLEAN + GAP,
      y: Y_GROUPS,
    },
    width: GW_ART,
    height: GH_ART,
  },
];

const totalW =
  GW_SECRET + GAP + GW_MANAGE + GAP + GW_SERVICE + GAP + GW_CLEAN + GAP + GW_ART;

const cleanHalfW = (GW_CLEAN - PAD_X * 2) / 2;
const staffY = PAD_TOP + 88 + NY + 16;

const nodes: ChronicleNodeDef[] = [
    {
      id: "qiaozhi",
      label: "乔志",
      subtitle: "老板",
      bio: "公司老板。旗下运营短视频软件与恋爱数据网，线下布局恋爱体验馆。",
      position: { x: totalW / 2 - CARD_W / 2, y: 0 },
    },

    person(
      "yangtinghan",
      "杨婷涵",
      "十秘 · 秘书长",
      "十秘之首，秘书长。直接向乔志汇报，统筹其余九位秘书。",
      headInBox(GW_SECRET),
      PAD_TOP + 8,
      "dept-secret",
    ),
    ...gridInBox(secretMembers, "dept-secret", GW_SECRET, PAD_TOP + 88, 3),

    person(
      "hubiru",
      "胡碧茹",
      "管理部长 · HR",
      "管理部门部长，同时负责 HR。向乔志汇报。",
      headInBox(GW_MANAGE),
      PAD_TOP + 8,
      "dept-manage",
    ),
    ...gridInBox(manageMembers, "dept-manage", GW_MANAGE, PAD_TOP + 88, 2),

    person(
      "zhangyujie",
      "张宇杰",
      "服务部 · 恋爱体验馆",
      "服务部门负责人，统筹线下恋爱体验馆运营。向乔志汇报。",
      headInBox(GW_SERVICE),
      PAD_TOP + 8,
      "dept-service",
    ),
    ...gridInBox(serviceMembers, "dept-service", GW_SERVICE, PAD_TOP + 88, 3),

    person(
      "wangxingmeng",
      "王星萌",
      "清洁部长 · 全楼保洁",
      "清洁部门部长，负责全公司与老板间保洁。向乔志汇报。副部长为赵子涵、王婧涵。",
      headInBox(GW_CLEAN),
      PAD_TOP + 8,
      "dept-clean",
    ),
    person(
      "zhaozhan",
      "赵子涵",
      "清洁副部长",
      "清洁部门副部长。",
      PAD_X + (cleanHalfW - CARD_W) / 2,
      PAD_TOP + 88,
      "dept-clean",
    ),
    person(
      "wangjinghan",
      "王婧涵",
      "清洁副部长",
      "清洁部门副部长。",
      PAD_X + cleanHalfW + (cleanHalfW - CARD_W) / 2,
      PAD_TOP + 88,
      "dept-clean",
    ),
    ...gridInBox(cleanLeft, "dept-clean", cleanHalfW, staffY, 5, PAD_X),
    ...gridInBox(
      cleanRight,
      "dept-clean",
      cleanHalfW,
      staffY,
      5,
      PAD_X + cleanHalfW,
    ),

    person(
      "pengshiliu",
      "彭十六",
      "文艺部 · 短视频网红",
      "文艺部门部长，负责短视频软件签约网红孵化。向乔志汇报。部门成员均以艺名相称。",
      headInBox(GW_ART),
      PAD_TOP + 8,
      "dept-art",
    ),
    ...gridInBox(artMembers, "dept-art", GW_ART, PAD_TOP + 88, 3),
];

const orgEdges: ChronicleEdgeDef[] = [
  orgEdge("qiaozhi", "yangtinghan"),
  orgEdge("qiaozhi", "hubiru"),
  orgEdge("qiaozhi", "zhangyujie"),
  orgEdge("qiaozhi", "wangxingmeng"),
  orgEdge("qiaozhi", "pengshiliu"),
  orgEdge("wangxingmeng", "zhaozhan"),
  orgEdge("wangxingmeng", "wangjinghan"),
];

const protagonistId = "qiaozhi";

/** 按「姓名」「姓名 (2)」… 生成肖像 URL 列表 */
function portraitSeries(
  name: string,
  ext: "jpg" | "png" = "jpg",
  maxVariant = 1,
): string[] {
  const paths = [`/chronicle/portraits/${name}.${ext}`];
  for (let i = 2; i <= maxVariant; i++) {
    paths.push(`/chronicle/portraits/${name} (${i}).jpg`);
  }
  return paths;
}

/** 已投放 portraits 目录的文件，按节点 id 挂载；值为单路径或路径数组 */
const PORTRAIT_BY_ID: Record<string, string | string[]> = {
  yangtinghan: portraitSeries("杨婷涵", "jpg", 6),
  hansiying: portraitSeries("韩思莹", "jpg", 2),
  liyanjia: portraitSeries("李彦佳", "png", 1),
  jiangyingshan: portraitSeries("姜璎珊", "jpg", 3),
  xumingzhu: portraitSeries("许明珠", "jpg", 5),
  cuichenglin: portraitSeries("崔程琳", "jpg", 5),

  hubiru: portraitSeries("胡碧茹", "jpg", 1),
  liulinlin: portraitSeries("刘琳琳", "jpg", 2),
  wangyipin: portraitSeries("王依品", "jpg", 1),

  anjia: portraitSeries("安佳", "jpg", 1),
  liyunhao: portraitSeries("李云浩", "jpg", 1),
  dujingwen: portraitSeries("杜静玟", "jpg", 2),
  panxinru: portraitSeries("潘心茹", "jpg", 15),
  zhangdi: portraitSeries("张迪", "jpg", 4),
  maoshiyu: portraitSeries("毛诗雨", "jpg", 2),

  pengshiliu: portraitSeries("彭十六", "png", 1),
  shashengyuwan: portraitSeries("杀生鱼丸", "png", 1),
  yedaoshengou: portraitSeries("夜刀神狗", "jpg", 1),
  baizhouxiaoxiong: portraitSeries("白昼小熊", "jpg", 2),
  shizhikuangsan: portraitSeries("时崎狂三", "jpg", 2),

  zhangyujie: portraitSeries("张宇杰", "jpg", 1),
  wangxingmeng: portraitSeries("王星萌", "jpg", 1),
  zhaozhan: portraitSeries("赵子涵", "jpg", 5),
  wangjinghan: portraitSeries("王婧涵", "jpg", 4),

  baochang: portraitSeries("包畅", "jpg", 2),
  mawenyue: portraitSeries("马文悦", "jpg", 1),
  yangyongfang: portraitSeries("杨永芳", "jpg", 2),
  heanqi: portraitSeries("何安琪", "jpg", 2),
  liuyusong: portraitSeries("刘雨松", "jpg", 6),

  wangyixuan: portraitSeries("王艺璇", "jpg", 1),
  liyue: portraitSeries("李悦", "jpg", 1),
  wangruoqi: portraitSeries("王若琦", "jpg", 2),
  jiaheming: portraitSeries("贾贺鸣", "jpg", 1),
  wangshanshan: [
    ...portraitSeries("王姗杉", "jpg", 5),
    ...portraitSeries("王珊杉", "jpg", 2),
  ],
};

function portraitListForNode(n: ChronicleNodeDef): string[] {
  const mapped = PORTRAIT_BY_ID[n.id];
  if (mapped) return Array.isArray(mapped) ? [...mapped] : [mapped];
  if (n.images?.length) return n.images;
  if (n.image) return [n.image];
  return [];
}

const nodesWithAppearance: ChronicleNodeDef[] = nodes.map((n) => {
  const images = portraitListForNode(n);
  const narrative = NARRATIVE_BY_ID[n.id] ?? n.narrative;
  const romanceBrief = ROMANCE_BRIEF_BY_ID[n.id] ?? n.romanceBrief;
  return {
    ...n,
    appearance: ORG_CHARACTER_APPEARANCES[n.id] ?? n.appearance,
    images: images.length ? images : undefined,
    image: images[0],
    narrative,
    romanceBrief,
  };
});

export const CHRONICLE_FLOW: ChronicleFlow = {
  title: "公司大楼",
  romanceTitle: "恋爱线",
  protagonistId,
  protagonistIntro:
    "短视频软件与恋爱数据网背后的掌舵人，线下还有恋爱体验馆。与每一位员工都有着不同时间、不同形式、不同种类的情感牵连——点击任意员工，从焦点里读她的故事。",
  defaultView: "romance",
  groups,
  nodes: nodesWithAppearance,
  edges: [...orgEdges, ...buildRomanceEdges(nodesWithAppearance, protagonistId)],
};
