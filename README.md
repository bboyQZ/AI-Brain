# AI-Brain

个人 AI 学习笔记与实践仓库。按课循序渐进，从 LLM 基础到 RAG、Agent。

## 课程目录

### 第一阶段：理解 LLM 工作原理

| 课次 | 主题 | 文档 |
|------|------|------|
| 1 | Token 与 Tokenizer | [curriculum/lesson-01-token-tokenizer.md](curriculum/lesson-01-token-tokenizer.md) |
| 2 | Embedding（嵌入） | [curriculum/lesson-02-embedding.md](curriculum/lesson-02-embedding.md) |
| 3 | 什么是 Embedding 向量？ | [curriculum/lesson-03-embedding-vector.md](curriculum/lesson-03-embedding-vector.md) |
| 4 | Transformer 与 Attention | [curriculum/lesson-04-transformer-attention.md](curriculum/lesson-04-transformer-attention.md) |
| 5 | Transformer 工作流程（AI 应用开发版） | [curriculum/lesson-05-transformer-workflow.md](curriculum/lesson-05-transformer-workflow.md) |

### 第二阶段：RAG（AI 工程实践）

| 课次 | 主题 | 文档 |
|------|------|------|
| 6 | 为什么需要 RAG？ | [curriculum/lesson-06-rag-why.md](curriculum/lesson-06-rag-why.md) |

## 快速开始

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
python ".\examples\lesson01_tokenize.py"
python ".\examples\lesson02_embedding.py"
python ".\examples\lesson03_embedding_vector.py"
python ".\examples\lesson04_attention.py"
python ".\examples\lesson05_workflow.py"
python ".\examples\lesson06_rag_intro.py"
```

## 目录结构

```
AI-Brain/
├── app/            # 后端（FastAPI）
├── curriculum/     # 课程文档
├── examples/       # 配套动手示例
├── tests/          # 后端测试
└── requirements.txt
```

## 后端开发

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
uvicorn app.main:app --reload
```

启动后访问 `http://127.0.0.1:8000/docs` 查看 API 文档。
