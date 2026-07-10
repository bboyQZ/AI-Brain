# Lesson 8：Prompt 为什么能够控制 AI？

> **学习目标：** 理解 Prompt 不是「写一句话」，而是改变模型预测下一个 Token 的概率分布；掌握 System / Developer / User Prompt 的工程组成，为 Agent 与 Function Calling 打基础。

---

## 本课目标

- 从 Next Token Prediction 视角解释「Prompt 为什么有效」
- 把 Prompt 与 Hidden State、LM Head 串起来
- 认识 AI 工程里真正会写的多层 Prompt
- 理解 Agent 为何高度依赖 Prompt 设计

本课不深入模型训练数学，面向：**AI 应用开发 → AI Agent → AI 工程 → AI 产品**。

---

## 核心概念

### 一、很多人以为 Prompt 是「写一句话」

实际上，对 GPT 来说，Prompt 更接近：

> **程序。**

它不是操作系统意义上的命令，而是一段会进入模型上下文、持续影响后续生成的文本。

---

### 二、同一个问题，不同 Prompt，输出完全不同

假设输入：

```text
原神是什么游戏？
```

模型内部大致看到的是：

```text
User:
原神是什么游戏？
```

然后继续预测：

```text
Assistant:
原神是一款...
```

它只是在**继续生成文本**。

换一个 Prompt：

```text
你是一名游戏策划。

回答必须：

1. 不超过100字
2. 用表格
3. 最后给评分
4. 不允许废话

问题：

原神是什么游戏？
```

输出可能变成：

```text
| 类型 | 开放世界ARPG |
|------|--------------|
| 公司 | 米哈游 |

评分：9.2
```

模型不是突然「学会写表格」，而是：

> **Prompt 改变了后续 Token 的概率分布。**

---

### 三、GPT 每一步都在干什么？

假设已经生成：

```text
原神是一款
```

下一步其实是在预测候选词，例如：

| 候选 | 示意概率 |
|------|----------|
| 开放世界 | 42% |
| 动作角色扮演 | 35% |
| 手机游戏 | 8% |
| … | … |

Prompt 会不断影响这些概率。

所以：

- Prompt **不是**命令
- Prompt **是**：不断修改模型预测下一个 Token 的概率

---

### 四、最简单的对比：同一个 `1+1=`

| Prompt | 模型倾向输出（示意） |
|--------|----------------------|
| 你是一名数学老师。 | `2` |
| 你是一名诗人。 | `一加一，是两颗心靠近。` |
| 你是一名 Python 解释器。 | `>>> 1+1` / `2` |

模型权重没变。变的是：

> **Transformer 算出的 Hidden State 不一样 → LM Head 给出的概率完全不同。**

---

### 五、Prompt 在 Transformer 里发生了什么？

回顾流水线：

```text
Token → Embedding → Transformer → Hidden State → LM Head → Next Token
```

加上 Prompt 后：

```text
Prompt
  → Tokenizer
  → Embedding
  → Transformer
  → Hidden State（被 Prompt 影响）
  → LM Head
  → 输出
```

真正被改变的是 **Hidden State**。

举例：

- Prompt「你是一名律师。」→ 上下文偏向：法律、合同、条例、专业、严谨
- Prompt「你是一名幼儿园老师。」→ 上下文偏向：简单、儿童、比喻、鼓励

LM Head 自然会预测出完全不同的下一 Token。

---

### 六、所以 Prompt 为什么有效？

一句话：

> **Prompt 提供了额外上下文，而 Transformer 天生就是利用上下文来预测下一个 Token。**

因此：

| 常见误解 | 更准确的说法 |
|----------|--------------|
| Prompt = 指令 | Prompt = **Context（上下文）** |
| 模型「听懂了命令」 | 模型在整段上下文下重算 Hidden State，从而改变概率 |

---

### 七、Prompt 的真正组成（AI 工程最重要）

做 Agent 时，几乎每天都会写下面几层：

```text
System Prompt
        ↓
Developer Prompt
        ↓
User Prompt
        ↓
Tool Result
        ↓
Assistant
```

很多人只知道 User Prompt。实际 AI 产品几乎都是：

```text
System Prompt + Developer Prompt + User Prompt
```

共同作用。

例如 ChatGPT 真正发给模型的内容可能类似：

```text
System
你是 ChatGPT。
必须遵守安全策略。

---------

Developer
回答尽量简洁。
如果用户问代码：优先 Python。

---------

User
写一个贪吃蛇。
```

模型看到的是**全部上下文**，不是只有用户最后一句话。

---

### 八、为什么 Agent 更依赖 Prompt？

例如测试 Agent 的 Prompt：

```text
你是一名拥有10年经验的软件测试工程师。

你的任务：
阅读 PRD。
生成测试点。

要求：
覆盖边界。
覆盖异常。
覆盖权限。
输出 Markdown。
不要遗漏接口测试。
```

模型看起来「变成了测试工程师」。其实不是人格切换，而是：

> Prompt 把推理空间限制在「测试」上下文中，使相关知识更容易被激活。

Agent 的核心能力，很大程度上来自 **Prompt 设计**，而不仅仅是模型本身。

---

## 本课总结（牢记 6 句）

1. **Prompt 本质上是上下文（Context），不是命令。**
2. **Transformer 会利用整个上下文来预测下一个 Token。**
3. **Prompt 会改变 Hidden State。**
4. **Hidden State 改变后，LM Head 输出的概率分布也会改变。**
5. **System Prompt、Developer Prompt、User Prompt 会共同决定模型行为。**
6. **AI Agent 的核心能力，很大程度上来自 Prompt 设计，而不仅仅是模型本身。**

---

## 下一课预告

下一课进入真正的 AI 工程核心：

> **Function Calling（工具调用）**

这是 Agent 与普通聊天模型最大的区别：为什么模型能联网、读文件、调用 MCP、执行代码，而不仅仅是「聊天」。也是后续学习 LangChain、RAG、MCP、Agent 框架时最重要的基础之一。
