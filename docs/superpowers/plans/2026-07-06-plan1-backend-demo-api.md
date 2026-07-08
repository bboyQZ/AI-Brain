# Plan 1：后端基础 + 演示接口 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭起 FastAPI 后端骨架，实现 tokenize / embedding / attention 三个演示接口和会话管理接口，不依赖 RAG 知识，可立即开始。

**Architecture:** FastAPI 单体应用，`app/` 下按职责分模块（routers / services / models）。演示接口复用 `examples/` 的核心逻辑并改造为真实模型版本。会话用 SQLite 持久化。所有接口通过 OpenAPI 文档自描述。

**Tech Stack:** Python 3.11+ / FastAPI / uvicorn / tiktoken / sentence-transformers (bge-base-zh) / transformers / SQLite (内置 sqlite3) / pytest

**Spec 参考:** `docs/superpowers/specs/2026-07-06-ai-brain-chat-design.md`

**关键决策:**
- tokenize：复用 `examples/lesson01_tokenize.py` 的 tiktoken 逻辑
- embedding：用 `sentence-transformers` 加载 `BAAI/bge-base-zh`，真实向量
- attention：复用 bge-base-zh 模型提取 attention 权重（同源 BERT 架构，`output_attentions=True`），不额外加载模型
- 会话：SQLite，两张表 `sessions` + `messages`
- 模型加载：应用启动时加载一次（lifespan），全局复用

---

## 文件结构

```
AI-Brain/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI 入口，lifespan 加载模型，挂载路由
│   ├── config.py                # 配置（模型名、DB 路径、LLM provider 等）
│   ├── deps.py                  # 依赖注入（模型、DB session）
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py           # Pydantic 请求/响应模型
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── tokenize.py          # /tokenize 接口
│   │   ├── embed.py             # /embed 接口
│   │   ├── attention.py         # /attention 接口
│   │   └── sessions.py          # /sessions 接口
│   ├── services/
│   │   ├── __init__.py
│   │   ├── tokenize_service.py  # tiktoken 逻辑
│   │   ├── embed_service.py     # bge-base-zh 加载 + 编码
│   │   ├── attention_service.py # attention 权重提取
│   │   └── session_store.py     # SQLite 操作
│   └── db.py                    # SQLite 初始化 + 连接
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # pytest fixtures
│   ├── test_tokenize.py
│   ├── test_embed.py
│   ├── test_attention.py
│   └── test_sessions.py
└── requirements.txt             # 更新：追加 fastapi/uvicorn/sentence-transformers 等
```

---

## Task 1：项目骨架 + FastAPI 启动

**Files:**
- Create: `app/__init__.py`（空）
- Create: `app/main.py`
- Create: `app/config.py`
- Modify: `requirements.txt`
- Create: `tests/__init__.py`（空）
- Create: `tests/conftest.py`

- [ ] **Step 1: 更新 requirements.txt**

```
tiktoken>=0.7.0
numpy>=1.26.0
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sentence-transformers>=3.0.0
transformers>=4.44.0
pytest>=8.0.0
httpx>=0.27.0
```

- [ ] **Step 2: 写 config.py**

```python
# app/config.py
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "chat.db"
DATA_DIR = ROOT / "data"

EMBEDDING_MODEL_NAME = "BAAI/bge-base-zh"
TIKTOKEN_ENCODING = "cl100k_base"

LLM_PROVIDER = "deepseek"
DEEPSEEK_API_KEY = ""
ZHIPU_API_KEY = ""

DATA_DIR.mkdir(parents=True, exist_ok=True)
```

- [ ] **Step 3: 写最小 main.py（只验证能启动）**

```python
# app/main.py
from fastapi import FastAPI

app = FastAPI(title="AI-Brain Chat", version="0.1.0")

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: 写 conftest.py（TestClient fixture）**

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)
```

- [ ] **Step 5: 写失败测试**

```python
# tests/test_health.py
def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 6: 安装依赖并跑测试**

```powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
pytest tests/test_health.py -v
```

Expected: PASS

- [ ] **Step 7: 手动验证能启动**

```powershell
uvicorn app.main:app --reload
```

浏览器打开 `http://127.0.0.1:8000/docs`，能看到 `/health` 接口。

- [ ] **Step 8: Commit**

```powershell
git add app/ tests/ requirements.txt
git commit -m "feat: 初始化 FastAPI 后端骨架"
```

---

## Task 2：tokenize 接口

**Files:**
- Create: `app/services/tokenize_service.py`
- Create: `app/routers/tokenize.py`
- Create: `app/models/schemas.py`
- Modify: `app/main.py`（挂载路由）
- Create: `tests/test_tokenize.py`

**复用来源:** `examples/lesson01_tokenize.py` 的 `inspect()` 逻辑，改造为返回结构化数据而非打印。

- [ ] **Step 1: 写 schemas.py（tokenize 的请求/响应模型）**

```python
# app/models/schemas.py
from pydantic import BaseModel

class TokenizeRequest(BaseModel):
    text: str
    encoding: str = "cl100k_base"

class TokenPiece(BaseModel):
    id: int
    piece: str

class TokenizeResponse(BaseModel):
    text: str
    token_count: int
    tokens: list[TokenPiece]
    encoding: str
```

- [ ] **Step 2: 写 tokenize_service.py**

```python
# app/services/tokenize_service.py
import tiktoken
from app.models.schemas import TokenizeResponse, TokenPiece

def tokenize(text: str, encoding: str = "cl100k_base") -> TokenizeResponse:
    enc = tiktoken.get_encoding(encoding)
    ids = enc.encode(text)
    pieces = [TokenPiece(id=tid, piece=enc.decode([tid])) for tid in ids]
    return TokenizeResponse(
        text=text,
        token_count=len(ids),
        tokens=pieces,
        encoding=encoding,
    )
```

- [ ] **Step 3: 写 router**

```python
# app/routers/tokenize.py
from fastapi import APIRouter
from app.models.schemas import TokenizeRequest, TokenizeResponse
from app.services.tokenize_service import tokenize

router = APIRouter(prefix="/tokenize", tags=["tokenize"])

@router.post("", response_model=TokenizeResponse)
def run(req: TokenizeRequest) -> TokenizeResponse:
    return tokenize(req.text, req.encoding)
```

- [ ] **Step 4: 在 main.py 挂载路由**

```python
# app/main.py
from fastapi import FastAPI
from app.routers import tokenize

app = FastAPI(title="AI-Brain Chat", version="0.1.0")
app.include_router(tokenize.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: 写失败测试**

```python
# tests/test_tokenize.py
def test_tokenize_english(client):
    resp = client.post("/tokenize", json={"text": "Hello"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "Hello"
    assert data["token_count"] >= 1
    assert len(data["tokens"]) == data["token_count"]
    assert all("id" in t and "piece" in t for t in data["tokens"])

def test_tokenize_chinese(client):
    resp = client.post("/tokenize", json={"text": "你好"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_count"] >= 1

def test_tokenize_empty(client):
    resp = client.post("/tokenize", json={"text": ""})
    assert resp.status_code == 200
    assert resp.json()["token_count"] == 0
```

- [ ] **Step 6: 跑测试验证通过**

```powershell
pytest tests/test_tokenize.py -v
```

Expected: 3 passed

- [ ] **Step 7: Commit**

```powershell
git add app/ tests/
git commit -m "feat: 添加 /tokenize 接口"
```

---

## Task 3：embedding 接口

**Files:**
- Create: `app/services/embed_service.py`
- Create: `app/routers/embed.py`
- Modify: `app/models/schemas.py`（追加 embedding 模型）
- Modify: `app/main.py`（挂载路由）
- Modify: `app/main.py`（加 lifespan，启动时加载模型）
- Create: `app/deps.py`（模型依赖注入）
- Create: `tests/test_embed.py`

**关键决策:** 用 `sentence-transformers` 加载 `BAAI/bge-base-zh`，应用启动时加载一次，全局复用。embedding 接口返回真实向量 + 相似度。

- [ ] **Step 1: 追加 embedding 的 schemas**

在 `app/models/schemas.py` 末尾追加：

```python
class EmbedRequest(BaseModel):
    texts: list[str]

class EmbedItem(BaseModel):
    text: str
    vector: list[float]
    dim: int

class EmbedResponse(BaseModel):
    items: list[EmbedItem]
    model: str

class SimilarityRequest(BaseModel):
    pairs: list[tuple[str, str]]

class SimilarityPair(BaseModel):
    a: str
    b: str
    score: float

class SimilarityResponse(BaseModel):
    pairs: list[SimilarityPair]
    model: str
```

- [ ] **Step 2: 写 deps.py（模型单例）**

```python
# app/deps.py
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from app.config import EMBEDDING_MODEL_NAME

@lru_cache(maxsize=1)
def get_embed_model() -> SentenceTransformer:
    return SentenceTransformer(EMBEDDING_MODEL_NAME)
```

- [ ] **Step 3: 写 embed_service.py**

```python
# app/services/embed_service.py
import numpy as np
from app.deps import get_embed_model
from app.models.schemas import EmbedResponse, EmbedItem, SimilarityResponse, SimilarityPair

def embed_texts(texts: list[str]) -> EmbedResponse:
    model = get_embed_model()
    vecs = model.encode(texts, normalize_embeddings=True)
    items = [
        EmbedItem(text=t, vector=v.tolist(), dim=len(v))
        for t, v in zip(texts, vecs)
    ]
    return EmbedResponse(items=items, model=model.model_name)

def compute_similarity(pairs: list[tuple[str, str]]) -> SimilarityResponse:
    model = get_embed_model()
    all_texts = list({t for pair in pairs for t in pair})
    emb_map = {}
    if all_texts:
        vecs = model.encode(all_texts, normalize_embeddings=True)
        for t, v in zip(all_texts, vecs):
            emb_map[t] = np.array(v)
    result = []
    for a, b in pairs:
        va, vb = emb_map[a], emb_map[b]
        score = float(np.dot(va, vb))
        result.append(SimilarityPair(a=a, b=b, score=score))
    return SimilarityResponse(pairs=result, model=model.model_name)
```

- [ ] **Step 4: 写 router**

```python
# app/routers/embed.py
from fastapi import APIRouter
from app.models.schemas import EmbedRequest, EmbedResponse, SimilarityRequest, SimilarityResponse
from app.services.embed_service import embed_texts, compute_similarity

router = APIRouter(prefix="/embed", tags=["embed"])

@router.post("/vectors", response_model=EmbedResponse)
def vectors(req: EmbedRequest) -> EmbedResponse:
    return embed_texts(req.texts)

@router.post("/similarity", response_model=SimilarityResponse)
def similarity(req: SimilarityRequest) -> SimilarityResponse:
    return compute_similarity(req.pairs)
```

- [ ] **Step 5: 在 main.py 挂载路由**

```python
# app/main.py
from fastapi import FastAPI
from app.routers import tokenize, embed

app = FastAPI(title="AI-Brain Chat", version="0.1.0")
app.include_router(tokenize.router)
app.include_router(embed.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: 写失败测试**

```python
# tests/test_embed.py
def test_embed_single(client):
    resp = client.post("/embed/vectors", json={"texts": ["你好"]})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["text"] == "你好"
    assert len(data["items"][0]["vector"]) == data["items"][0]["dim"]
    assert data["items"][0]["dim"] > 0

def test_embed_multiple(client):
    resp = client.post("/embed/vectors", json={"texts": ["北京", "上海", "苹果"]})
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 3

def test_similarity_high(client):
    resp = client.post("/embed/similarity", json={"pairs": [["北京", "上海"]]})
    assert resp.status_code == 200
    score = resp.json()["pairs"][0]["score"]
    assert 0 <= score <= 1

def test_similarity_low(client):
    resp = client.post("/embed/similarity", json={"pairs": [["北京", "香蕉"]]})
    assert resp.status_code == 200
    score = resp.json()["pairs"][0]["score"]
    assert 0 <= score <= 1
```

- [ ] **Step 7: 跑测试**

```powershell
pytest tests/test_embed.py -v
```

Expected: 4 passed（首次会下载 bge-base-zh 模型，约 200MB，需要几分钟）

- [ ] **Step 8: Commit**

```powershell
git add app/ tests/
git commit -m "feat: 添加 /embed 接口（bge-base-zh 真实向量）"
```

---

## Task 4：attention 接口

**Files:**
- Create: `app/services/attention_service.py`
- Create: `app/routers/attention.py`
- Modify: `app/models/schemas.py`（追加 attention 模型）
- Modify: `app/main.py`（挂载路由）
- Create: `tests/test_attention.py`

**关键决策:** 复用 bge-base-zh（BERT 架构）提取 attention 权重，用 `transformers` 的 `output_attentions=True`，不额外加载模型。返回所有层、所有 head 的权重矩阵，前端可选择性展示。

- [ ] **Step 1: 追加 attention 的 schemas**

在 `app/models/schemas.py` 末尾追加：

```python
class AttentionRequest(BaseModel):
    text: str

class AttentionLayer(BaseModel):
    layer: int
    heads: list[list[list[float]]]  # [head][query_token][key_token]

class AttentionResponse(BaseModel):
    text: str
    tokens: list[str]
    num_layers: int
    num_heads: int
    layers: list[AttentionLayer]
    model: str
```

- [ ] **Step 2: 写 attention_service.py**

```python
# app/services/attention_service.py
from transformers import AutoTokenizer, AutoModel
import torch
from app.config import EMBEDDING_MODEL_NAME
from app.models.schemas import AttentionResponse, AttentionLayer

_tokenizer = None
_model = None

def _load():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
        _model = AutoModel.from_pretrained(EMBEDDING_MODEL_NAME, output_attentions=True)
        _model.eval()
    return _tokenizer, _model

def extract_attention(text: str) -> AttentionResponse:
    tokenizer, model = _load()
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    attentions = outputs.attentions  # tuple of (1, num_heads, seq_len, seq_len)
    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    layers = []
    for i, attn in enumerate(attentions):
        heads = attn[0].tolist()  # (num_heads, seq_len, seq_len)
        layers.append(AttentionLayer(layer=i, heads=heads))
    return AttentionResponse(
        text=text,
        tokens=tokens,
        num_layers=len(attentions),
        num_heads=attentions[0].shape[1],
        layers=layers,
        model=EMBEDDING_MODEL_NAME,
    )
```

- [ ] **Step 3: 写 router**

```python
# app/routers/attention.py
from fastapi import APIRouter
from app.models.schemas import AttentionRequest, AttentionResponse
from app.services.attention_service import extract_attention

router = APIRouter(prefix="/attention", tags=["attention"])

@router.post("", response_model=AttentionResponse)
def run(req: AttentionRequest) -> AttentionResponse:
    return extract_attention(req.text)
```

- [ ] **Step 4: 在 main.py 挂载路由**

```python
# app/main.py
from fastapi import FastAPI
from app.routers import tokenize, embed, attention

app = FastAPI(title="AI-Brain Chat", version="0.1.0")
app.include_router(tokenize.router)
app.include_router(embed.router)
app.include_router(attention.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: 写失败测试**

```python
# tests/test_attention.py
def test_attention_basic(client):
    resp = client.post("/attention", json={"text": "苹果发布手机"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "苹果发布手机"
    assert len(data["tokens"]) > 0
    assert data["num_layers"] > 0
    assert data["num_heads"] > 0
    assert len(data["layers"]) == data["num_layers"]
    first_layer = data["layers"][0]
    assert first_layer["layer"] == 0
    seq_len = len(data["tokens"])
    assert len(first_layer["heads"]) == data["num_heads"]
    assert len(first_layer["heads"][0]) == seq_len
    assert len(first_layer["heads"][0][0]) == seq_len

def test_attention_weights_sum_to_one(client):
    resp = client.post("/attention", json={"text": "你好世界"})
    data = resp.json()
    head = data["layers"][0]["heads"][0]
    for row in head:
        assert abs(sum(row) - 1.0) < 0.01
```

- [ ] **Step 6: 跑测试**

```powershell
pytest tests/test_attention.py -v
```

Expected: 2 passed

- [ ] **Step 7: Commit**

```powershell
git add app/ tests/
git commit -m "feat: 添加 /attention 接口（复用 bge 提取真实注意力权重）"
```

---

## Task 5：会话管理接口（SQLite）

**Files:**
- Create: `app/db.py`
- Create: `app/services/session_store.py`
- Create: `app/routers/sessions.py`
- Modify: `app/models/schemas.py`（追加会话模型）
- Modify: `app/main.py`（挂载路由 + 启动时建表）
- Create: `tests/test_sessions.py`

**关键决策:** SQLite 单文件，启动时建表。匿名 session，不做登录。三张表设计：`sessions` + `messages`。

- [ ] **Step 1: 追加会话的 schemas**

在 `app/models/schemas.py` 末尾追加：

```python
class SessionCreate(BaseModel):
    title: str = "新对话"

class SessionInfo(BaseModel):
    id: int
    title: str
    created_at: str

class MessageCreate(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class MessageInfo(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: str

class SessionHistory(BaseModel):
    session: SessionInfo
    messages: list[MessageInfo]
```

- [ ] **Step 2: 写 db.py**

```python
# app/db.py
import sqlite3
from app.config import DB_PATH

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    """)
    conn.commit()
    conn.close()
```

- [ ] **Step 3: 写 session_store.py**

```python
# app/services/session_store.py
from app.db import get_conn
from app.models.schemas import SessionInfo, MessageInfo

def create_session(title: str) -> SessionInfo:
    conn = get_conn()
    cur = conn.execute("INSERT INTO sessions(title) VALUES (?)", (title,))
    sid = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id=?", (sid,)).fetchone()
    conn.close()
    return SessionInfo(id=row["id"], title=row["title"], created_at=row["created_at"])

def add_message(session_id: int, role: str, content: str) -> MessageInfo:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO messages(session_id, role, content) VALUES (?, ?, ?)",
        (session_id, role, content),
    )
    mid = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM messages WHERE id=?", (mid,)).fetchone()
    conn.close()
    return MessageInfo(
        id=row["id"], session_id=row["session_id"],
        role=row["role"], content=row["content"], created_at=row["created_at"],
    )

def get_history(session_id: int) -> list[MessageInfo]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM messages WHERE session_id=? ORDER BY id", (session_id,)
    ).fetchall()
    conn.close()
    return [
        MessageInfo(id=r["id"], session_id=r["session_id"], role=r["role"],
                    content=r["content"], created_at=r["created_at"])
        for r in rows
    ]

def list_sessions() -> list[SessionInfo]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM sessions ORDER BY id DESC").fetchall()
    conn.close()
    return [
        SessionInfo(id=r["id"], title=r["title"], created_at=r["created_at"])
        for r in rows
    ]
```

- [ ] **Step 4: 写 router**

```python
# app/routers/sessions.py
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    SessionCreate, SessionInfo, MessageCreate, MessageInfo, SessionHistory
)
from app.services.session_store import (
    create_session, add_message, get_history, list_sessions
)

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("", response_model=SessionInfo)
def create(req: SessionCreate) -> SessionInfo:
    return create_session(req.title)

@router.get("", response_model=list[SessionInfo])
def list_all() -> list[SessionInfo]:
    return list_sessions()

@router.post("/{session_id}/messages", response_model=MessageInfo)
def add_msg(session_id: int, req: MessageCreate) -> MessageInfo:
    return add_message(session_id, req.role, req.content)

@router.get("/{session_id}", response_model=SessionHistory)
def history(session_id: int) -> SessionHistory:
    from app.services.session_store import list_sessions as _ls
    sessions = {s.id: s for s in _ls()}
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="session not found")
    msgs = get_history(session_id)
    return SessionHistory(session=sessions[session_id], messages=msgs)
```

- [ ] **Step 5: 在 main.py 挂载路由 + 启动建表**

```python
# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.routers import tokenize, embed, attention, sessions
from app.db import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="AI-Brain Chat", version="0.1.0", lifespan=lifespan)
app.include_router(tokenize.router)
app.include_router(embed.router)
app.include_router(attention.router)
app.include_router(sessions.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 6: 写失败测试**

```python
# tests/test_sessions.py
def test_create_session(client):
    resp = client.post("/sessions", json={"title": "测试对话"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "测试对话"
    assert "id" in data
    assert "created_at" in data

def test_add_message(client):
    s = client.post("/sessions", json={"title": "t"}).json()
    sid = s["id"]
    resp = client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "你好"})
    assert resp.status_code == 200
    m = resp.json()
    assert m["role"] == "user"
    assert m["content"] == "你好"
    assert m["session_id"] == sid

def test_get_history(client):
    s = client.post("/sessions", json={"title": "t"}).json()
    sid = s["id"]
    client.post(f"/sessions/{sid}/messages", json={"role": "user", "content": "问"})
    client.post(f"/sessions/{sid}/messages", json={"role": "assistant", "content": "答"})
    resp = client.get(f"/sessions/{sid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session"]["id"] == sid
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][1]["role"] == "assistant"

def test_list_sessions(client):
    client.post("/sessions", json={"title": "a"})
    client.post("/sessions", json={"title": "b"})
    resp = client.get("/sessions")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2

def test_history_not_found(client):
    resp = client.get("/sessions/99999")
    assert resp.status_code == 404
```

- [ ] **Step 7: 跑测试**

```powershell
pytest tests/test_sessions.py -v
```

Expected: 5 passed

- [ ] **Step 8: Commit**

```powershell
git add app/ tests/
git commit -m "feat: 添加 /sessions 会话管理接口（SQLite 持久化）"
```

---

## Task 6：全量测试 + .gitignore + 收尾

**Files:**
- Modify: `.gitignore`（追加 data/ 和 __pycache__）
- Modify: `README.md`（追加后端启动说明）

- [ ] **Step 1: 更新 .gitignore**

在 `.gitignore` 末尾追加：

```
data/
__pycache__/
*.pyc
.pytest_cache/
models_cache/
```

- [ ] **Step 2: 跑全量测试**

```powershell
Set-Location "D:\develop\AI-Brain"
pytest tests/ -v
```

Expected: 全部 PASS（health 1 + tokenize 3 + embed 4 + attention 2 + sessions 5 = 15）

- [ ] **Step 3: 手动验证所有接口**

```powershell
uvicorn app.main:app --reload
```

浏览器打开 `http://127.0.0.1:8000/docs`，逐个测试：
- `/health` 返回 ok
- `/tokenize` 传 `{"text": "你好"}` 返回 token 列表
- `/embed/vectors` 传 `{"texts": ["你好"]}` 返回向量
- `/embed/similarity` 传 `{"pairs": [["北京","上海"]]}` 返回相似度
- `/attention` 传 `{"text": "苹果发布手机"}` 返回注意力权重
- `/sessions` POST 创建会话
- `/sessions/{id}/messages` POST 追加消息
- `/sessions/{id}` GET 拉历史

- [ ] **Step 4: 更新 README（追加后端说明）**

在 README.md 的"目录结构"后追加一节：

```markdown
## 后端开发

\`\`\`powershell
Set-Location "D:\develop\AI-Brain"
pip install -r ".\requirements.txt"
uvicorn app.main:app --reload
\`\`\`

启动后访问 `http://127.0.0.1:8000/docs` 查看 API 文档。
```

- [ ] **Step 5: Commit**

```powershell
git add .gitignore README.md
git commit -m "chore: 后端骨架收尾（gitignore + README + 全量测试通过）"
```

---

## Plan 1 完成标准

- [ ] FastAPI 后端能启动，`/docs` 可访问
- [ ] 6 个接口全部可用：health / tokenize / embed(vectors+similarity) / attention / sessions(CRUD)
- [ ] 全量测试通过（15 个测试）
- [ ] bge-base-zh 模型启动时加载，全局复用
- [ ] SQLite 会话持久化正常
- [ ] README 有后端启动说明

## 下一阶段

Plan 1 完成后，进入：
- **Plan 2：RAG 问答**（等学完 RAG 课程）
- **Plan 3：前端**（可与 Plan 2 并行）

---
