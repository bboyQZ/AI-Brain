import { useState } from "react";
import "./FunctionCallingDemo.css";

type Tool = {
  name: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  // 玩具执行：返回字符串
  run: (args: Record<string, string>) => string;
};

const TOOLS: Tool[] = [
  {
    name: "get_weather",
    description: "查询指定城市的实时天气（温度、天气状况、风向）",
    parameters: [{ name: "city", type: "string", required: true }],
    run: ({ city }) => {
      const presets: Record<string, string> = {
        上海: "28℃ 晴 东南风 3 级",
        北京: "31℃ 多云 东北风 2 级",
        深圳: "30℃ 阵雨 偏南风 2 级",
        杭州: "27℃ 阴 微风",
      };
      return presets[city] ?? `23℃ 晴（模拟数据：${city}）`;
    },
  },
  {
    name: "get_gitlab_mr",
    description: "查询今天需要我 review 的 GitLab Merge Request 列表",
    parameters: [],
    run: () => "今天共有 12 个 MR：其中 3 个紧急、5 个待 review、4 个已通过。",
  },
  {
    name: "read_file",
    description: "读取工作区中的文件内容（仅支持 .md / .txt / .json）",
    parameters: [{ name: "path", type: "string", required: true }],
    run: ({ path }) => `【${path} 片段】\nPRD v1.3 ……（模拟文件内容）`,
  },
  {
    name: "send_wechat",
    description: "给指定用户发送微信消息（需要先获得授权）",
    parameters: [
      { name: "to_user", type: "string", required: true },
      { name: "message", type: "string", required: true },
    ],
    run: ({ to_user, message }) => `已发送给 ${to_user}：「${message}」`,
  },
];

// 把"用户问题"映射到"模型应该生成哪个 Tool 调用"的玩具规则
// —— 真实世界里这是 LLM 自己推理的，这里只是 mock。
function mockModelPlan(
  userQuestion: string,
  tools: Tool[],
): { tool: string; arguments: Record<string, string> } | { refusal: string } {
  const q = userQuestion.trim();
  if (!q) return { refusal: "（用户没说话，模型也不会调用工具）" };

  // 故意做几个有"教学价值"的失败案例
  if (q.includes("你好") || q.includes("hello")) {
    return { refusal: "这个问题不需要工具，我直接回答即可。" };
  }

  // 天气
  const cityMatch = q.match(/(北京|上海|深圳|杭州|广州|成都)/);
  if (q.includes("天气") && cityMatch) {
    return { tool: "get_weather", arguments: { city: cityMatch[1] } };
  }

  // GitLab MR
  if (q.includes("MR") || q.includes("merge") || q.includes("review")) {
    return { tool: "get_gitlab_mr", arguments: {} };
  }

  // 文件读取
  const fileMatch = q.match(/[\w\-_/]+\.(md|txt|json)/);
  if (q.includes("读取") || q.includes("打开") || q.includes("看一下")) {
    if (fileMatch) {
      return { tool: "read_file", arguments: { path: fileMatch[0] } };
    }
  }

  // 微信
  if (q.includes("微信") || q.includes("发消息")) {
    const to = q.match(/发给\s*([\u4e00-\u9fa5A-Za-z0-9_]+)/)?.[1] ?? "老板";
    const msg = q.split(/说[:：]?\s*/)[1] ?? "收到请回复";
    return { tool: "send_wechat", arguments: { to_user: to, message: msg } };
  }

  // 默认：选择描述里第一个关键词匹配的工具（演示"模型可能选错"）
  return {
    refusal: `我无法确定该用哪个工具（共 ${tools.length} 个可选）。建议把问题描述得更具体，例如：包含城市名 / 文件名 / 明确的动作动词。`,
  };
}

type Props = {
  sampleText?: string;
};

export default function FunctionCallingDemo({ sampleText = "" }: Props) {
  const [question, setQuestion] = useState("上海今天天气怎么样？");
  const [round1Out, setRound1Out] = useState<
    | { kind: "tool"; tool: string; arguments: Record<string, string> }
    | { kind: "refusal"; message: string }
    | null
  >(null);
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [round2Answer, setRound2Answer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTool = round1Out?.kind === "tool"
    ? TOOLS.find((t) => t.name === round1Out.tool) ?? null
    : null;

  const runRound1 = () => {
    setError(null);
    setToolResult(null);
    setRound2Answer(null);
    const plan = mockModelPlan(question, TOOLS);
    if ("refusal" in plan) {
      setRound1Out({ kind: "refusal", message: plan.refusal });
    } else {
      setRound1Out({ kind: "tool", tool: plan.tool, arguments: plan.arguments });
    }
  };

  const runTool = () => {
    if (round1Out?.kind !== "tool" || !selectedTool) return;
    setError(null);
    try {
      const result = selectedTool.run(round1Out.arguments);
      setToolResult(result);
      // 模拟第二次模型调用：把工具结果拼成一句人话
      const finalAnswer =
        selectedTool.name === "get_weather"
          ? `根据工具返回：${round1Out.arguments.city ?? "该城市"}今天 ${result}。`
          : selectedTool.name === "get_gitlab_mr"
            ? `已查到今天的 MR 情况：${result}`
            : selectedTool.name === "read_file"
              ? `文件已读取，关键内容：${result.split("\n").slice(-1)[0]}`
              : selectedTool.name === "send_wechat"
                ? `${result}（发送已排队）`
                : `工具返回：${result}`;
      setRound2Answer(finalAnswer);
    } catch (e) {
      setError(`工具执行失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const reset = () => {
    setRound1Out(null);
    setToolResult(null);
    setRound2Answer(null);
    setError(null);
  };

  return (
    <div className="fc-demo">
      <p className="fc-hint">
        左侧输入用户问题 → 第一次模型调用只生成 JSON → 程序执行工具 →
        第二次模型调用拿到 Tool Result 再组织最终答案。
        {sampleText.trim() ? "（右侧示例文本不会注入本演示，避免误导）" : ""}
      </p>

      {/* Tool 说明书：让用户看到模型"看到"什么 */}
      <details className="fc-tools-spec" open>
        <summary>📦 当前会话注册的工具说明书（{TOOLS.length} 个 Tool）</summary>
        <div className="fc-tools-grid">
          {TOOLS.map((t) => (
            <div key={t.name} className="fc-tool-card">
              <div className="fc-tool-name">{t.name}</div>
              <div className="fc-tool-desc">{t.description}</div>
              <div className="fc-tool-params">
                参数：
                {t.parameters.length === 0
                  ? "（无）"
                  : t.parameters
                      .map((p) => `${p.name}: ${p.type}${p.required ? "*" : ""}`)
                      .join(", ")}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Round 0：用户问题 */}
      <section className="fc-round">
        <div className="fc-round-tag fc-tag-user">👤 用户</div>
        <textarea
          className="fc-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="例如：上海今天天气怎么样？ / 帮我看看今天的 MR / 读一下 PRD.md"
        />
        <div className="fc-actions">
          <button className="fc-btn primary" type="button" onClick={runRound1}>
            ① 第一次调用 LLM（让它决定调哪个工具）
          </button>
          {(round1Out || toolResult) && (
            <button className="fc-btn ghost" type="button" onClick={reset}>
              重置
            </button>
          )}
        </div>
      </section>

      {/* Round 1：模型输出 JSON */}
      {round1Out && (
        <section className="fc-round">
          <div className="fc-round-tag fc-tag-llm">🧠 LLM（第一次）</div>
          <p className="fc-round-text">
            模型不会执行函数，只会输出 JSON（或直接拒答）：
          </p>
          {round1Out.kind === "tool" ? (
            <pre className="fc-json">
{`{
  "tool": "${round1Out.tool}",
  "arguments": ${JSON.stringify(round1Out.arguments, null, 2)}
}`}
            </pre>
          ) : (
            <pre className="fc-json fc-json-refusal">
{`{
  "refusal": "${round1Out.message}"
}`}
            </pre>
          )}
          {round1Out.kind === "tool" && (
            <button className="fc-btn primary" type="button" onClick={runTool}>
              ② 程序执行工具（{round1Out.tool}）
            </button>
          )}
        </section>
      )}

      {/* Round 2：工具执行 → Tool Result */}
      {toolResult !== null && selectedTool && round1Out?.kind === "tool" && (
        <section className="fc-round">
          <div className="fc-round-tag fc-tag-tool">🛠 工具执行</div>
          <p className="fc-round-text">
            程序把 JSON 解析后真正执行了 <code>{selectedTool.name}</code>，拿到结果：
          </p>
          <pre className="fc-json fc-json-result">
{`Tool Result
────────────
${toolResult}`}
          </pre>
        </section>
      )}

      {/* Round 3：第二次模型 */}
      {round2Answer && (
        <section className="fc-round">
          <div className="fc-round-tag fc-tag-llm">🧠 LLM（第二次）</div>
          <p className="fc-round-text">
            第二次调用 LLM，把 Tool Result 喂回去，让它组织最终答案：
          </p>
          <div className="fc-final">{round2Answer}</div>
          <p className="fc-flow-summary">
            完整链路：<code>用户 → LLM（JSON）→ 程序执行工具 → Tool Result → LLM（最终答案）</code>
          </p>
        </section>
      )}

      {error && <div className="fc-error">{error}</div>}

      {/* 教学小结 */}
      <aside className="fc-lesson-note">
        <strong>本课三个最关键的心智模型：</strong>
        <ol>
          <li>LLM 不执行代码 —— 第一次调用只生成 JSON。</li>
          <li>工具描述（description）写得越清晰，模型越容易选对。</li>
          <li>
            一次工具调用 = <strong>两次</strong>模型往返；没有第二次，模型拿不到真实数据。
          </li>
        </ol>
      </aside>
    </div>
  );
}