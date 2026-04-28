import numpy as np
from datetime import datetime
from qdrant_client.models import Filter, FieldCondition, MatchValue
from .collection import get_client
from .config     import COLLECTION_NAME


def build_payload(
    filename    : str,
    class_label : str,
    file_path   : str,
    duration_sec: float,
    sample_rate : int,
    meta        : dict,
) -> dict:
    return {
        "filename"    : filename,
        "class_label" : class_label,
        "file_path"   : file_path,
        "duration_sec": round(float(duration_sec), 3),
        "sample_rate" : int(sample_rate),
        "created_at"  : datetime.now().isoformat(),
        **{k: round(float(v), 6) for k, v in meta.items()},
    }


def search_similar(
    query_vector    : np.ndarray,
    top_k           : int = 5,
    filter_class    : str | None = None,
    score_threshold : float | None = None,
) -> list[dict]:
    client = get_client()

    qdrant_filter = None
    if filter_class:
        qdrant_filter = Filter(
            must=[FieldCondition(
                key="class_label",
                match=MatchValue(value=filter_class),
            )]
        )

    hits = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector.tolist(),
        limit=top_k,
        query_filter=qdrant_filter,
        score_threshold=score_threshold,
        with_payload=True,
    ).points

    return [
        {
            "rank"        : rank,
            "score"       : round(float(h.score), 4),
            "id"          : h.id,
            "filename"    : h.payload.get("filename"),
            "class_label" : h.payload.get("class_label"),
            "file_path"   : h.payload.get("file_path"),
            "duration_sec": h.payload.get("duration_sec"),
        }
        for rank, h in enumerate(hits, start=1)
    ]