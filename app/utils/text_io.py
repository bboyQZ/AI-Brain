from pathlib import Path


def read_text_auto(path: Path) -> str:
    """按 UTF-8 / GBK 等常见编码读取文本，避免 Windows 下中文笔记乱码。"""
    raw = path.read_bytes()
    for encoding in ("utf-8-sig", "utf-8", "gb18030", "gbk"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")
