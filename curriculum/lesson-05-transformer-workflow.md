# Lesson 5：Transformer 工作流程（AI 应用开发版）

> **学习目标：** 理解 LLM 是如何理解一句话的——不深入模型训练和数学推导，以 AI Engineer / AI Agent 开发所需知识为主。

---

## 本课目标

把 Lesson 1～4 的知识点串成**完整流水线**，并补齐 Position Encoding、Hidden State、LM Head 和逐 Token 生成机制。

---

## 一、完整的数据流

当用户输入一句话时，大模型内部会经历下面的流程：

```text
用户输入
    │
    ▼
Tokenizer（分词）
    │
    ▼
Token ID
    │
    ▼
Embedding（查词向量）
    │
    ▼
Position Encoding（加入位置信息）
    │
    ▼
Transformer（理解上下文）
    │
    ▼
Hidden State（上下文表示）
    │
    ▼
LM Head
    │
    ▼
预测下一个 Token
    │
    ▼
生成回复（循环执行）
```

整个流程可以分成两个阶段：

| 阶段 | 组件 | 职责 |
|------|------|------|
| **理解（Understanding）** | Transformer | 结合上下文生成语义表示 |
| **生成（Generation）** | LM Head + Next Token Prediction | 预测并输出下一个 Token |

---

## 二、Tokenizer

LLM 不认识文字，只认识 Token。

例如输入「原神是什么类型的游戏」，Tokenizer（实际切分由模型决定）可能变成：

```
原神 / 是 / 什么 / 类型 / 的 / 游戏
```

然后转换成 Token ID（示意）：

```
72831 / 105 / 2381 / 8402 / 26 / 10293
```

> Token ID 只是编号，没有任何语义。

---

## 三、Embedding（静态词向量）

每个 Token ID 查询 **Embedding Table**：

```
72831（原神）→ [0.2, 0.5, -0.1, ...]
```

Embedding 可以理解为：**给每个 Token 一个固定的语义坐标**。

「苹果」无论出现在「苹果很好吃」还是「苹果发布了新手机」，**Embedding 都完全一样**——因为它是固定查表，不会根据上下文变化。

---

## 四、Position Encoding（位置编码）

Embedding **不知道顺序**。

「猫 咬 狗」和「狗 咬 猫」，如果没有位置编码，模型只知道有「猫、狗、咬」，却不知道谁在前谁在后。

因此每个位置有一个 **Position Vector**：

```
最终输入向量 = Embedding + Position
```

Position 的作用：**告诉模型每个 Token 在句子中的位置**。

---

## 五、Transformer（理解上下文）

这是整个模型最重要的一步。

Transformer 并不是「寻找最相近的 Embedding」，而是所有 Token **互相交流（Self-Attention）**。

例如「原神 是 什么 类型 的 游戏」，当模型处理「类型」时，会重点关注「原神」「游戏」；同时「原神」也会关注「游戏」「类型」「什么」。

> **每一个 Token 都会根据整句上下文重新理解自己。**

---

## 六、Hidden State（上下文向量）

常见误解：Transformer 会修改 Embedding 表。

**实际上不会。** Embedding 表始终不变；Transformer 不断生成**新的向量**：

```
Embedding → Layer1 → 新向量① → Layer2 → 新向量② → ... → 最终输出
```

这些新向量叫 **Hidden State（隐藏状态 / 上下文表示）**。

| 阶段 | 「苹果」的含义 |
|------|----------------|
| Embedding | 普通「苹果」 |
| Hidden State（苹果很好吃） | 水果 🍎 |
| Hidden State（苹果发布了新手机） | Apple 公司 📱 |

**同一个 Token，在不同上下文中，最终 Hidden State 完全不同。**

---

## 七、Transformer 的本质

Transformer 并不是「找最相近的向量」，而是：

```
所有 Token → 互相 Attention → 融合上下文 → 生成新的语义表示
```

| 概念 | 含义 |
|------|------|
| **Embedding** | 静态词义 |
| **Hidden State** | 动态上下文语义 |

---

## 八、LM Head 是什么？

Transformer 理解完成后，得到最后一个 Token 的 Hidden State（例如 4096 维向量）。

**LM Head** 把它映射到**整个词表**（例如 15 万个 Token），得到每个 Token 的分数——**Logits**：

```
Token1:  8.2
Token2: -1.3
Token3: 15.8
...
```

经 **Softmax** 转换成概率，模型选择概率最大的 Token 作为输出。

---

## 九、Vocabulary（词表）

每个模型都有一张固定的 Vocabulary：

```
Token00001 → 我
Token00002 → 你
Token00003 → 苹果
...
Token150000 → ...
```

词表一旦确定，Embedding 表大小也随之固定。不同模型词表大小不同（仅供参考）：

| 模型 | Vocabulary 大小 |
|------|------------------|
| GPT-2 | ≈ 50K |
| Llama 系列 | ≈ 128K |
| Qwen 系列 | ≈ 150K |

---

## 十、为什么不是「找最近的向量回答」

很多人第一次会误解：

```
Transformer → 找最近向量 → 输出答案   ❌
```

真正流程：

```
Transformer → Hidden State → LM Head → 计算词表每个 Token 的概率 → 选概率最大的
```

| 组件 | 任务 |
|------|------|
| **Transformer** | 理解 |
| **LM Head** | 预测下一个 Token |

两者职责不同。

---

## 十一、GPT 如何生成整句话？

GPT **不会**先想好完整答案再输出，而是**逐 Token 生成**。

用户输入：`原神是什么类型的游戏`

```
第 1 次预测 → 《     → 输入变为：原神是什么类型的游戏《
第 2 次预测 → 原神   → 输入变为：原神是什么类型的游戏《原神
第 3 次预测 → 》     → ...
第 4 次预测 → 是
第 5 次预测 → 一款
第 6 次预测 → 开放世界
...
```

整个回答，就是一个 Token 一个 Token 生成出来的。

---

## 十二、本阶段需要掌握的重点

对于 AI 应用开发，不需要深入研究模型训练。掌握以下即可：

- ✅ Token / Tokenizer / Token ID
- ✅ Embedding（静态词向量）
- ✅ Position Encoding（位置编码）
- ✅ Transformer（理解上下文）
- ✅ Hidden State（上下文表示）
- ✅ LM Head（预测下一个 Token）
- ✅ Next Token Prediction（逐 Token 生成回复）

---

## 十三、整体认知（一句话版）

> **用户输入首先被 Tokenizer 转换为 Token ID，再查 Embedding 获得静态词向量，并加入位置信息。随后 Transformer 通过 Self-Attention 让所有 Token 相互关联，不断生成结合上下文的新语义表示（Hidden State）。最后，LM Head 根据最终的上下文表示计算整个词表中每个 Token 的概率，选择最可能的下一个 Token，并将其加入输入，重复这一过程，直到生成完整回复。**

---

## 动手练习（可选）

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
python ".\examples\lesson05_workflow.py"
```

脚本会演示：

1. Embedding + Position Encoding
2. LM Head → Softmax → 逐 Token 生成循环

---

## 本课总结

Lesson 1～4 分别讲了流水线中的各个零件；本课把它们串成**从输入到输出的完整路径**。理解这条路径，是后续学习 Prompt、RAG、Agent 的基础。

---

## 下一阶段（第二阶段：RAG）

第一阶段 LLM 基础已告一段落。后续进入 **RAG 工程实践**，从 [Lesson 6：为什么需要 RAG？](lesson-06-rag-why.md) 开始。
