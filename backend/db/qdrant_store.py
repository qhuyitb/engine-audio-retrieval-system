"""
Toàn bộ tầng data dùng Qdrant — không cần SQLite.

Qdrant lưu:
  - vector  : float32[72] đã L2-normalize
  - payload : tất cả metadata + raw feature values

Chạy Qdrant local:
    docker run -d -p 6333:6333 -v ${PWD}/qdrant_storage:/qdrant/storage qdrant/qdrant
"""

import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams,
    PointStruct, PointIdsList,
    Filter, FieldCondition, MatchValue,
    ScoredPoint,
)

COLLECTION_NAME = "engine_sounds"
VECTOR_DIM      = 72
QDRANT_URL      = "http://localhost:6333"


def get_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)


# ── Collection management ──────────────────────────────────────────────────────

def init_collection(recreate: bool = False):
    """
    Tạo collection nếu chưa có.
    recreate=True → xóa sạch và tạo lại (dùng khi rebuild toàn bộ index).
    """
    client = get_client()

    if recreate and client.collection_exists(COLLECTION_NAME):
        client.delete_collection(COLLECTION_NAME)
        print(f"Đã xóa collection '{COLLECTION_NAME}'")

    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_DIM,
                distance=Distance.COSINE,
            ),
        )
        print(f"Tạo collection '{COLLECTION_NAME}' (dim={VECTOR_DIM}, cosine)")
    else:
        print(f"Collection '{COLLECTION_NAME}' đã tồn tại")


def get_collection_info() -> dict:
    client = get_client()
    info = client.get_collection(COLLECTION_NAME)
    return {
        "points_count" : info.points_count,
        "status"       : str(info.status),
        "distance"     : str(info.config.params.vectors.distance),
        "vector_dim"   : info.config.params.vectors.size,
    }


# ── Write ──────────────────────────────────────────────────────────────────────

def upsert_point(point_id: int, vector: np.ndarray, payload: dict):
    """Thêm hoặc cập nhật 1 point."""
    client = get_client()
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=[PointStruct(
            id=point_id,
            vector=vector.tolist(),
            payload=payload,
        )],
    )


def upsert_batch(ids: list[int], vectors: np.ndarray, payloads: list[dict]):
    """
    Upsert nhiều point cùng lúc.
    Tự động chia batch 100 để tránh request quá lớn.
    """
    client = get_client()
    points = [
        PointStruct(id=i, vector=v.tolist(), payload=p)
        for i, v, p in zip(ids, vectors, payloads)
    ]
    batch_size = 100
    for start in range(0, len(points), batch_size):
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points[start : start + batch_size],
        )
    print(f"Upserted {len(points)} points.")


def delete_point(point_id: int):
    client = get_client()
    client.delete(
        collection_name=COLLECTION_NAME,
        points_selector=PointIdsList(points=[point_id]),
    )


# ── Read ───────────────────────────────────────────────────────────────────────

def search_similar(
    query_vector: np.ndarray,
    top_k: int = 5,
    filter_class: str | None = None,
) -> list[ScoredPoint]:
    """
    Tìm top-k âm thanh giống nhất với query_vector.

    Args:
        query_vector  : vector 72 chiều đã L2-normalize
        top_k         : số kết quả trả về
        filter_class  : nếu set, chỉ tìm trong class này (vd: "car")

    Returns:
        list[ScoredPoint] — mỗi item có .id, .score, .payload
    """
    client = get_client()

    qdrant_filter = None
    if filter_class:
        qdrant_filter = Filter(
            must=[FieldCondition(
                key="class_label",
                match=MatchValue(value=filter_class),
            )]
        )

    return client.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector.tolist(),
        limit=top_k,
        query_filter=qdrant_filter,
        with_payload=True,
    )


def get_point(point_id: int) -> dict | None:
    """Lấy 1 point theo id — trả payload đầy đủ."""
    client = get_client()
    results = client.retrieve(
        collection_name=COLLECTION_NAME,
        ids=[point_id],
        with_payload=True,
        with_vectors=False,
    )
    return dict(results[0].payload) if results else None


def get_all_points(batch_size: int = 100) -> list[dict]:
    """
    Lấy toàn bộ points — dùng scroll để tránh timeout.
    Trả list payload (không kèm vector).
    """
    client  = get_client()
    results = []
    offset  = None

    while True:
        batch, offset = client.scroll(
            collection_name=COLLECTION_NAME,
            limit=batch_size,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )
        results.extend([
            {"id": p.id, **p.payload} for p in batch
        ])
        if offset is None:
            break

    return results


def get_stats() -> dict:
    """Thống kê số file theo class — dùng cho trang Explorer."""
    all_points = get_all_points()
    by_class: dict[str, int] = {}
    for p in all_points:
        label = p.get("class_label", "unknown")
        by_class[label] = by_class.get(label, 0) + 1
    return {
        "total"    : len(all_points),
        "by_class" : by_class,
    }


# ── Test ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_collection(recreate=False)
    info = get_collection_info()
    print(info)