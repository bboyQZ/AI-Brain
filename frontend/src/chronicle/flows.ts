/**
 * PRIVATE chronicle — 公司人物图数据。
 * 与 AI 课程 / 源码导读（guide/）无关，请勿混入 GUIDE_FLOWS。
 *
 * 布局：老板在上；四个部门各自在带标题的分组框内。
 * 图片：frontend/public/chronicle/portraits/ + image 字段。
 */

export type ChronicleNodeDef = {
  id: string;
  label: string;
  image?: string;
  story: string;
  subtitle?: string;
  /** 所属部门框；相对框内坐标 */
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
  label?: string;
};

export type ChronicleFlow = {
  title: string;
  groups: ChronicleGroupDef[];
  nodes: ChronicleNodeDef[];
  edges: ChronicleEdgeDef[];
};

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
  story: string,
  x: number,
  y: number,
  parentId: string,
): ChronicleNodeDef {
  return { id, label, subtitle, story, parentId, position: { x, y } };
}

function edge(source: string, target: string, label?: string): ChronicleEdgeDef {
  return { id: `e-${source}-${target}`, source, target, label };
}

function gridInBox(
  items: { id: string; label: string; subtitle: string; story: string }[],
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
  { id: "hansiying", label: "韩思莹", subtitle: "十秘", story: "乔志的秘书之一。" },
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
  { id: "liyuetong", label: "李阅彤", subtitle: "服务部", story: "服务部门成员。" },
  { id: "anjia", label: "安佳", subtitle: "服务部", story: "服务部门成员。" },
  { id: "liyunhao", label: "李云浩", subtitle: "服务部", story: "服务部门成员。" },
  { id: "dujingwen", label: "杜静玟", subtitle: "服务部", story: "服务部门成员。" },
  { id: "panxinru", label: "潘心茹", subtitle: "服务部", story: "服务部门成员。" },
  { id: "zhangdi", label: "张迪", subtitle: "服务部", story: "服务部门成员。" },
  { id: "maoshiyu", label: "毛诗雨", subtitle: "服务部", story: "服务部门成员。" },
];

const cleanLeft = [
  { id: "liangyingdan", label: "梁潆丹", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "baochang", label: "包畅", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "zhangjiayan", label: "张家炎", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "lishuang", label: "李爽", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "gaoxinyun", label: "高鑫芸", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "tianyu", label: "田宇", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "limin", label: "李敏", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "mawenyue", label: "马文悦", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "yangyongfang", label: "杨永芳", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "heanqi", label: "何安琪", subtitle: "清洁部", story: "清洁部门成员。" },
];

const cleanRight = [
  { id: "lijing", label: "李静", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "liyufeng", label: "李玉凤", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "wangyixuan", label: "王艺璇", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "zhangshiqing", label: "张诗晴", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "liuhao", label: "刘皓", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "gaiyinghua", label: "盖英华", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "jiaheming", label: "贾贺鸣", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "liyanping", label: "李艳萍", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "liyue", label: "李悦", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "wangruoqi", label: "王若琦", subtitle: "清洁部", story: "清洁部门成员。" },
  { id: "zhangdanyang", label: "张丹阳", subtitle: "清洁部", story: "清洁部门成员。" },
];

const GW_SECRET = PAD_X * 2 + 3 * NX - (NX - CARD_W);
const GW_MANAGE = PAD_X * 2 + 2 * NX - (NX - CARD_W);
const GW_SERVICE = PAD_X * 2 + 3 * NX - (NX - CARD_W);
const GW_CLEAN = PAD_X * 2 + 10 * NX - (NX - CARD_W);

const GH_SECRET = PAD_TOP + 88 + NY * 3 + PAD_BOTTOM;
const GH_MANAGE = PAD_TOP + 88 + NY * 1 + PAD_BOTTOM;
const GH_SERVICE = PAD_TOP + 88 + NY * 3 + PAD_BOTTOM;
const GH_CLEAN = PAD_TOP + 88 + NY + 16 + NY * 3 + PAD_BOTTOM;

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
    title: "服务部门",
    position: { x: GW_SECRET + GAP + GW_MANAGE + GAP, y: Y_GROUPS },
    width: GW_SERVICE,
    height: GH_SERVICE,
  },
  {
    id: "dept-clean",
    title: "清洁部门",
    position: {
      x: GW_SECRET + GAP + GW_MANAGE + GAP + GW_SERVICE + GAP,
      y: Y_GROUPS,
    },
    width: GW_CLEAN,
    height: GH_CLEAN,
  },
];

const totalW =
  GW_SECRET + GAP + GW_MANAGE + GAP + GW_SERVICE + GAP + GW_CLEAN;

const cleanHalfW = (GW_CLEAN - PAD_X * 2) / 2;
const staffY = PAD_TOP + 88 + NY + 16;

export const CHRONICLE_FLOW: ChronicleFlow = {
  title: "公司人物图",
  groups,
  nodes: [
    {
      id: "qiaozhi",
      label: "乔志",
      subtitle: "老板",
      story: "公司老板。下辖十秘、管理部门、服务部门、清洁部门。",
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
      "服务部门老板",
      "服务部门负责人。向乔志汇报。",
      headInBox(GW_SERVICE),
      PAD_TOP + 8,
      "dept-service",
    ),
    ...gridInBox(serviceMembers, "dept-service", GW_SERVICE, PAD_TOP + 88, 3),

    person(
      "wangxingmeng",
      "王星萌",
      "清洁部长",
      "清洁部门部长。向乔志汇报。副部长为赵子涵、王婧涵。",
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
  ],
  edges: [
    // 老板 → 各部门负责人
    edge("qiaozhi", "yangtinghan"),
    edge("qiaozhi", "hubiru"),
    edge("qiaozhi", "zhangyujie"),
    edge("qiaozhi", "wangxingmeng"),
    // 清洁部长 → 副部长
    edge("wangxingmeng", "zhaozhan"),
    edge("wangxingmeng", "wangjinghan"),
  ],
};
