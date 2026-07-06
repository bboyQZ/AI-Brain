# AI-Brain

个人 AI 学习笔记与实践仓库。按「每日一课」循序渐进，从 Token 基础到 Prompt、RAG、Agent。

## 课程目录

| Day | 主题 | 文档 |
|-----|------|------|
| 1 | Token 与 Tokenizer | [curriculum/day-01-token-tokenizer.md](curriculum/day-01-token-tokenizer.md) |
| 2 | Embedding（嵌入） | [curriculum/day-02-embedding.md](curriculum/day-02-embedding.md) |
| 3 | 什么是 Embedding 向量？ | [curriculum/day-03-embedding-vector.md](curriculum/day-03-embedding-vector.md) |

## 快速开始

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
python ".\examples\day01_tokenize.py"
python ".\examples\day02_embedding.py"
python ".\examples\day03_embedding_vector.py"
```

## 目录结构

```
AI-Brain/
├── curriculum/     # 每日课程文档
├── examples/       # 配套动手示例
└── requirements.txt
```
