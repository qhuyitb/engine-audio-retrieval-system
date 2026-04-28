"""
Pipeline tổng hợp: nhận file .wav → trả về feature vector numpy + dict metadata.
"""

import numpy as np
import librosa
from pathlib import Path

from .mfcc     import extract_mfcc_features,     get_feature_names_mfcc
from .temporal import extract_temporal_features,  get_feature_names_temporal
from .harmonic import extract_harmonic_features,  get_feature_names_harmonic

TARGET_SR      = 22050
AUDIO_DURATION = None


def get_all_feature_names() -> list[str]:
    return (
        get_feature_names_mfcc(n_mfcc=13)
        + get_feature_names_temporal()
        + get_feature_names_harmonic()
    )


# Thống kê mean/std của từng feature trên toàn dataset
# Tính 1 lần bằng script compute_scaler.py, lưu vào file này
# Nếu chưa có → dùng heuristic scale thủ công
_SCALER_PATH = Path(__file__).parent / "scaler_params.npz"


def _load_scaler() -> tuple[np.ndarray, np.ndarray] | None:
    """Load mean/std từ file nếu đã compute."""
    if _SCALER_PATH.exists():
        data = np.load(_SCALER_PATH)
        return data["mean"], data["std"]
    return None


def extract_features(filepath: str | Path) -> tuple[np.ndarray, dict]:
    filepath = Path(filepath)
    y, sr = librosa.load(str(filepath), sr=TARGET_SR, mono=True, duration=AUDIO_DURATION)

    # Normalize biên độ
    if np.max(np.abs(y)) > 0:
        y = y / np.max(np.abs(y))

    # Pad nếu quá ngắn
    min_samples = sr // 2
    if len(y) < min_samples:
        y = np.pad(y, (0, min_samples - len(y)))

    # Extract từng nhóm
    mfcc_feats     = extract_mfcc_features(y, sr)
    temporal_feats = extract_temporal_features(y, sr)
    harmonic_feats = extract_harmonic_features(y, sr)

    meta = {**mfcc_feats, **temporal_feats, **harmonic_feats}

    # Build vector
    feature_names = get_all_feature_names()
    vector = np.array([meta[name] for name in feature_names], dtype=np.float32)

    # Validate
    if np.any(np.isnan(vector)) or np.any(np.isinf(vector)):
        nan_cols = [feature_names[i] for i in np.where(~np.isfinite(vector))[0]]
        raise ValueError(f"NaN/Inf tại: {nan_cols} — file: {filepath.name}")

    # StandardScaler nếu đã có params
    scaler = _load_scaler()
    if scaler is not None:
        mean, std = scaler
        std = np.where(std < 1e-8, 1.0, std)   # tránh chia 0
        vector = (vector - mean) / std

    # L2 normalize
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector, meta


def extract_features_batch(filepaths: list) -> tuple[np.ndarray, list[dict]]:
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
    print(f"Vector norm  : {np.linalg.norm(vec):.4f}")
    print(f"Sample features:")
    for k in list(meta.keys())[:5]:
        print(f"  {k}: {meta[k]:.4f}")