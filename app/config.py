# app/config.py
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

DB_PATH = ROOT / "data" / "chat.db"
DATA_DIR = ROOT / "data"

EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-base-zh")
TIKTOKEN_ENCODING = "cl100k_base"

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "volcano")

# 火山方舟（OpenAI 兼容）：模型填控制台「推理接入点 ID」，形如 ep-xxxxxxxx
ARK_API_KEY = os.getenv("ARK_API_KEY", "")
ARK_BASE_URL = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
ARK_MODEL = os.getenv("ARK_MODEL", "")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"

ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
ZHIPU_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
ZHIPU_MODEL = "glm-4"

DATA_DIR.mkdir(parents=True, exist_ok=True)
