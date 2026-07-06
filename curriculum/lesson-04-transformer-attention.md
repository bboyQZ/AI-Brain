# Lesson 4：Transformer 与 Attention

## 本课目标

理解：

- Transformer 为什么会被发明？
- Transformer 到底解决了什么问题？
- Attention 的本质是什么？
- Query、Key、Value 是怎么来的？

---

## 一句话理解

> Transformer 的核心思想是：**每个 Token 都根据上下文，动态更新自己的语义表示。**

真正理解上下文的不是 Embedding，而是 **Transformer**。

---

## 为什么需要 Transformer？

Embedding 只能表示 Token 的「**初始含义**」。

例如「苹果」→ Embedding 得到一个**固定向量**。

但下面两句话：

```
苹果很好吃。
苹果发布了新手机。
```

- 第一个：苹果 = 水果 🍎
- 第二个：苹果 = Apple 公司 📱

**Embedding 无法区分**——同一个 Token，Embedding 永远是固定的。

因此必须有新机制，根据**上下文**重新理解。这就是 **Transformer**。

---

## Transformer 做了什么？

Transformer 会不断问：

> **我应该关注这句话里的谁？**

例如「苹果 发布 手机」：

```
苹果 应该关注谁？

  手机  ★★★★★
  发布  ★★★★☆
  香蕉  ☆
```

于是「苹果」会吸收「手机」「发布」的信息，最终更新为 **Apple 公司**。

如果是「苹果 很 好吃」：

```
苹果 应该关注谁？

  好吃  ★★★★★
```

于是「苹果」更新为 **水果**。

因此，Transformer 能让**同一个 Token 在不同句子中拥有不同的语义**。

---

## Attention（注意力机制）

Transformer 最核心的能力就是 **Attention**。

Attention 本质不是「理解」，而是：

> **计算每个 Token 与其它 Token 的相关性，然后把相关的信息融合进来。**

Transformer 没有规则、没有词典、没有 if-else——它一直在问：

```
谁和我关系最强？
```

---

## Query、Key、Value

每个 Token 都会生成三个向量：

### Query（Q）——「我现在需要什么？」

可以理解为「我的需求」：我想从别人那里找什么信息。

### Key（K）——「我是谁？」

可以理解为「我的名片」：别人通过 Key 判断是否应该关注我。

### Value（V）——「我能提供什么信息？」

如果别人关注我，我能贡献什么内容——真正携带的信息。

---

## Q、K、V 是怎么来的？

假设 Embedding 得到向量 **E**，Transformer 内部有三套可训练参数 **W_Q、W_K、W_V**：

```
Q = E × W_Q
K = E × W_K
V = E × W_V
```

Q、K、V **都来自同一个 Embedding**，只是经过不同的线性变换，承担不同职责。

```
Embedding (E)
    ├── × W_Q → Query
    ├── × W_K → Key
    └── × W_V → Value
```

W_Q、W_K、W_V 都是模型**训练出来**的参数；推理阶段直接使用。

---

## Attention 的流程

以「苹果 发布 手机」为例：

| 步骤 | 做什么 |
|------|--------|
| 1 | 「苹果」拿着自己的 **Query** |
| 2 | 查看所有人的 **Key**，得到相关性分数（Attention Score） |
| 3 | 按分数加权获取对应的 **Value**（如「手机」带来科技、电子产品等信息） |
| 4 | **更新**「苹果」自己的向量 → 理解为 Apple 公司 |

---

## Transformer 为什么越来越聪明？

整个过程**不是执行一次**，而是**重复很多层**：

```
第 1 层：苹果 → 关注 手机
第 2 层：苹果 → 关注 发布会
第 3 层：苹果 → 关注 CEO
第 4 层：苹果 → 关注 科技
……
```

每一层都会再次更新 Token 的表示，模型对上下文的理解越来越准确。

---

## Embedding 与 Transformer 的区别

| 组件 | 职责 |
|------|------|
| **Embedding** | Token → 固定初始向量 |
| **Transformer** | 固定向量 → 结合上下文 → 动态更新向量 |

真正理解上下文的是 **Transformer**。

---

## 整体数据流

```
文本
  ↓
Tokenizer
  ↓
Token ID
  ↓
Embedding
  ↓
初始向量
  ↓
Transformer（Attention × 多层）
  ↓
新的上下文向量
  ↓
预测下一个 Token
```

---

## 为什么说 Transformer 是革命？

| 传统 NLP | Transformer |
|----------|-------------|
| 规则 + 词典 + 人工特征 | 大量数据 + Attention + 自动学习上下文 |

现代 LLM 几乎全部建立在 Transformer 之上。

---

## AI 工程师视角

实际开发中，我们通常**不会自己实现 Transformer**，而是直接调用 GPT、Gemini、Claude、Qwen、DeepSeek、Llama 等模型——它们已完成 Tokenizer、Embedding、Transformer 和推理。

AI 工程师真正关注的是：

- Prompt 如何设计
- Context 如何组织
- RAG 如何检索
- Agent 如何调用模型
- 如何控制 Token 成本
- 如何优化推理效果

理解 Transformer 的目的，不是为了自己训练模型，而是为了知道**模型为什么会成功、什么时候容易失败**。

---

## 动手练习（可选）

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
python ".\examples\lesson04_attention.py"
```

脚本会演示：

1. 同一 Token「苹果」在两句话中的不同 Attention 分布
2. Q = E × W_Q 的线性变换过程
3. Attention Score 加权融合 Value 更新向量

---

## 本课总结

Transformer 的本质不是「理解语言」，而是：

> **不断计算每个 Token 应该关注哪些 Token。**

整个流程：

```
Embedding → Q、K、V → Attention → 融合 Value → 更新 Token → 重复多层 → 符合上下文的语义
```

因此，Transformer 能让同一个 Token 在不同句子中拥有不同的含义。

---

## 本课关键词

- Transformer、Attention、自注意力（Self-Attention）
- Query（Q）、Key（K）、Value（V）
- Context（上下文）、Attention Score
- W_Q / W_K / W_V、动态语义表示

---

## 我的理解（课后思考）

1. Embedding 提供的是 Token 的初始语义。
2. Transformer 会根据上下文不断修正这个语义。
3. Query 用来表达「我想找什么」。
4. Key 用来表达「我是谁」。
5. Value 用来表达「我能提供什么信息」。
6. Attention 本质是在计算 Token 之间的相关性。
7. 多层 Transformer 不断重复这一过程，模型逐渐形成对整句话的理解。

---

## 下一课预告

**Transformer 完整工作流程（AI 应用开发版）**

把 Tokenizer → Embedding → Position Encoding → Transformer → Hidden State → LM Head → 逐 Token 生成串成一条完整流水线。详见 [Lesson 5](lesson-05-transformer-workflow.md)。
