import re
from datetime import datetime

MAX_TOKENS = 800


def chunk_markdown(md: str, source: str, source_type: str) -> list[dict]:
    lines = md.split("\n")
    chunks: list[dict] = []
    current_section = ""
    current_path: list[str] = []
    current_content: list[str] = []

    def flush():
        if not current_content:
            return
        text = "\n".join(current_content).strip()
        if not text:
            return
        if len(text) > MAX_TOKENS:
            for para in _split_long(text):
                chunks.append(_make_chunk(para, source, source_type, current_section, current_path))
        else:
            chunks.append(_make_chunk(text, source, source_type, current_section, current_path))

    for line in lines:
        m = re.match(r"^(#{1,3})\s+(.+)", line)
        if m:
            flush()
            level = len(m.group(1))
            title = m.group(2).strip()
            current_path = current_path[: level - 1] + [title]
            current_section = title
            current_content = [line]
        else:
            current_content.append(line)
    flush()
    return chunks


def _split_long(text: str) -> list[str]:
    paras = text.split("\n\n")
    result: list[str] = []
    buf = ""
    for p in paras:
        if len(p) > MAX_TOKENS:
            if buf:
                result.append(buf)
                buf = ""
            for i in range(0, len(p), MAX_TOKENS):
                result.append(p[i : i + MAX_TOKENS])
        elif len(buf) + len(p) > MAX_TOKENS and buf:
            result.append(buf)
            buf = p
        else:
            buf = buf + "\n\n" + p if buf else p
    if buf:
        result.append(buf)
    return result


def _make_chunk(text: str, source: str, source_type: str, section: str, path: list[str]) -> dict:
    return {
        "content": text,
        "source": source,
        "source_type": source_type,
        "section": section,
        "heading_path": " > ".join(path),
        "created_at": datetime.now().isoformat(),
    }
