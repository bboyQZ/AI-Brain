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
