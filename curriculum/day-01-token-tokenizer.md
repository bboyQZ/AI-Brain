# Day 1：Token 与 Tokenizer

## 今日目标

理解 LLM 为什么不是处理「文字」，而是处理 **Token**。

---

## 核心概念

### Token

- Token 是模型处理文本的**基本单位**。
- Token **不等于**一个汉字，也**不等于**一个单词。
- Token 是由 **Tokenizer** 切分得到的。

**举例：**

| 文本 | 可能的切分方式（因模型而异） |
|------|------------------------------|
| `Hello` | 可能 1 个 Token |
| `你好` | 可能 1～2 个 Token |
| `ChatGPT` | 可能被切成 `Chat` + `GPT` |
| `人工智能` | 中文往往比英文「更费 Token」 |

同一段文字，不同模型的 Token 数量可能不同——这就是为什么不能简单用「字数」估算成本。

### Tokenizer

Tokenizer 的作用是把文本变成模型能理解的数字序列：

```
文本 → Token → Token ID
```

模型最终接收到的是**一串数字**（Token ID），而不是原始文字。

```
"你好"  →  [你, 好]  →  [872, 196]   （示例 ID，非真实值）
```

每个模型都有自己的词表（Vocabulary）；同一个字/词在不同模型里可能对应不同的 ID。

---

## 为什么按 Token 收费？

因为模型真正计算的是 Token，而不是字符或字数。

Token 越多：

- GPU 计算越多
- 推理时间越长
- 成本越高

**常见计费维度：**

- **Input Tokens**：你发给模型的内容（Prompt、文档、历史对话）
- **Output Tokens**：模型生成的回复

在 API 账单里看到的 `prompt_tokens` / `completion_tokens`，指的就是这两类。

---

## 与工作的联系

在 AI Agent 中，所有输入（PRD、代码、知识库、工具返回结果等）都会先转换为 Token。

如果 Token 超过 **Context Window**（上下文窗口），就需要：

| 策略 | 说明 |
|------|------|
| **Chunk（切块）** | 把长文档切成小段，分批处理或检索 |
| **RAG 检索** | 只把与问题相关的片段塞进上下文 |
| **总结压缩** | 用模型先摘要，再喂给下游任务 |

Context Window 的单位也是 Token，不是字符。例如「128K 上下文」≈ 最多容纳约 12 万多个 Token（中英文比例不同，实际能放的「字数」会有差异）。

---

## 动手练习（可选）

在项目根目录执行：

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
python ".\examples\day01_tokenize.py"
```

观察同一段中英文、代码、标点，Token 数量有何不同。

---

## 今日总结

> LLM 真正处理的是 **Token**，而 Token 是由 **Tokenizer** 决定的。

因此理解 Token 是学习 **Prompt、RAG、Agent 和上下文管理** 的基础。后续每一天都会在这个认知上继续搭建。

---

## 延伸阅读

- [OpenAI Tokenizer 可视化工具](https://platform.openai.com/tokenizer)
- 各模型文档中的 Context Length / Pricing 章节
