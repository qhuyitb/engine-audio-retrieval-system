"""
backend/search/retrieval.py

Retrieval engine: nhận file .wav → trả top-5 giống nhất.

Flow:
    file .wav
        → load + normalize biên độ
        → extract features (72 dims)
        → StandardScaler
        → L2 normalize
        → Qdrant cosine similarity search
        → top-5 kết quả
"""

import numpy as np
import librosa
from pathlib import Path

from backend.features.extractor import get_all_feature_names, _load_scaler
from backend.features.mfcc      import extract_mfcc_features
from backend.features.temporal  import extract_temporal_features
from backend.features.harmonic  import extract_harmonic_features
from backend.db.search          import search_similar

TARGET_SR = 22050


def _extract_raw_vector(y: np.ndarray, sr: int) -> tuple[np.ndarray, dict]:
    """
    Extract features + apply StandardScaler CHƯA L2 normalize.
    Dùng để log norm_before thực tế trong intermediate steps.
    """
    mfcc_feats     = extract_mfcc_features(y, sr)
    temporal_feats = extract_temporal_features(y, sr)
    harmonic_feats = extract_harmonic_features(y, sr)
    meta = {**mfcc_feats, **temporal_feats, **harmonic_feats}

    feature_names = get_all_feature_names()
    vector = np.array([meta[name] for name in feature_names], dtype=np.float32)
    vector = np.nan_to_num(vector, nan=0.0, posinf=0.0, neginf=0.0)

    # Apply StandardScaler — CHƯA L2 normalize
    scaler = _load_scaler()
    if scaler is not None:
        mean, std = scaler
        std = np.where(std < 1e-8, 1.0, std)
        vector = (vector - mean) / std

    return vector, meta


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
    y, sr = librosa.load(str(filepath), sr=TARGET_SR, mono=True)
    duration = round(librosa.get_duration(y=y, sr=sr), 3)

    # Normalize biên độ
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))

    # Pad nếu quá ngắn
    min_samples = sr // 2
    if len(y) < min_samples:
        y = np.pad(y, (0, min_samples - len(y)))

    step_load = {
        "step"       : "Load audio",
        "sample_rate": sr,
        "duration"   : duration,
        "samples"    : len(y),
    }

    # ── Bước 2: Extract features ───────────────────────────────────────────────
    # Lấy vector sau StandardScaler nhưng CHƯA L2 normalize
    # để log norm_before thực tế
    vector_raw, meta = _extract_raw_vector(y, sr)

    step_extract = {
        "step"        : "Feature extraction",
        "vector_dim"  : len(vector_raw),
        "scaler"      : "StandardScaler applied (mean=0, std=1)",
        "sample_feats": {
            k: round(float(meta[k]), 4)
            for k in [
                "mfcc_1_mean", "spectral_centroid_mean",
                "zcr_mean", "rms_mean", "harmonic_ratio",
            ]
        },
    }

    # ── Bước 3: L2 normalize ───────────────────────────────────────────────────
    norm_before = float(np.linalg.norm(vector_raw))
    if norm_before > 0:
        vector_normalized = vector_raw / norm_before
    else:
        vector_normalized = vector_raw

    step_normalize = {
        "step"       : "L2 normalize",
        "norm_before": round(norm_before, 4),  # số thực vd: 8.7321
        "norm_after" : round(float(np.linalg.norm(vector_normalized)), 4),  # = 1.0
    }

    # ── Bước 4: Qdrant search ──────────────────────────────────────────────────
    results = search_similar(
        query_vector = vector_normalized,
        top_k        = top_k,
        filter_class = filter_class,
    )

    step_search = {
        "step"        : "Qdrant cosine search",
        "top_k"       : top_k,
        "filter_class": filter_class or "—",
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
        step["step"] = name  # restore

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