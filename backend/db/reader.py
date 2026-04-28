import numpy as np
from qdrant_client.models import Filter, FieldCondition, MatchValue
from .collection import get_client
from .config     import COLLECTION_NAME


def get_point(point_id: int) -> dict | None:
    client  = get_client()
    results = client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[point_id],
        with_payload=True,
        with_vectors=False,
    )
    return {"id": results[0].id, **results[0].payload} if results else None


def get_vector_by_id(point_id: int) -> np.ndarray | None:
    client  = get_client()
    results = client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[point_id],
        with_payload=False,
        with_vectors=True,
    )
    return np.array(results[0].vector, dtype=np.float32) if results else None


def get_all_points() -> list[dict]:
    client, results, offset = get_client(), [], None
    while True:
        batch, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        results.extend([{"id": p.id, **p.payload} for p in batch])
        if offset is None:
            break
    return results


def get_points_by_class(class_label: str) -> list[dict]:
    client  = get_client()
    results = []
    offset  = None
    f = Filter(must=[FieldCondition(key="class_label", match=MatchValue(value=class_label))])
    while True:
        batch, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            scroll_filter=f,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        results.extend([{"id": p.id, **p.payload} for p in batch])
        if offset is None:
            break
    return results


def get_stats() -> dict:
    points   = get_all_points()
    by_class : dict[str, int] = {}
    for p in points:
        label = p.get("class_label", "unknown")
        by_class[label] = by_class.get(label, 0) + 1
    return {
        "total"    : len(points),
        "by_class" : dict(sorted(by_class.items())),
    }