"""从仓库源码中按符号名截取函数/方法正文，供源码导读页展示。"""
from __future__ import annotations

import ast
import re
from pathlib import Path

# 项目根目录（app/services → 上两级）
REPO_ROOT = Path(__file__).resolve().parents[2]

_ALLOWED_SUFFIX = {".py", ".ts", ".tsx", ".js", ".jsx", ".txt", ".md"}


def _safe_resolve(rel_path: str) -> Path:
    rel = rel_path.replace("\\", "/").lstrip("/")
    if ".." in rel.split("/"):
        raise ValueError("非法路径")
    path = (REPO_ROOT / rel).resolve()
    if not str(path).startswith(str(REPO_ROOT.resolve())):
        raise ValueError("路径越界")
    if path.suffix.lower() not in _ALLOWED_SUFFIX:
        raise ValueError(f"不支持的文件类型: {path.suffix}")
    if not path.is_file():
        raise FileNotFoundError(rel_path)
    return path


def extract_python_symbol(source: str, symbol: str) -> str | None:
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return None

    class_name: str | None = None
    func_name = symbol
    if "." in symbol:
        class_name, func_name = symbol.split(".", 1)

    for node in tree.body:
        if class_name and isinstance(node, ast.ClassDef) and node.name == class_name:
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)) and item.name == func_name:
                    return ast.get_source_segment(source, item)
        if not class_name and isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == func_name:
            return ast.get_source_segment(source, node)
        if not class_name and isinstance(node, ast.ClassDef) and node.name == func_name:
            return ast.get_source_segment(source, node)
    return None


def extract_ts_symbol(source: str, symbol: str) -> str | None:
    """启发式截取 TS/TSX 中的 function / const 箭头函数。"""
    name = re.escape(symbol.split(".")[-1])
    start_re = re.compile(
        rf"^((?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+{name}\b|"
        rf"export\s+const\s+{name}\s*=)",
        re.M,
    )
    m = start_re.search(source)
    if not m:
        return None
    start = m.start(1)
    rest = source[start:]
    if "{" not in rest:
        line = rest.split("\n", 1)[0]
        return line.rstrip()
    depth = 0
    started = False
    for i, ch in enumerate(rest):
        if ch == "{":
            depth += 1
            started = True
        elif ch == "}":
            depth -= 1
            if started and depth == 0:
                end = i + 1
                if end < len(rest) and rest[end] == ";":
                    end += 1
                return rest[:end].rstrip()
    return rest.rstrip()


def extract_source(rel_path: str, symbol: str | None = None) -> dict:
    path = _safe_resolve(rel_path)
    text = path.read_text(encoding="utf-8")
    if not symbol:
        return {
            "path": rel_path.replace("\\", "/"),
            "symbol": None,
            "language": path.suffix.lstrip("."),
            "code": text,
        }

    code: str | None = None
    if path.suffix == ".py":
        code = extract_python_symbol(text, symbol)
    elif path.suffix in {".ts", ".tsx", ".js", ".jsx"}:
        code = extract_ts_symbol(text, symbol)
    else:
        code = text

    if code is None:
        raise LookupError(f"未找到符号 {symbol} @ {rel_path}")

    return {
        "path": rel_path.replace("\\", "/"),
        "symbol": symbol,
        "language": path.suffix.lstrip("."),
        "code": code,
    }
