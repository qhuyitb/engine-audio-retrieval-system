import numpy as np
from qdrant_client.models import PointStruct, PointIdsList
from .collection import get_client
from .config     import COLLECTION_NAME


def upsert_point(point_id: int, vector: np.ndarray, payload: dict):
    client = get_client()
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[PointStruct(
            id=point_id,
            vector=vector.tolist(),
            payload=payload,
        )],
    )


def upsert_batch(
    ids       : list[int],
    vectors   : np.ndarray,
    payloads  : list[dict],
    batch_size: int = 100,
):
    client = get_client()
    points = [
        PointStruct(id=i, vector=v.tolist(), payload=p)
        for i, v, p in zip(ids, vectors, payloads)
    ]
    total = len(points)
    for start in range(0, total, batch_size):
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points[start : start + batch_size],
        )
        print(f"[Qdrant] Upserted {min(start + batch_size, total)}/{total}...")
    print(f"[Qdrant] Hoàn thành {total} points.")


def delete_point(point_id: int):
    client = get_client()
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=PointIdsList(points=[point_id]),
    )
    print(f"[Qdrant] Đã xóa point id={point_id}")