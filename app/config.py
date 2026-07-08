# app/config.py
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "chat.db"
DATA_DIR = ROOT / "data"

EMBEDDING_MODEL_NAME = "BAAI/bge-base-zh"
TIKTOKEN_ENCODING = "cl100k_base"

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "deepseek")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY", "")
ZHIPU_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
ZHIPU_MODEL = "glm-4"

DATA_DIR.mkdir(parents=True, exist_ok=True)
