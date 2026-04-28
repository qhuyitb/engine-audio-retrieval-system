"""
Đặc trưng hài âm — thể hiện cấu trúc cơ học và "sắc thái" âm.

Lý do chọn:
- Harmonic/Percussive ratio: phân tách thành phần hài âm (harmonic) và đập (percussive).
  Động cơ xăng bảo dưỡng tốt → nhiều harmonic. Diesel cũ → nhiều percussive (gõ, nổ).
- Chroma features (12 bins): phân bổ năng lượng theo 12 nốt nhạc (C, C#, D, ...).
  Bắt cấu trúc rung đặc trưng của từng loại động cơ — dù không phải nhạc cụ,
  động cơ pittong vẫn tạo harmonic theo tần số cơ bản × RPM.
"""

import numpy as np
import librosa


def extract_harmonic_features(y: np.ndarray, sr: int = 22050) -> dict:
    features = {}
    # --- pad nếu quá ngắn ---
    min_samples = sr // 2  # 0.5 giây
    if len(y) < min_samples:
        y = np.pad(y, (0, min_samples - len(y)))

    # --- Harmonic / Percussive separation ---
    y_harm, y_perc = librosa.effects.hpss(y)

    harm_energy = float(np.mean(y_harm ** 2))
    perc_energy = float(np.mean(y_perc ** 2))
    total_energy = harm_energy + perc_energy + 1e-10  # tránh chia 0

    features["harmonic_ratio"]   = harm_energy / total_energy
    features["percussive_ratio"] = perc_energy / total_energy

    # --- Chroma STFT (12 bins) ---
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    for i in range(12):
        features[f"chroma_{i+1}_mean"] = float(np.mean(chroma[i]))

    # --- Chroma std tổng thể ---
    features["chroma_std"] = float(np.std(chroma))

    return features


def get_feature_names_harmonic() -> list[str]:
    names = ["harmonic_ratio", "percussive_ratio"]
    for i in range(12):
        names.append(f"chroma_{i+1}_mean")
    names.append("chroma_std")
    return names