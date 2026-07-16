"""Lesson 9 配套示例：用纯 Python 演示一次完整的 Function Calling 往返。

本课关键心智模型：
    1. LLM 不执行代码 —— 第一次调用只生成 JSON。
    2. 工具的 description 写得越清晰，模型越容易选对。
    3. 一次工具调用 = 两次模型往返（决定调用 + 拿到 Tool Result 再总结）。

运行：
    python "D:\\develop\\AI-Brain\\examples\\lesson09_function_calling.py"
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass


# ---------------------------------------------------------------------------
# 1. Tool 定义：本质是"说明书"，告诉模型"我叫什么、干什么、需要什么参数"
# ---------------------------------------------------------------------------


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict  # {"city": "string", ...}
    run: callable


def _get_weather(args: dict) -> str:
    presets = {
        "上海": "28℃ 晴",
        "北京": "31℃ 多云",
        "深圳": "30℃ 阵雨",
    }
    return presets.get(args["city"], f"23℃ 晴（模拟数据：{args['city']}）")


def _get_gitlab_mr(_: dict) -> str:
    return "今天共有 12 个 MR：3 个紧急、5 个待 review、4 个已通过。"


TOOLS: list[Tool] = [
    Tool(
        name="get_weather",
        description="查询指定城市的实时天气（温度、天气状况、风向）",
        parameters={"city": "string"},
        run=_get_weather,
    ),
    Tool(
        name="get_gitlab_mr",
        description="查询今天需要 review 的 GitLab Merge Request 列表",
        parameters={},
        run=_get_gitlab_mr,
    ),
]


def tool_spec_for_llm() -> list[dict]:
    """把 Tool 列表转成 LLM 看到的"说明书" JSON。"""
    return [
        {
            "name": t.name,
            "description": t.description,
            "parameters": {
                k: {"type": v, "required": True} for k, v in t.parameters.items()
            },
        }
        for t in TOOLS
    ]


# ---------------------------------------------------------------------------
# 2. mock LLM：这里用规则"假装"是模型在决策
#    —— 真实世界里这一步就是调用 GPT / Claude / 火山方舟 等。
# ---------------------------------------------------------------------------


def mock_llm_plan(user_question: str, tools: list[Tool]) -> dict:
    """第一次调用：让 LLM 决定调哪个工具。"""
    q = user_question.strip()
    city = re.search(r"(北京|上海|深圳|杭州|广州|成都)", q)
    if "天气" in q and city:
        return {
            "tool": "get_weather",
            "arguments": {"city": city.group(1)},
        }
    if "MR" in q or "merge" in q.lower() or "review" in q.lower():
        return {"tool": "get_gitlab_mr", "arguments": {}}
    # 默认：让模型"拒答"，演示 description 不清楚时模型会怎么表现
    return {
        "refusal": "我无法确定该用哪个工具，请把问题描述得更具体（包含城市 / 文件名 / 动作动词）。",
    }


def mock_llm_finalize(user_question: str, tool_name: str, tool_result: str) -> str:
    """第二次调用：拿到 Tool Result 后，组织最终人话。"""
    if tool_name == "get_weather":
        m = re.search(r"(北京|上海|深圳|杭州|广州|成都)", user_question)
        city = m.group(1) if m else "目标城市"
        return f"{city}今天 {tool_result}。"
    if tool_name == "get_gitlab_mr":
        return f"今天的 MR 情况：{tool_result}"
    return f"工具返回：{tool_result}"


# ---------------------------------------------------------------------------
# 3. 完整流程：用户 → LLM(①) → JSON → 程序执行工具 → LLM(②) → 答案
# ---------------------------------------------------------------------------


def run_agent(user_question: str) -> None:
    print("=" * 60)
    print(f"👤 用户：{user_question}\n")

    # ---- 第一次调用 LLM：决定要不要调工具、调哪个 ----
    print("🧠 LLM 第一次调用 —— 决定调哪个工具")
    spec = tool_spec_for_llm()
    print("  LLM 看到的工具说明书：")
    print(json.dumps(spec, ensure_ascii=False, indent=4))
    plan = mock_llm_plan(user_question, TOOLS)
    print("\n  LLM 输出的 JSON：")
    print(f"  {json.dumps(plan, ensure_ascii=False)}\n")

    if "refusal" in plan:
        print(f"🤖 最终答案（模型拒答）：{plan['refusal']}")
        return

    # ---- 程序执行工具（不是 LLM 在执行） ----
    tool_name = plan["tool"]
    tool_args = plan["arguments"]
    tool = next(t for t in TOOLS if t.name == tool_name)
    print(f"🛠  程序执行工具：{tool_name}({tool_args})")
    tool_result = tool.run(tool_args)
    print(f"  Tool Result：{tool_result}\n")

    # ---- 第二次调用 LLM：拿到 Tool Result 再生成最终答案 ----
    print("🧠 LLM 第二次调用 —— 拿到工具结果后组织最终答案")
    final = mock_llm_finalize(user_question, tool_name, tool_result)
    print(f"🤖 最终答案：{final}\n")


def main() -> None:
    print("Lesson 9 · Function Calling 完整往返演示\n")
    run_agent("上海今天天气怎么样？")
    run_agent("帮我看看今天的 MR")
    run_agent("嗯")  # 演示模型拒答


if __name__ == "__main__":
    main()