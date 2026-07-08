# app/services/attention_service.py
from transformers import AutoTokenizer, AutoModel
import torch

from app.config import EMBEDDING_MODEL_NAME
from app.models.schemas import AttentionResponse, AttentionLayer

_tokenizer = None
_model = None


def _load():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
        _model = AutoModel.from_pretrained(EMBEDDING_MODEL_NAME, output_attentions=True)
        _model.eval()
    return _tokenizer, _model


def extract_attention(text: str) -> AttentionResponse:
    tokenizer, model = _load()
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
    attentions = outputs.attentions  # tuple of (1, num_heads, seq_len, seq_len)
    tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
    layers = []
    for i, attn in enumerate(attentions):
        heads = attn[0].tolist()  # (num_heads, seq_len, seq_len)
        layers.append(AttentionLayer(layer=i, heads=heads))
    return AttentionResponse(
        text=text,
        tokens=tokens,
        num_layers=len(attentions),
        num_heads=attentions[0].shape[1],
        layers=layers,
        model=EMBEDDING_MODEL_NAME,
    )
