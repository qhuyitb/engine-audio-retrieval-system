# 🚗 Engine Audio Retrieval System

Hệ thống tìm kiếm và so sánh độ tương đồng âm thanh các phương tiện giao thông (airplane, car, train, ...) sử dụng hand-crafted audio features + Qdrant vector database.

---

## 📌 Mô tả

Dự án xây dựng hệ thống **audio retrieval** hoàn chỉnh:
- Trích xuất 72 đặc trưng âm thanh (MFCC, Spectral, Temporal, Harmonic)
- Chuẩn hóa vector bằng StandardScaler + L2 normalize
- Lưu trữ và tìm kiếm bằng Qdrant vector database (Cosine similarity, HNSW index)
- REST API với FastAPI, giao diện demo với Next.js
- Đánh giá hệ thống: MAP@5 = 90.7% trên 800 files, 8 class

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
│   │   ├── extractor.py               # Pipeline tổng hợp + StandardScaler + L2 normalize
│   │   ├── mfcc.py                    # MFCC + Spectral features (52 dims)
│   │   ├── temporal.py                # ZCR, RMS, Tempo (5 dims)
│   │   ├── harmonic.py                # Harmonic ratio, Chroma (15 dims)
│   │   └── scaler_params.npz          # StandardScaler params — generated bởi compute_scaler.py
│   │
│   ├── db/
│   │   ├── config.py                  # Qdrant constants (URL, collection, dim, HNSW)
│   │   ├── collection.py              # Init/delete/info collection
│   │   ├── writer.py                  # Upsert/delete points
│   │   ├── reader.py                  # Get points, scroll, stats
│   │   └── search.py                  # Cosine similarity search + build_payload
│   │
│   ├── search/
│   │   └── retrieval.py               # Retrieval engine — file .wav → top-5
│   │
│   └── scripts/
│       ├── check_dataset.py           # Kiểm tra dataset trước khi xử lý
│       ├── preprocess_audio.py        # Chuẩn hóa audio (mono, 22050Hz, [-1,1])
│       ├── compute_scaler.py          # Tính StandardScaler params → scaler_params.npz
│       ├── extract_all_features.py    # Build Qdrant index từ toàn bộ dataset
│       └── evaluate.py               # Đánh giá P@K, MAP@K, Confusion Matrix
│
├── frontend/                          # Next.js + React
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx               # Trang chủ
│       │   ├── search/
│       │   │   └── page.tsx           # Search Engine — upload file, top-5 kết quả
│       │   ├── explorer/
│       │   │   └── page.tsx           # Dataset Explorer — duyệt và nghe audio
│       │   ├── stats/
│       │   │   └── page.tsx           # Stats — thống kê dataset + Qdrant info
│       │   └── evaluation/
│       │       └── page.tsx           # Evaluation — P@K, MAP@K, Confusion Matrix
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
│   ├── processed/                     # File đã chuẩn hóa (gitignored)
│   │   ├── airplane/
│   │   ├── bicycle/
│   │   ├── bus/
│   │   ├── car/
│   │   ├── helicopter/
│   │   ├── motorcycle/
│   │   ├── train/
│   │   └── truck/
│   └── metadata/                      # Kết quả evaluation (gitignored)
│       ├── eval_results_k1.json
│       ├── eval_results_k5.json
│       ├── eval_results_k10.json
│       └── confusion_matrix_k5.json
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

---

## ⚙️ Cài đặt

```bash
# 1. Tạo và kích hoạt virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# 2. Cài dependencies
pip install -r backend/requirements.txt

# 3. Khởi động Qdrant bằng Docker
docker run -d -p 6333:6333 \
  -v ${PWD}/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Kiểm tra Qdrant đang chạy
curl http://localhost:6333/healthz
```

---

## 🚀 Chạy hệ thống (lần đầu)

Chạy theo đúng thứ tự sau:

```bash
# Bước 1: Kiểm tra dataset
python -m backend.scripts.check_dataset

# Bước 2: Tiền xử lý audio (mono, 22050Hz, normalize biên độ)
python -m backend.scripts.preprocess_audio

# Bước 3: Tính StandardScaler params trên toàn dataset (~3.5 phút)
python -m backend.scripts.compute_scaler

# Bước 4: Build Qdrant index — extract features + upsert 800 points (~3.5 phút)
python -m backend.scripts.extract_all_features

# Bước 5: Chạy API server
python -m uvicorn backend.main:app --reload --port 8000

# Bước 6: Chạy frontend
cd frontend && npm install && npm run dev
```

---

## 🔍 Test retrieval từ terminal

```bash
python -m backend.search.retrieval data/processed/car/car_001.wav
python -m backend.search.retrieval data/processed/airplane/airplane_001.wav
```

---

## 📊 Đánh giá hệ thống

```bash
# Precision, Recall, MAP @ K=1, 5, 10
python -m backend.scripts.evaluate --k 1
python -m backend.scripts.evaluate --k 5
python -m backend.scripts.evaluate --k 10

# Confusion matrix K=5
python -m backend.scripts.evaluate --confusion --k 5
```

**Kết quả thực nghiệm (800 files, 8 classes):**

| K | Precision@K | MAP@K |
|---|-------------|-------|
| 1 | 90.0% | 90.0% |
| 5 | 85.1% | 90.7% |
| 10 | 81.9% | 89.2% |

---

## 🌐 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/search` | Upload file .wav → top-5 giống nhất |
| GET | `/api/audio` | Danh sách audio (filter theo class) |
| GET | `/api/audio/{id}` | Thông tin 1 file |
| DELETE | `/api/audio/{id}` | Xóa 1 file khỏi index |
| GET | `/api/stats` | Thống kê dataset |
| GET | `/api/stats/collection` | Thông tin Qdrant collection |

Swagger UI: http://localhost:8000/docs

---

## 🔊 Pipeline xử lý

```
file .wav
  → load (mono, 22050Hz)
  → normalize biên độ [-1, 1]
  → extract 72 features (MFCC × 39 + Spectral × 13 + Temporal × 5 + Harmonic × 15)
  → StandardScaler (mean=0, std=1)
  → L2 normalize (|vector| = 1.0)
  → Qdrant cosine similarity search (HNSW index)
  → top-5 kết quả
```

---

## ⚠️ Lưu ý

- Đảm bảo Docker đang chạy **trước** khi start API server
- Phải chạy `compute_scaler.py` **trước** `extract_all_features.py`
- Các thành viên phải dùng cùng dataset và cùng file `scaler_params.npz`
- Không commit: `data/raw/`, `data/processed/`, `qdrant_storage/`, `data/metadata/`
- Nếu rebuild index: chạy `extract_all_features.py --recreate`

---

## 📄 License

MIT License © 2026 Quang Huy