/**
 * PRIVATE chronicle — 各部门成员工位顺序（与 flows.ts 编制一致）。
 */
export const SECRET_STAFF_IDS = [
  "hansiying",
  "liyanjia",
  "jiangyingshan",
  "shenglei",
  "wenyi",
  "xumingzhu",
  "zhangxinrui",
  "cuichenglin",
  "houbeifang",
] as const;

export const MANAGE_STAFF_IDS = ["liulinlin", "wangyipin"] as const;

export const SERVICE_STAFF_IDS = [
  "liyuetong",
  "anjia",
  "liyunhao",
  "dujingwen",
  "panxinru",
  "zhangdi",
  "maoshiyu",
] as const;

export const ART_STAFF_IDS = [
  "shashengyuwan",
  "yedaoshengou",
  "baizhouxiaoxiong",
  "shizhikuangsan",
] as const;

export const CLEAN_LEFT_IDS = [
  "liangyingdan",
  "baochang",
  "zhangjiayan",
  "lishuang",
  "gaoxinyun",
  "tianyu",
  "limin",
  "mawenyue",
  "yangyongfang",
  "heanqi",
  "liuyusong",
] as const;

export const CLEAN_RIGHT_IDS = [
  "lijing",
  "liyufeng",
  "wangyixuan",
  "zhangshiqing",
  "liuhao",
  "gaiyinghua",
  "jiaheming",
  "liyanping",
  "liyue",
  "wangruoqi",
  "zhangdanyang",
  "wangshanshan",
] as const;

export type DeptSeatPlan = {
  wingId: string;
  headId?: string;
  deputyIds?: readonly string[];
  grids: readonly {
    ids: readonly string[];
    cols: number;
    zone: "full" | "left" | "right";
  }[];
};

export const DEPT_SEAT_PLANS: DeptSeatPlan[] = [
  {
    wingId: "dept-secret",
    headId: "yangtinghan",
    grids: [{ ids: SECRET_STAFF_IDS, cols: 3, zone: "full" }],
  },
  {
    wingId: "dept-manage",
    headId: "hubiru",
    grids: [{ ids: MANAGE_STAFF_IDS, cols: 2, zone: "full" }],
  },
  {
    wingId: "dept-service",
    headId: "zhangyujie",
    grids: [{ ids: SERVICE_STAFF_IDS, cols: 3, zone: "full" }],
  },
  {
    wingId: "dept-art",
    headId: "pengshiliu",
    grids: [{ ids: ART_STAFF_IDS, cols: 3, zone: "full" }],
  },
  {
    wingId: "dept-clean",
    headId: "wangxingmeng",
    deputyIds: ["zhaozhan", "wangjinghan"],
    grids: [
      { ids: CLEAN_LEFT_IDS, cols: 5, zone: "left" },
      { ids: CLEAN_RIGHT_IDS, cols: 5, zone: "right" },
    ],
  },
];

export const BOSS_ID = "qiaozhi";

/** 点击翼楼时选中对应负责人 */
export const WING_HEAD_IDS: Record<string, string> = {
  boss: BOSS_ID,
  ...Object.fromEntries(
    DEPT_SEAT_PLANS.map((p) => [p.wingId, p.headId ?? ""]).filter(([, id]) => id),
  ),
};

export function headIdForWing(wingId: string): string {
  return WING_HEAD_IDS[wingId] ?? BOSS_ID;
}
