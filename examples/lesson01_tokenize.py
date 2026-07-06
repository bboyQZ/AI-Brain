r"""
Lesson 1 动手练习：观察文本如何被切成 Token。

推荐运行（PowerShell）：
    Set-Location "D:\develop\AI-Brain"
    pip install -r ".\requirements.txt"
    python ".\examples\lesson01_tokenize.py"
"""

import tiktoken


def inspect(text: str, encoding_name: str = "cl100k_base") -> None:
    """打印一段文本的 Token 切分结果。"""
    enc = tiktoken.get_encoding(encoding_name)
    tokens = enc.encode(text)  # cl100k_base 常用于 GPT-4 / GPT-3.5-turbo
    decoded_pieces = [enc.decode([t]) for t in tokens]

    print(f"\n{'─' * 50}")
    print(f"文本: {text!r}")
    print(f"Token 数量: {len(tokens)}")
    print(f"Token ID: {tokens}")
    print(f"逐片还原: {decoded_pieces}")


def main() -> None:
    print("Lesson 1 — Token 与 Tokenizer 演示")
    print("编码: cl100k_base（GPT-4 / GPT-3.5-turbo 常用）")

    samples = [
        "Hello, world!",
        "你好，世界！",
        "人工智能",
        "ChatGPT is amazing.",
        "def hello():\n    print('hi')",
        "The quick brown fox jumps over the lazy dog.",
    ]

    for sample in samples:
        inspect(sample)

    print(f"\n{'─' * 50}")
    print("结论: 同「字符数」≠ 同 Token 数；中文通常比英文更费 Token。")


if __name__ == "__main__":
    main()
