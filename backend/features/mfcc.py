"""
Trích xuất MFCC và các đặc trưng spectral liên quan.

Lý do chọn:
- MFCC (13-20 hệ số): bắt chước cách tai người xử lý âm thanh.
  Mean + std của mỗi hệ số → capture cả "hình dạng" và "biến thiên" theo thời gian.
- Delta MFCC: tốc độ thay đổi MFCC → phân biệt động cơ tăng tốc vs ổn định.
- Spectral Centroid: tần số trung tâm năng lượng (Hz) → turbine cao (~3000Hz), diesel thấp (~800Hz).
- Spectral Bandwidth: độ rộng phổ → động cơ "ồn" có bandwidth lớn.
- Spectral Rolloff: tần số mà 85% năng lượng nằm bên dưới → phân biệt âm bass nặng vs treble.
- Spectral Contrast: chênh lệch giữa đỉnh và đáy phổ theo từng sub-band → texture âm thanh.
"""

import numpy as np
import librosa


def extract_mfcc_features(y: np.ndarray, sr: int = 22050, n_mfcc: int = 13) -> dict:
    """
    Trả về dict các đặc trưng MFCC + spectral.
    Mỗi đặc trưng là mean + std theo thời gian → reduce từ (n, T) xuống (2n,).
    """
    features = {}

    # --- MFCC ---
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    for i in range(n_mfcc):
        features[f"mfcc_{i+1}_mean"] = float(np.mean(mfcc[i]))
        features[f"mfcc_{i+1}_std"]  = float(np.std(mfcc[i]))

    # --- Delta MFCC (first order difference) ---
    delta_mfcc = librosa.feature.delta(mfcc)
    for i in range(n_mfcc):
        features[f"delta_mfcc_{i+1}_mean"] = float(np.mean(delta_mfcc[i]))

    # --- Spectral Centroid ---
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    features["spectral_centroid_mean"] = float(np.mean(centroid))
    features["spectral_centroid_std"]  = float(np.std(centroid))

    # --- Spectral Bandwidth ---
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    features["spectral_bandwidth_mean"] = float(np.mean(bandwidth))
    features["spectral_bandwidth_std"]  = float(np.std(bandwidth))

    # --- Spectral Rolloff ---
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)
    features["spectral_rolloff_mean"] = float(np.mean(rolloff))
    features["spectral_rolloff_std"]  = float(np.std(rolloff))

    # --- Spectral Contrast (7 bands) ---
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=6)
    for i in range(contrast.shape[0]):
        features[f"spectral_contrast_{i+1}_mean"] = float(np.mean(contrast[i]))

    return features


def get_feature_names_mfcc(n_mfcc: int = 13) -> list[str]:
    """Danh sách tên đặc trưng theo thứ tự — dùng để build feature vector."""
    names = []
    for i in range(n_mfcc):
        names += [f"mfcc_{i+1}_mean", f"mfcc_{i+1}_std"]
    for i in range(n_mfcc):
        names.append(f"delta_mfcc_{i+1}_mean")
    names += [
        "spectral_centroid_mean", "spectral_centroid_std",
        "spectral_bandwidth_mean", "spectral_bandwidth_std",
        "spectral_rolloff_mean", "spectral_rolloff_std",
    ]
    for i in range(7):
        names.append(f"spectral_contrast_{i+1}_mean")
    return names