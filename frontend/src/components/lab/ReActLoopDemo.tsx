import { useEffect, useRef, useState } from "react";
import "./ReActLoopDemo.css";

// ---------------------------------------------------------------------------
// 玩具 Tool：模拟"现实世界"。每个 Tool 都有概率失败，用于演示 Observe & 重试。
// ---------------------------------------------------------------------------

type Tool = {
  name: string;
  description: string;
  // 故意让部分 Tool 第一次调用失败 —— 演示 Observe 之后 Agent 如何重试
  run: (callIndex: number) => string;
};

const TOOLS: Tool[] = [
  {
    name: "read_prd",
    description: "读取 PRD 文档内容",
    run: (i) => "PRD v1.3：用户通过手机号 + 短信验证码登录；连续 3 次失败锁定 10 分钟。",
  },
  {
    name: "read_swagger",
    description: "读取接口 Swagger 定义",
    run: (i) => "POST /api/login {phone, code} → 200 {token} / 429 {retry_after}",
  },
  {
    name: "generate_cases",
    description: "根据 PRD + Swagger 生成测试点",
    run: (i) =>
      i === 0
        ? "ERROR: 内部生成器暂不可用（模拟失败）"
        : "✅ 已生成 8 个测试点：\n1. 正常登录\n2. 错误验证码\n3. 验证码过期\n4. 连续 3 次失败锁定\n5. 解锁后正常登录\n6. 空手机号\n7. 空验证码\n8. 重复请求限流",
  },
  {
    name: "playwright_run",
    description: "用 Playwright 跑测试",
    run: (i) =>
      i === 0
        ? "❌ 失败：Login Button Timeout（30s）—— 模拟失败"
        : "✅ 全部 8 个用例通过：耗时 42s，其中 2 个边界用例触发告警。",
  },
  {
    name: "post_report",
    description: "把测试报告写到 GitLab / 企微",
    run: (i) => "📤 已发送：1 个 MR 评论 + 1 条企微通知。任务结束 ✅",
  },
];

// ---------------------------------------------------------------------------
// mock Agent：基于规则的"reason → 选择工具 → 观察 → 再 reason"循环
// ---------------------------------------------------------------------------

type Step = {
  round: number;
  phase: "reason" | "act" | "observe";
  text: string;
  toolName?: string;
  callIndex?: number;
  ok?: boolean;
};

type Scenario = {
  id: string;
  label: string;
  goal: string;
  // 每一步让 LLM 选哪个 Tool（玩具规则：按顺序推进 + 在错误时插入重试）
  plan: { tool: string; reasonHint: string }[];
};

const SCENARIOS: Scenario[] = [
  {
    id: "happy",
    label: "顺利路径（一次性成功）",
    goal: "用 1 轮跑完 4 个工具，无失败",
    plan: [
      { tool: "read_prd", reasonHint: "任务起点：先拿 PRD。" },
      { tool: "read_swagger", reasonHint: "已经拿到 PRD，需要接口定义。" },
      { tool: "generate_cases", reasonHint: "PRD 和 Swagger 都齐了，开始生成测试点。" },
      { tool: "playwright_run", reasonHint: "测试点已生成，跑自动化。" },
      { tool: "post_report", reasonHint: "测试通过，发报告。" },
    ],
  },
  {
    id: "retry",
    label: "Observe 失败 → 重试路径",
    goal: "演示 generate_cases / playwright_run 失败后 Agent 自动重试",
    plan: [
      { tool: "read_prd", reasonHint: "任务起点：先拿 PRD。" },
      { tool: "read_swagger", reasonHint: "拿到 PRD 后拿接口定义。" },
      { tool: "generate_cases", reasonHint: "开始生成测试点（首次可能失败）。" },
      { tool: "generate_cases", reasonHint: "Observe 到上一次失败，重试一次。" },
      { tool: "playwright_run", reasonHint: "测试点已生成，跑自动化（首次可能失败）。" },
      { tool: "playwright_run", reasonHint: "Observe 到失败，重试。" },
      { tool: "post_report", reasonHint: "都通过，发报告。" },
    ],
  },
];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Props = {
  sampleText?: string;
};

export default function ReActLoopDemo({ sampleText = "" }: Props) {
  const [scenarioId, setScenarioId] = useState<string>("retry");
  const [steps, setSteps] = useState<Step[]>([]);
  const [memory, setMemory] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>("就绪");
  const cancelRef = useRef(false);
  // 用 ref 同步记录"每个工具被调用的次数"，避免依赖异步的 setSteps
  const callCountsRef = useRef<Record<string, number>>({});

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  const reset = () => {
    cancelRef.current = true;
    setSteps([]);
    setMemory([]);
    callCountsRef.current = {};
    setStatus("就绪");
    setRunning(false);
  };

  const runFull = async () => {
    cancelRef.current = false;
    setRunning(true);
    setSteps([]);
    setMemory([]);
    callCountsRef.current = {};
    setStatus("Agent 启动...");
    await delay(200);
    await runLoop(scenario.plan);
    setStatus("✅ 任务完成");
    setRunning(false);
  };

  const runLoop = async (plan: { tool: string; reasonHint: string }[]) => {
    let round = 0;
    for (let i = 0; i < plan.length; i++) {
      if (cancelRef.current) return;
      const { tool, reasonHint } = plan[i];
      round += 1;
      const t = TOOLS.find((x) => x.name === tool)!;
      // 同步递增：用 ref 不依赖异步 state
      const prev = callCountsRef.current[tool] ?? 0;
      const callIndex = prev;
      callCountsRef.current[tool] = prev + 1;
      const id = `${Date.now()}-${i}`;

      // ---- Phase 1: Reason ----
      setStatus(`🧠 第 ${round} 轮：思考`);
      pushStep({ round, phase: "reason", text: reasonHint });
      await delay(450);
      if (cancelRef.current) return;

      // ---- Phase 2: Act ----
      setStatus(`🛠  第 ${round} 轮：调用 ${tool}()`);
      pushStep({ round, phase: "act", text: `调用 ${tool}()`, toolName: tool, callIndex });
      await delay(550);
      if (cancelRef.current) return;

      // ---- Phase 3: Observe ----
      const result = t.run(callIndex);
      const ok = !result.startsWith("❌") && !result.startsWith("ERROR");
      setStatus(ok ? `👀 第 ${round} 轮：成功` : `👀 第 ${round} 轮：失败，将重试`);
      pushStep({
        round,
        phase: "observe",
        text: result,
        toolName: tool,
        callIndex,
        ok,
      });

      // 更新 Memory：把 Observe 结果压入上下文
      setMemory((m) => [...m, `[${tool} #${callIndex + 1}] ${result.replace(/\n/g, " ")}`]);

      await delay(550);
      if (cancelRef.current) return;

      // 失败：如果还有"重试位"就在下一次循环继续；这里我们用 plan 预编排已经表达重试
    }
  };

  // 把 step 追加并触发 React 重渲染（用一个微任务封装）
  const pushStep = (s: Step) => {
    setSteps((prev) => [...prev, s]);
  };

  // 旧的 countCalls（基于 steps state）已废弃，改为使用 callCountsRef 同步计数

  // 自动播放当 useEffect 切换场景时清理
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  return (
    <div className="rl-demo">
      <p className="rl-hint">
        演示一个真实 Agent 的循环：<strong>Reason → Act → Observe → Reason → …</strong>。
        每次 Observe 都会更新 Memory；失败时 Agent 会进入下一轮重新规划（重试）。
        点击「自动播放」看完整流程，或先选「顺利路径」观察无失败分支。
        {sampleText.trim() ? "（右侧示例文本不参与本演示）" : ""}
      </p>

      <div className="rl-controls">
        <label className="rl-control">
          <span className="rl-control-label">场景</span>
          <select
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value);
              reset();
            }}
            disabled={running}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <div className="rl-control rl-goal">
          <span className="rl-control-label">任务目标</span>
          <code>{scenario.goal}</code>
        </div>
        <div className="rl-actions">
          <button
            className="rl-btn primary"
            type="button"
            onClick={runFull}
            disabled={running}
          >
            ▶ 自动播放完整循环
          </button>
          <button className="rl-btn ghost" type="button" onClick={reset} disabled={running}>
            重置
          </button>
        </div>
      </div>

      <div className="rl-status" aria-live="polite">
        当前状态：<strong>{status}</strong>
        {steps.length > 0 && (
          <span className="rl-status-meta">
            · 已完成 {steps.filter((s) => s.phase === "observe").length} 次 Observe ·
            Memory 已记录 {memory.length} 条
          </span>
        )}
      </div>

      <div className="rl-grid">
        {/* 左侧：循环步骤流 */}
        <section className="rl-panel" aria-label="Agent 循环步骤">
          <h3 className="rl-panel-title">🌀 ReAct 循环步骤流</h3>
          {steps.length === 0 ? (
            <div className="rl-empty">尚未开始 —— 点击「自动播放」开始一轮真实循环。</div>
          ) : (
            <ol className="rl-step-list">
              {steps.map((s, i) => (
                <li
                  key={i}
                  className={`rl-step rl-step-${s.phase} ${s.ok === false ? "failed" : ""} ${s.ok ? "ok" : ""}`}
                >
                  <div className="rl-step-meta">
                    <span className="rl-step-round">第 {s.round} 轮</span>
                    <span className="rl-step-phase">
                      {s.phase === "reason" && "🧠 Reason"}
                      {s.phase === "act" && "🛠 Act"}
                      {s.phase === "observe" && "👀 Observe"}
                    </span>
                    {s.toolName && (
                      <code className="rl-step-tool">
                        {s.toolName}#{s.callIndex !== undefined ? s.callIndex + 1 : 1}
                      </code>
                    )}
                  </div>
                  <div className="rl-step-text">{s.text}</div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* 右侧：Memory 累加 */}
        <section className="rl-panel" aria-label="Memory 上下文">
          <h3 className="rl-panel-title">🧠 Memory（每轮 Observe 都追加）</h3>
          {memory.length === 0 ? (
            <div className="rl-empty">Context 还是空的 —— 每完成一次 Observe，模型"记得"的事实就多一条。</div>
          ) : (
            <ul className="rl-memory-list">
              {memory.map((m, i) => (
                <li key={i} className="rl-memory-item">
                  <span className="rl-memory-idx">#{i + 1}</span>
                  <span className="rl-memory-text">{m}</span>
                </li>
              ))}
            </ul>
          )}
          {memory.length > 0 && (
            <div className="rl-memory-hint">
              真实场景下，Context 增长到一定规模后，Agent 会做 <strong>总结 / 压缩</strong>，
              或把历史 <strong>写入向量库（RAG）</strong>，按需召回 —— 避免 Context 爆掉。
            </div>
          )}
        </section>
      </div>

      <aside className="rl-lesson-note">
        <strong>本课三个最关键的观察：</strong>
        <ol>
          <li>Agent 不是"一次性回答"，而是 <strong>不断循环 Reason → Act → Observe</strong>。</li>
          <li>失败后 Agent 会<strong>重新规划</strong>，而不是死等 —— 这就是 Observe 的价值。</li>
          <li>
            Memory 是 Agent 的"短期记忆"，<strong>RAG 是长期记忆</strong> —— 上下文爆掉时要靠 RAG 召回。
          </li>
        </ol>
      </aside>
    </div>
  );
}