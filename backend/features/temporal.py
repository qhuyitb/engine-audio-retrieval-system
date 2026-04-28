"""
Đặc trưng thời gian — thể hiện "nhịp điệu" và năng lượng động cơ.

Lý do chọn:
- ZCR (Zero Crossing Rate): số lần tín hiệu đổi dấu/giây.
  Xe đạp điện → ZCR cao (nhiễu tần cao), xe tải diesel → ZCR thấp (bass nặng).
- RMS Energy: biên độ trung bình → đo "độ to" tổng thể của động cơ.
- Tempo: nhịp lặp đặc trưng (BPM) → pittong 4 kỳ có nhịp khác turbine liên tục.
"""

import numpy as np
import librosa

from backend import features


def extract_temporal_features(y: np.ndarray, sr: int = 22050) -> dict:
    features = {}

    # --- Zero Crossing Rate ---
    zcr = librosa.feature.zero_crossing_rate(y)
    features["zcr_mean"] = float(np.mean(zcr))
    features["zcr_std"]  = float(np.std(zcr))

    # --- RMS Energy ---
    rms = librosa.feature.rms(y=y)
    features["rms_mean"] = float(np.mean(rms))
    features["rms_std"]  = float(np.std(rms))

    # --- Tempo ---
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    features["tempo"] = float(np.atleast_1d(tempo)[0])

    return features


def get_feature_names_temporal() -> list[str]:
    return ["zcr_mean", "zcr_std", "rms_mean", "rms_std", "tempo"]