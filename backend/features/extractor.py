"""
Pipeline tổng hợp: nhận file .wav → trả về feature vector numpy + dict metadata.

Dùng:
    from backend.features.extractor import extract_features
    vector, meta = extract_features("path/to/file.wav")
"""

import numpy as np
import librosa
from pathlib import Path

from .mfcc     import extract_mfcc_features,      get_feature_names_mfcc
from .temporal import extract_temporal_features,   get_feature_names_temporal
from .harmonic import extract_harmonic_features,   get_feature_names_harmonic

TARGET_SR       = 22050
AUDIO_DURATION  = None   # None = load toàn bộ; set số giây để chuẩn hóa độ dài


def get_all_feature_names() -> list[str]:
    """Thứ tự tên đặc trưng — PHẢI khớp với thứ tự build_vector bên dưới."""
    return (
        get_feature_names_mfcc(n_mfcc=13)
        + get_feature_names_temporal()
        + get_feature_names_harmonic()
    )


def extract_features(filepath: str | Path) -> tuple[np.ndarray, dict]:
    """
    Returns:
        vector (np.ndarray): shape (D,) — float32 feature vector
        meta   (dict)       : raw values từng nhóm, dùng để lưu DB
    """
    filepath = Path(filepath)
    y, sr = librosa.load(str(filepath), sr=TARGET_SR, mono=True, duration=AUDIO_DURATION)

    # Normalize biên độ phòng trường hợp chưa preprocess
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))

    # Trích xuất từng nhóm
    mfcc_feats     = extract_mfcc_features(y, sr)
    temporal_feats = extract_temporal_features(y, sr)
    harmonic_feats = extract_harmonic_features(y, sr)

    # Gộp metadata
    meta = {**mfcc_feats, **temporal_feats, **harmonic_feats}

    # Build vector theo thứ tự cố định
    feature_names = get_all_feature_names()
    vector = np.array([meta[name] for name in feature_names], dtype=np.float32)
    # --- validate ---
    if np.any(np.isnan(vector)) or np.any(np.isinf(vector)):
        nan_cols = [feature_names[i] for i in np.where(~np.isfinite(vector))[0]]
        raise ValueError(f"NaN/Inf trong vector tại: {nan_cols} — file: {filepath.name}")

    # --- L2 normalize cho Cosine distance  ---
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector, meta


def extract_features_batch(filepaths: list) -> tuple[np.ndarray, list[dict]]:
    """
    Xử lý nhiều file cùng lúc.
    Returns:
        matrix (np.ndarray): shape (N, D)
        metas  (list[dict])
    """
    vectors, metas = [], []
    for fp in filepaths:
        try:
            vec, meta = extract_features(fp)
            vectors.append(vec)
            metas.append(meta)
        except Exception as e:
            print(f"Lỗi {fp}: {e}")
    return np.stack(vectors), metas


if __name__ == "__main__":
    import sys
    fp = sys.argv[1] if len(sys.argv) > 1 else "data/processed/car/car_001.wav"
    vec, meta = extract_features(fp)
    print(f"Vector shape : {vec.shape}")
    print(f"Vector norm  : {np.linalg.norm(vec):.4f}")  # phải = 1.0
    print(f"Sample features:")
    for k in list(meta.keys())[:5]:
        print(f"  {k}: {meta[k]:.4f}")