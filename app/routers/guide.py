from fastapi import APIRouter, HTTPException, Query

from app.services.source_extract import extract_source

router = APIRouter(prefix="/guide", tags=["guide"])


@router.get("/source")
def get_source(
    path: str = Query(..., description="相对仓库根的文件路径"),
    symbol: str | None = Query(None, description="函数/方法名，如 rag_chat 或 LLMClient.chat"),
):
    try:
        return extract_source(path, symbol)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="文件不存在")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
