"""
Test toàn bộ backend/db/ — chạy từ root project.
Usage: python -m backend.db.test_db
"""

import sys
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from backend.db.collection import init_collection, get_collection_info
from backend.db.writer     import upsert_point, upsert_batch, delete_point
from backend.db.reader     import get_point, get_all_points, get_points_by_class, get_stats
from backend.db.search     import search_similar, build_payload

VECTOR_DIM = 72

def test_collection():
    print("\n=== 1. Init collection ===")
    init_collection(recreate=True)   # recreate=True để test sạch
    info = get_collection_info()
    for k, v in info.items():
        print(f"  {k}: {v}")
    assert info["points_count"] == 0
    assert info["vector_dim"]   == VECTOR_DIM
    print("  ✓ Collection ok")


def test_upsert_single():
    print("\n=== 2. Upsert 1 point ===")
    vec     = np.random.rand(VECTOR_DIM).astype(np.float32)
    vec     = vec / np.linalg.norm(vec)   # normalize
    meta    = {f"mfcc_{i}_mean": float(np.random.rand()) for i in range(1, 14)}
    payload = build_payload(
        filename    = "car_001.wav",
        class_label = "car",
        file_path   = "data/processed/car/car_001.wav",
        duration_sec= 5.0,
        sample_rate = 22050,
        meta        = meta,
    )
    upsert_point(point_id=1, vector=vec, payload=payload)

    result = get_point(1)
    assert result["filename"]    == "car_001.wav"
    assert result["class_label"] == "car"
    print(f"  filename    : {result['filename']}")
    print(f"  class_label : {result['class_label']}")
    print(f"  duration    : {result['duration_sec']}s")
    print("  ✓ Upsert single ok")


def test_upsert_batch():
    print("\n=== 3. Upsert batch (10 points) ===")
    classes = ["car", "car", "airplane", "airplane", "train",
               "train", "bus", "bus", "truck", "motorcycle"]
    ids, vectors, payloads = [], [], []

    for i, cls in enumerate(classes, start=2):
        vec = np.random.rand(VECTOR_DIM).astype(np.float32)
        vec = vec / np.linalg.norm(vec)
        meta = {f"mfcc_{j}_mean": float(np.random.rand()) for j in range(1, 14)}
        ids.append(i)
        vectors.append(vec)
        payloads.append(build_payload(
            filename    = f"{cls}_{i:03d}.wav",
            class_label = cls,
            file_path   = f"data/processed/{cls}/{cls}_{i:03d}.wav",
            duration_sec= 5.0,
            sample_rate = 22050,
            meta        = meta,
        ))

    upsert_batch(ids=ids, vectors=np.stack(vectors), payloads=payloads)

    info = get_collection_info()
    assert info["points_count"] == 11   # 1 + 10
    print(f"  Total points: {info['points_count']}")
    print("  ✓ Upsert batch ok")


def test_reader():
    print("\n=== 4. Reader ===")

    # get_all_points
    all_pts = get_all_points()
    print(f"  get_all_points     : {len(all_pts)} points")
    assert len(all_pts) == 11

    # get_points_by_class
    cars = get_points_by_class("car")
    print(f"  get_by_class(car)  : {len(cars)} points")
    assert len(cars) == 3   # 1 từ test trước + 2 batch

    # get_stats
    stats = get_stats()
    print(f"  get_stats total    : {stats['total']}")
    print(f"  by_class           : {stats['by_class']}")
    assert stats["total"] == 11
    print("  ✓ Reader ok")


def test_search():
    print("\n=== 5. Search similar ===")

    # Dùng vector của point id=1 làm query → phải ra chính nó ở rank 1
    from backend.db.reader import get_vector_by_id
    query_vec = get_vector_by_id(1)
    assert query_vec is not None

    results = search_similar(query_vector=query_vec, top_k=5)
    print(f"  Top-{len(results)} results:")
    for r in results:
        print(f"    rank {r['rank']} | score={r['score']:.4f} | {r['filename']} ({r['class_label']})")

    assert results[0]["id"]    == 1        # chính nó phải rank 1
    assert results[0]["score"] >= 0.999    # cosine với chính nó ≈ 1.0
    print("  ✓ Search ok")

    # Test filter theo class
    print("\n  Filter class=car:")
    car_results = search_similar(query_vector=query_vec, top_k=5, filter_class="car")
    for r in car_results:
        print(f"    rank {r['rank']} | score={r['score']:.4f} | {r['filename']}")
    assert all(r["class_label"] == "car" for r in car_results)
    print("  ✓ Filter ok")


def test_delete():
    print("\n=== 6. Delete ===")
    delete_point(1)
    result = get_point(1)
    assert result is None
    info = get_collection_info()
    assert info["points_count"] == 10
    print(f"  Sau khi xóa: {info['points_count']} points")
    print("  ✓ Delete ok")


if __name__ == "__main__":
    try:
        test_collection()
        test_upsert_single()
        test_upsert_batch()
        test_reader()
        test_search()
        test_delete()
        print("\n✓ Tất cả test pass — Phần 3 hoạt động tốt!\n")
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        raise