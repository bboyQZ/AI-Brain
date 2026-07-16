"""Lesson 10 配套示例：用纯 Python 演示一个真实的 ReAct 循环。

本课关键心智模型：
    1. Agent = Reason → Act → Observe → Reason → ... 的循环。
    2. Planning 是 LLM 自己生成的（这里用 mock 规则代替真实模型决策）。
    3. Observe 失败时，Agent 不会停 —— 它会进入下一轮重新规划（重试）。
    4. Memory（Context）每轮 Observe 之后追加。

运行：
    python "D:\\develop\\AI-Brain\\examples\\lesson10_react_loop.py"
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# 1. 玩具 Tool：部分 Tool 第一次调用会失败 —— 演示 Observe & 重试。
# ---------------------------------------------------------------------------


@dataclass
class Tool:
    name: str
    description: str
    # call_index 从 0 开始；某些 Tool 用它来"故意失败"一次
    run: callable


def _read_prd(_: int) -> str:
    return "PRD v1.3：用户通过手机号 + 短信验证码登录；连续 3 次失败锁定 10 分钟。"


def _read_swagger(_: int) -> str:
    return "POST /api/login {phone, code} → 200 {token} / 429 {retry_after}"


def _generate_cases(i: int) -> str:
    if i == 0:
        return "ERROR: 内部生成器暂不可用（模拟失败）"
    return (
        "✅ 已生成 8 个测试点：\n"
        "1. 正常登录\n2. 错误验证码\n3. 验证码过期\n4. 连续 3 次失败锁定\n"
        "5. 解锁后正常登录\n6. 空手机号\n7. 空验证码\n8. 重复请求限流"
    )


def _playwright_run(i: int) -> str:
    if i == 0:
        return "❌ 失败：Login Button Timeout（30s）—— 模拟失败"
    return "✅ 全部 8 个用例通过：耗时 42s，其中 2 个边界用例触发告警。"


def _post_report(_: int) -> str:
    return "📤 已发送：1 个 MR 评论 + 1 条企微通知。任务结束 ✅"


TOOLS = {
    "read_prd": Tool("read_prd", "读取 PRD 文档", _read_prd),
    "read_swagger": Tool("read_swagger", "读取接口 Swagger 定义", _read_swagger),
    "generate_cases": Tool("generate_cases", "生成测试点", _generate_cases),
    "playwright_run": Tool("playwright_run", "跑自动化", _playwright_run),
    "post_report": Tool("post_report", "发报告", _post_report),
}


# ---------------------------------------------------------------------------
# 2. 预编排的"plan"：真实 Agent 这里由 LLM 自己生成；
#    为了可演示，我们把 Plan 写死为一个 Python 列表（包含 1 次重试）。
# ---------------------------------------------------------------------------

PLAN = [
    ("read_prd",       "任务起点：先拿 PRD。"),
    ("read_swagger",   "拿到 PRD 后拿接口定义。"),
    ("generate_cases", "开始生成测试点（首次可能失败）。"),
    ("generate_cases", "Observe 到上一次失败，重试一次。"),
    ("playwright_run", "测试点已生成，跑自动化（首次可能失败）。"),
    ("playwright_run", "Observe 到失败，重试。"),
    ("post_report",    "都通过，发报告。"),
]


# ---------------------------------------------------------------------------
# 3. Agent Loop
# ---------------------------------------------------------------------------


@dataclass
class Step:
    round: int
    phase: str  # reason / act / observe
    text: str
    tool: str | None = None
    ok: bool | None = None


@dataclass
class AgentState:
    steps: list[Step] = field(default_factory=list)
    memory: list[str] = field(default_factory=list)
    tool_call_count: dict[str, int] = field(default_factory=dict)

    def call_index(self, name: str) -> int:
        idx = self.tool_call_count.get(name, 0)
        self.tool_call_count[name] = idx + 1
        return idx


def run_agent(plan: list[tuple[str, str]]) -> None:
    state = AgentState()
    print("=" * 64)
    print("🤖 Agent 启动 —— 进入 ReAct 循环\n")
    time.sleep(0.3)

    for i, (tool_name, reason_hint) in enumerate(plan, 1):
        # ---- Phase 1: Reason ----
        state.steps.append(Step(round=i, phase="reason", text=reason_hint))
        print(f"🧠 第 {i} 轮 · Reason   ：{reason_hint}")
        time.sleep(0.2)

        # ---- Phase 2: Act ----
        call_index = state.call_index(tool_name)
        tool = TOOLS[tool_name]
        state.steps.append(Step(
            round=i, phase="act",
            text=f"调用 {tool_name}()", tool=tool_name,
        ))
        print(f"🛠  第 {i} 轮 · Act      ：调用 {tool_name}()  (第 {call_index + 1} 次)")
        time.sleep(0.3)

        # ---- Phase 3: Observe ----
        result = tool.run(call_index)
        ok = not (result.startswith("❌") or result.startswith("ERROR"))
        state.steps.append(Step(
            round=i, phase="observe",
            text=result, tool=tool_name, ok=ok,
        ))
        state.memory.append(f"[{tool_name}#{call_index + 1}] {result.splitlines()[0]}")

        marker = "✅" if ok else "⚠️ "
        print(f"👀 第 {i} 轮 · Observe  ：{marker} {result.splitlines()[0]}")
        if not ok and "\n" in result:
            print(f"                  ↳  Agent 不会停 → 下一轮 Reason 重新规划")
        print(f"🧠 Memory 累计 {len(state.memory)} 条：{state.memory[-1]}\n")
        time.sleep(0.2)

    print("=" * 64)
    print("✅ 任务完成\n")

    # ---- 简单复盘 ----
    print("📊 复盘：")
    reasons = sum(1 for s in state.steps if s.phase == "reason")
    acts = sum(1 for s in state.steps if s.phase == "act")
    observes = sum(1 for s in state.steps if s.phase == "observe")
    failures = sum(1 for s in state.steps if s.phase == "observe" and s.ok is False)
    print(f"   - Reason 次数：{reasons}")
    print(f"   - Act 次数   ：{acts}")
    print(f"   - Observe 次数：{observes}")
    print(f"   - 失败 Observe：{failures}（每次失败都触发了下一轮 Reason 重新规划）")
    print(f"   - Memory 条数：{len(state.memory)} 条")
    print()


def main() -> None:
    print("Lesson 10 · ReAct 完整循环演示\n")
    run_agent(PLAN)


if __name__ == "__main__":
    main()