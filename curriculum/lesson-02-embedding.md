# Lesson 2：Embedding（嵌入）

## 本课目标

理解 **Embedding** 如何把「无意义的编号」变成「能表达语义的向量」，以及它在 RAG 里的作用。

---

## 一句话理解

Embedding 的作用是把 **Token ID** 转换成能够表达语义的**向量**。

---

## 整体流程

在 LLM 内部，一条文本大致经历如下路径：

```
文本
  ↓
Tokenizer
  ↓
Token ID
  ↓
Embedding
  ↓
向量（Vector）
  ↓
Transformer
```

Lesson 1 我们停在 **Token ID**；本课补上中间这一步——模型真正做推理时，操作的是向量，而不是编号本身。

---

## 为什么需要 Embedding？

Token ID 只是编号，**不包含任何语义信息**。

例如（示意 ID，非真实值）：

| 词 | Token ID |
|----|----------|
| 北京 | 14002 |
| 上海 | 987 |

仅凭数字大小，无法表达「北京和上海都是中国城市」这种关系——14002 和 987 在数值上毫无关联。

**Embedding** 把每个 Token ID 映射为一个高维向量（例如 768 维、1536 维），使语义相近的词在向量空间中彼此接近。

```
Token ID 14002  →  [0.12, -0.34, 0.56, ...]   （768 维向量）
Token ID 987    →  [0.11, -0.31, 0.52, ...]   （方向相近）
```

这些向量是模型在预训练过程中**学出来**的，存在一张巨大的「Embedding 查找表」里（下一节展开）。

---

## Embedding 是如何实现的？

Embedding 本质上不是实时计算，而是**查表（Lookup）**。

模型内部保存着一个可训练的 **Embedding Matrix（嵌入矩阵）**——可以把它想象成一张表：每一行对应一个 Token ID，每一列是向量中的一个维度。

例如（3 维示意）：

| Token ID | Embedding |
|----------|-----------|
| 0 | (0.1, 0.5, -0.3) |
| 1 | (0.8, -1.2, 0.4) |
| 2 | (0.7, -1.1, 0.5) |

流程很简单：

```
Tokenizer 输出 Token ID  →  用 ID 作为行号查表  →  取出该行的向量
```

训练开始时，矩阵里的向量都是**随机初始化**的。

随着模型不断训练，通过**反向传播**不断更新这些向量，使语义相近的 Token 在向量空间中逐渐靠近。

因此：

- **Embedding Matrix 是模型参数的一部分**（和 Attention 权重一样，都是「学」出来的）
- **Embedding 是训练出来的，不是人工设计出来的**
- **推理阶段的 Embedding 本质上就是一次查表操作**（极快，不涉及复杂计算）

```
训练：随机矩阵 → 反向传播 → 语义相近的 Token 向量逐渐靠近
推理：Token ID → 查表 → 向量 → 送入 Transformer
```

---

## 核心思想

> **语义相近，向量相近。**

| 关系 | 向量空间中的表现 |
|------|------------------|
| 北京 ≈ 上海 | 余弦相似度高，距离近 |
| 苹果（水果）≈ 香蕉 | 余弦相似度高 |
| 北京 ≠ 香蕉 | 余弦相似度低，方向差异大 |

常用衡量方式：

- **余弦相似度（Cosine Similarity）**：看两个向量「方向」是否一致，范围 -1～1，越接近 1 越相似
- **欧氏距离（Euclidean Distance）**：看两个点「直线距离」是否近

RAG 和向量检索主要用余弦相似度或内积。

---

## LLM 内嵌 Embedding vs RAG 专用 Embedding

容易混淆的两层含义：

| 场景 | 作用 | 谁在用 |
|------|------|--------|
| **LLM 内部 Embedding 层** | 把 Token ID 变成向量，供 Transformer 计算 | GPT、Claude 等生成模型 |
| **RAG 专用 Embedding 模型** | 把整段文档/问题变成向量，用于检索 | `text-embedding-3-small`、`bge-m3` 等 |

两者目标一致（语义 → 向量），但：

- LLM 内部 Embedding 服务于**下一个 Token 的生成**
- RAG Embedding 服务于**在知识库中找相关内容**

你不能直接把 LLM 的 Token Embedding 拿去当向量数据库的检索向量——实践中用的是专门的 Embedding API / 模型。

---

## 与 RAG 的关系

RAG 检索的核心就是 Embedding + 向量距离：

```
【离线】文档 → Embedding 模型 → 向量 → 存入向量数据库

【在线】用户问题 → Embedding 模型 → 向量 → 与库中向量比距离 → 取 Top-K 片段 → 塞进 Prompt
```

系统通过计算向量之间的距离，找到**语义最相关**的内容，而不是简单做关键词匹配。

举例：

- 用户问：「首都的天气怎么样？」
- 知识库里有：「北京今日晴，气温 25℃」
- 即使没有「首都」二字，Embedding 也能把「首都」和「北京」关联起来

这就是现代 AI 搜索 / RAG 比传统关键词搜索更「懂意思」的原因。

---

## 动手练习（可选）

在项目根目录执行：

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
python ".\examples\lesson02_embedding.py"
```

脚本会：

1. 演示 Embedding Matrix 查表（Lookup）
2. 对比 Token ID（无语义）与 Embedding 向量（有语义）
3. 用玩具向量计算「北京 / 上海 / 香蕉」之间的余弦相似度

> 真实生产环境使用 `text-embedding-3-small`、`bge-m3` 等模型生成 768+ 维向量；本练习侧重理解概念，无需下载大模型。

---

## 本课总结

| 组件 | 职责 |
|------|------|
| **Tokenizer** | 把文本转换为 Token ID |
| **Embedding** | 把 Token ID（或整段文本）转换为能表达语义的向量；LLM 内部通过 Embedding Matrix 查表实现 |
| **Transformer** | 在这些向量上进行计算和推理 |

理解 Embedding，是理解 **RAG、向量数据库和现代 AI 搜索系统** 的基础。

---

## 延伸阅读

- [OpenAI Embeddings 指南](https://platform.openai.com/docs/guides/embeddings)
- [Sentence Transformers 文档](https://www.sbert.net/)
- 向量数据库：Pinecone、Milvus、Chroma、pgvector 等产品文档
