# Lesson 9：Function Calling（函数调用）与 MCP（工具协议）

> **学习目标：** 弄清 LLM 为什么「什么都做不了」、Function Calling 是什么、MCP 又是什么；理解一次工具调用为什么会经过 LLM 两次；能从「为什么 Tool 要写 description」一路串到 AI 测试 Agent / Cursor Skill / MCP Server 的整体技术栈。
>
> 本课不要求写完整 Agent 框架代码，重点在**心智模型**——把 LLM 与外部世界的关系讲清楚。

---

## 本课目标

- 解释「为什么 LLM 本身什么都做不了」
- 理解 Function Calling 的本质：**LLM 不执行代码，只输出 JSON**
- 掌握一次工具调用为什么通常要走「两次模型」
- 区分 **Function Calling（能力）** 和 **MCP（标准协议）**
- 看懂 Tool 描述（`name` / `description` / `parameters`）为什么要写得清晰
- 串起你后续要学的整套技术栈：Prompt + LLM + Function Calling + MCP + 工具

面向：**AI 应用开发 → AI Agent → AI 工程 → AI 产品**。

---

## 核心概念

### 一、一个 LLM，其实什么都做不了

我们前面学过：LLM 会思考、会生成文字。

但你有没有发现一个问题？

例如我问：

> 现在北京天气怎么样？

普通 LLM 会想：

> "我训练的时候好像知道北京的天气一般是什么样……"

但是它**不知道现在**。

再比如：

> 帮我查询今天公司的 Jira Bug 数量。

它也不知道。

再比如：

> 帮我发微信。

它还是不会。

为什么？

因为 **LLM 没有任何能力接触外部世界**。它只能根据训练数据预测 Token。

所以：

```text
LLM
│
├── 会推理
├── 会写代码
├── 会总结
└── 不会获取实时信息
```

---

### 二、那 ChatGPT 为什么能联网？

答案就是：

> **Function Calling（函数调用）。**

你可以理解成：

> **给 AI 安装各种"超能力插件"。**

例如：

```text
用户
 │
 │ 今天北京天气
 ▼
LLM
 │
 │ 我需要查天气
 ▼
Weather Tool
 │
 │ 返回：28℃
 ▼
LLM
 │
 ▼
今天北京 28℃，多云……
```

注意：

> **天气工具不是 GPT。**
> **GPT 只是决定什么时候调用它。**

---

### 三、Function Calling 的本质

很多人误以为：

> AI 可以自己执行 Python。

不是。

真正流程是：

```text
用户

↓

LLM

↓

生成一个 JSON

↓

程序收到 JSON

↓

程序执行函数

↓

返回结果

↓

LLM 整理答案
```

> **LLM 从头到尾都没有真正执行函数。**

举个最简单的例子。

假设你给模型提供一个工具：

```python
get_weather(city)
```

模型不知道里面怎么实现。

它只知道：

```text
名字：get_weather
参数：city
```

于是用户问：

```text
上海天气
```

模型会生成：

```json
{
  "tool": "get_weather",
  "arguments": {
    "city": "上海"
  }
}
```

它不是在执行。它是在说：

> **「请别人帮我执行这个。」**

程序收到以后：

```python
result = get_weather("上海")
```

返回：

```text
28℃
```

程序再把结果给 GPT：

```text
Tool Result

上海：28℃ 晴天
```

GPT 最后回答：

```text
上海今天 28℃，晴。
```

---

### 四、为什么一定要两次调用模型？

这是很多新人第一次都会疑惑的问题。

完整流程其实是：

```text
第一次

用户

↓

LLM

↓

我要调用工具
```

然后：

```text
程序

↓

执行工具

↓

得到结果
```

然后：

```text
第二次

Tool Result

↓

LLM

↓

生成最终回答
```

为什么？

因为第一次的时候：

> **LLM 根本不知道天气是多少。**
> 它只能说：「去查一下。」

而拿到工具返回的真实数据以后，第二次调用才能基于真实数据组织出最终答案。

这也是为什么：

> **「工具调用」并不是一次模型请求，而是 LLM ↔ 程序 ↔ 工具 ↔ LLM 的多轮往返。**

---

### 五、整个 Agent 都是这样工作的

比如：

> 帮我看看今天有哪些 GitLab MR。

流程：

```text
用户

↓

LLM

↓

调用：get_gitlab_mr()

↓

GitLab API

↓

返回 MR 列表

↓

LLM

↓

总结：今天共有 12 个 MR……
```

---

### 六、再举一个你最熟悉的

你未来要做的测试 Agent。

用户：

```text
根据这个 PRD 生成测试点。
```

LLM 会想：

```text
第一步：读取 PRD。
```

于是：

```text
Tool → read_file()
```

得到：

```text
PRD 内容
```

然后：

```text
LLM
↓
发现：还有接口文档。
```

于是：

```text
Tool → read_api()
```

得到：

```text
Swagger
```

然后：

```text
LLM
↓
生成测试点。
```

所以真正执行的是：

```text
LLM
  ↓
Tool1
  ↓
LLM
  ↓
Tool2
  ↓
LLM
  ↓
Tool3
  ↓
LLM
```

> **这就是 Agent。**

---

### 七、Function Calling 和 MCP 有什么关系？

很多人容易混淆。

实际上：

- **Function Calling** 是一种**能力**——让模型决定「该调用哪个工具」。
- **MCP（Model Context Protocol）** 是一种**标准协议**。

可以类比为 USB：

> USB 不是鼠标，也不是键盘。
> 它只是：**规定怎么连接。**

所以：

```text
Function Calling
  → 调用工具

MCP
  → 规定工具怎么描述、怎么发现、怎么调用
```

换句话说：

| 概念 | 类比 |
|------|------|
| Function Calling | 「鼠标能点击」 |
| MCP | 「USB 接口标准」 |

MCP 让不同厂商的 Tool 可以用**同一套协议**被发现和调用——而不需要为每个工具都重写一遍胶水代码。

---

### 八、一个 Tool 长什么样？

可以把它理解成一份「说明书」。

例如：

```json
{
  "name": "search_user",
  "description": "根据用户名查询用户信息",
  "parameters": {
    "username": "string"
  }
}
```

LLM 看到的不是代码，而是：

> 有一个工具叫 `search_user`，用途是根据用户名查询信息，需要一个 `username` 参数。

当用户说：

> 查询张三。

模型就会决定：

```text
search_user(username="张三")
```

---

### 九、为什么 Tool 要写 description？

这是一个非常关键的点。

模型**不会读你的函数名猜意思**。

例如：

```python
func1()
```

模型不知道这是干什么的。

但如果描述是：

> 根据订单号查询订单状态。

模型就知道什么时候该调用它。

因此，一个好的 Tool 至少要描述：

- 它是做什么的。
- 什么情况下应该调用。
- 参数代表什么。
- 返回什么结果。

> **描述写得越清晰，模型越容易正确选择工具；反之，模型会乱调、漏调、错调。**

这跟 Prompt 工程是同一回事：**给模型的「说明书」要写明白。**

---

### 十、回到你的学习目标

你之前说，你希望以后做：

- AI 测试 Agent
- Cursor Skill
- MCP Server
- AI 工程
- AI 产品

那么可以把整个技术栈串起来了：

```text
用户
  │
  ▼
Prompt（定义任务）
  │
  ▼
LLM（分析、推理）
  │
  ▼
Function Calling（决定调用哪个工具）
  │
  ▼
MCP（统一工具接入方式）
  │
  ▼
各种工具
  ├── GitLab
  ├── Playwright
  ├── Jira / 禅道
  ├── Swagger
  ├── 数据库
  ├── 文件系统
  └── 浏览器
  │
  ▼
工具结果返回
  │
  ▼
LLM 整理、分析并输出最终结果
```

> **这其实就是今天很多 AI Agent（包括 Cursor、Claude Code、OpenAI Codex 等）的核心工作模式。**

---

## 本课总结（牢记 6 句）

1. **LLM 本身不会操作现实世界，它只能推理和生成文本。**
2. **Function Calling 是让 LLM 决定「该调用哪个工具」的机制，而不是让 LLM 自己执行代码。**
3. **工具的执行发生在模型之外，由你的程序或 Agent 框架完成。**
4. **一次工具调用通常包含两个阶段：先决定调用工具，再根据工具返回结果生成最终回答。**
5. **MCP 不是工具，而是连接和描述工具的一套标准协议。**
6. **Agent 本质上就是：LLM + Prompt + Tool + 多轮推理（Reasoning）+ 工作流。**

---

## 下一课预告

下一节会把你现在学到的 Prompt、Function Calling、MCP 串成一个完整闭环：

> **Agent 是如何一步一步思考（Reasoning）并自主完成复杂任务的？**

也是理解为什么 Cursor、Claude Code、OpenAI Codex 能连续完成几十步任务的关键。