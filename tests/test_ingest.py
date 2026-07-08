"""知识源指纹与自动入库检测。"""

from app.services.ingest_service import (
    compute_sources_fingerprint,
    load_ingest_manifest,
    save_ingest_manifest,
    sources_changed,
)


def test_fingerprint_stable_for_same_content():
    fp1 = compute_sources_fingerprint()
    fp2 = compute_sources_fingerprint()
    assert fp1 == fp2
    assert len(fp1) == 64


def test_sources_changed_after_manifest_save():
    fp = compute_sources_fingerprint()
    save_ingest_manifest(fp, {"ingested": 1, "total": 1})
    assert sources_changed() is False


def test_manifest_roundtrip():
    save_ingest_manifest("abc123", {"ingested": 10, "total": 10})
    m = load_ingest_manifest()
    assert m["fingerprint"] == "abc123"
    assert m["ingested"] == 10
