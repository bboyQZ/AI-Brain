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
