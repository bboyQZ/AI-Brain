# tests/conftest.py
# 重要：必须在导入 app.* 之前设置环境变量——
# 把数据目录指向临时目录，避免测试污染真实的 chat.db / chroma 向量库。
import os
import tempfile

_TEST_DATA_DIR = tempfile.mkdtemp(prefix="ai_brain_test_")
os.environ["AI_BRAIN_DATA_DIR"] = _TEST_DATA_DIR
os.environ["AUTO_INGEST_ON_STARTUP"] = "false"

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
