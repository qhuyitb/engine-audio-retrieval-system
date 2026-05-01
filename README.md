# 🚗 Vehicle Sound Similarity System

Hệ thống tìm kiếm và so sánh độ tương đồng âm thanh các phương tiện giao thông (airplane, car, train, ...).

---

## 📌 Mô tả

Dự án xử lý audio đầu vào, trích xuất đặc trưng và xây dựng mô hình để:
- So sánh độ tương đồng giữa các âm thanh
- Truy xuất top-k âm thanh giống nhất
- Ứng dụng cho bài toán audio retrieval

---

## 📁 Project Structure

```bash
engine-audio-retrieval-system/
│
├── README.md
├── .gitignore
│
├── backend/
│   ├── main.py                        # Entry point: uvicorn backend.main:app
│   ├── requirements.txt
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── schemas.py
│   │   └── routes/
│   │       ├── search.py              # POST /search — upload file, trả top-5
│   │       ├── audio.py               # CRUD audio records
│   │       └── stats.py               # Thống kê dataset
│   │
│   ├── features/
│   │   ├── extractor.py               # Pipeline tổng hợp
│   │   ├── mfcc.py                    # MFCC + spectral features
│   │   ├── temporal.py                # ZCR, RMS energy, Tempo
│   │   ├── harmonic.py                # Harmonic/Percussive features
│   │   └── scaler_params.npz          # StandardScaler params (generated)
│   │
│   ├── db/
│   │   ├── config.py                  # Qdrant config constants
│   │   ├── collection.py              # Init/delete/info collection
│   │   ├── writer.py                  # Upsert/delete points
│   │   ├── reader.py                  # Get points, stats
│   │   └── search.py                  # Similarity search + build_payload
│   │
│   ├── search/
│   │   └── retrieval.py               # Retrieval engine — file .wav → top-5
│   │
│   └── scripts/
│       ├── check_dataset.py           # Kiểm tra dataset
│       ├── preprocess_audio.py        # Chuẩn hóa audio
│       ├── compute_scaler.py          # Tính StandardScaler params
│       └── extract_all_features.py    # Build Qdrant index
│
├── frontend/                          # Next.js + React
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx               # Trang chủ
│       │   ├── explorer/
│       │   │   └── page.tsx           # Dataset Explorer
│       │   └── search/
│       │       └── page.tsx           # Search Engine — trang demo chính
│       ├── components/
│       │   ├── AudioPlayer.tsx
│       │   ├── SimilarityChart.tsx
│       │   ├── ResultCard.tsx
│       │   └── SearchPipeline.tsx
│       └── lib/
│           ├── api.ts
│           └── types.ts
│
├── data/
│   ├── raw/                           # File âm thanh gốc (gitignored)
│   │   ├── Airplane/
│   │   ├── Bics/
│   │   ├── Bus/
│   │   ├── Cars/
│   │   ├── Helicopter/
│   │   ├── Motocycles/
│   │   ├── Train/
│   │   └── Truck/
│   └── processed/                     # File đã chuẩn hóa (gitignored)
│       ├── airplane/
│       ├── bicycle/
│       ├── bus/
│       ├── car/
│       ├── helicopter/
│       ├── motorcycle/
│       ├── train/
│       └── truck/
│
└── qdrant_storage/                    # Qdrant data volume (gitignored)
```

---

## 📦 Dataset

Dataset **không được lưu trong repo**. Tải tại:

👉 https://drive.google.com/drive/folders/1bFD9h3TCubiwOWnEUVhi-ZuHEcAMSB76?usp=drive_link

### 🔧 Setup dữ liệu

1. Tải folder từ link trên và giải nén

2. Sau khi giải nén sẽ có cấu trúc:
```
engine-audio-dataset/        ← xóa thư mục bọc ngoài này
    Airplane/
    Bics/
    Bus/
    ...
```

3. Chuyển các thư mục con vào thẳng `data/raw/` — kết quả đúng:
```
data/raw/
    Airplane/
    Bics/
    Bus/
    Cars/
    Helicopter/
    Motocycles/
    Train/
    Truck/
```

4. Chạy script tiền xử lý:
```bash
python -m backend.scripts.preprocess_audio
```

---

## ⚙️ Cài đặt

```bash
# 1. Tạo và kích hoạt virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# 2. Cài dependencies
pip install -r backend/requirements.txt

# 3. Khởi động Qdrant
docker run -d -p 6333:6333 \
  -v ${PWD}/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

---

## 🚀 Chạy hệ thống

```bash
# Bước 1: Kiểm tra dataset
python -m backend.scripts.check_dataset

# Bước 2: Tiền xử lý audio
python -m backend.scripts.preprocess_audio

# Bước 3: Tính StandardScaler params
python -m backend.scripts.compute_scaler

# Bước 4: Build Qdrant index
python -m backend.scripts.extract_all_features

# Bước 5: Chạy API server
python -m uvicorn backend.main:app --reload --port 8000

# Bước 6: Test retrieval
python -m backend.search.retrieval data/processed/car/car_001.wav
```

---

## 🔊 Tiền xử lý audio

Script `preprocess_audio.py` sẽ:
- Convert audio về **mono**
- Resample về **22050 Hz**
- Normalize biên độ về **[-1, 1]**
- Đổi tên và chuẩn hóa theo class label

---

## ⚠️ Lưu ý

- Không commit thư mục `data/raw/`, `data/processed/`, `qdrant_storage/`
- Đảm bảo Docker đang chạy trước khi start API server
- Phải chạy `compute_scaler.py` trước `extract_all_features.py`
- Các thành viên phải dùng cùng dataset và cùng `scaler_params.npz`

---


## 📄 License

MIT License

Copyright (c) 2026 Quang Huy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.