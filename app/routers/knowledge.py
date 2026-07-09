# app/routers/knowledge.py
from fastapi import APIRouter, HTTPException

from app.models.schemas import KnowledgeDocInfo, KnowledgeDocDetail
from app.services.ingest_service import list_knowledge_docs, read_knowledge_doc

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/docs", response_model=list[KnowledgeDocInfo])
def list_docs():
    return list_knowledge_docs()


@router.get("/docs/{doc_id}", response_model=KnowledgeDocDetail)
def get_doc(doc_id: str):
    doc = read_knowledge_doc(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"文档不存在: {doc_id}")
    return doc
