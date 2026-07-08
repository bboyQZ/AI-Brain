"""手动入库：扫 curriculum/ + knowledge/，切片+embedding+入 Chroma。

用法：
    python scripts/ingest.py            # 增量入库
    python scripts/ingest.py --reset    # 清空后全量重建
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.ingest_service import run_ingest


def main():
    reset = "--reset" in sys.argv
    if reset:
        print("清空向量库，全量重建...")
    print("入库 curriculum/ + knowledge/ ...")
    result = run_ingest(reset=reset)
    print(f"入库 {result['ingested']} 片，向量库现有 {result['total']} 条")


if __name__ == "__main__":
    main()
