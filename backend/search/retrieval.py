"""
backend/search/retrieval.py

Retrieval engine: nhận file .wav → trả top-5 giống nhất.

Flow:
    file .wav
        → load + normalize
        → extract features (72 dims)
        → L2 normalize
        → Qdrant query_points (cosine similarity)
        → top-5 kết quả
"""

import numpy as np
import librosa
from pathlib import Path

from backend.features.extractor import extract_features
from backend.db.search          import search_similar


def retrieve(
    filepath     : str | Path,
    top_k        : int = 5,
    filter_class : str | None = None,
) -> dict:
    """
    Tìm top-k âm thanh giống nhất với file đầu vào.

    Args:
        filepath     : đường dẫn file .wav cần tìm kiếm
        top_k        : số kết quả trả về (mặc định 5)
        filter_class : chỉ tìm trong class này nếu set

    Returns:
        {
            "query"  : thông tin file query,
            "steps"  : các kết quả trung gian,
            "results": top-k kết quả
        }
    """
    filepath = Path(filepath)
    if not filepath.exists():
        raise FileNotFoundError(f"Không tìm thấy file: {filepath}")

    # ── Bước 1: Load audio ─────────────────────────────────────────────────────
    y, sr = librosa.load(str(filepath), sr=22050, mono=True)
    duration = round(librosa.get_duration(y=y, sr=sr), 3)

    step_load = {
        "step"       : "Load audio",
        "sample_rate": sr,
        "duration"   : duration,
        "samples"    : len(y),
    }

    # ── Bước 2: Extract features ───────────────────────────────────────────────
    vector_raw, meta = extract_features(filepath)

    step_extract = {
        "step"        : "Feature extraction",
        "vector_dim"  : len(vector_raw),
        "sample_feats": {
            k: round(float(meta[k]), 4)
            for k in [
                "mfcc_1_mean", "spectral_centroid_mean",
                "zcr_mean", "rms_mean", "harmonic_ratio",
            ]
        },
    }

    # ── Bước 3: L2 normalize (đã làm trong extract_features, log lại) ─────────
    norm = float(np.linalg.norm(vector_raw))
    step_normalize = {
        "step"       : "L2 normalize",
        "norm_before": round(norm, 4),
        "norm_after" : 1.0,
    }

    # ── Bước 4: Qdrant search ──────────────────────────────────────────────────
    results = search_similar(
        query_vector = vector_raw,
        top_k        = top_k,
        filter_class = filter_class,
    )

    step_search = {
        "step"        : "Qdrant cosine search",
        "top_k"       : top_k,
        "filter_class": filter_class,
        "best_score"  : results[0]["score"] if results else None,
        "worst_score" : results[-1]["score"] if results else None,
    }

    return {
        "query": {
            "filename"    : filepath.name,
            "file_path"   : str(filepath),
            "duration_sec": duration,
            "sample_rate" : sr,
        },
        "steps"  : [step_load, step_extract, step_normalize, step_search],
        "results": results,
    }


def print_retrieval_result(result: dict):
    """In kết quả retrieval ra terminal — dùng để demo."""
    print("\n" + "=" * 55)
    print("QUERY")
    print(f"  File    : {result['query']['filename']}")
    print(f"  Duration: {result['query']['duration_sec']}s")

    print("\nCÁC BƯỚC TRUNG GIAN")
    for step in result["steps"]:
        name = step.pop("step")
        print(f"  [{name}]")
        for k, v in step.items():
            print(f"    {k}: {v}")
        step["step"] = name   # restore

    print("\nTOP-5 KẾT QUẢ")
    print(f"  {'Rank':<6} {'Score':<8} {'File':<25} {'Class'}")
    print("  " + "-" * 55)
    for r in result["results"]:
        print(
            f"  {r['rank']:<6} "
            f"{r['score']:<8} "
            f"{r['filename']:<25} "
            f"{r['class_label']}"
        )
    print("=" * 55)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python -m backend.search.retrieval <path_to_wav>")
        sys.exit(1)

    result = retrieve(sys.argv[1], top_k=5)
    print_retrieval_result(result)