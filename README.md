```markdown
# 🚗 Vehicle Sound Similarity System

Hệ thống tìm kiếm và so sánh độ tương đồng âm thanh các phương tiện giao thông (airplane, car, train, ...).

---

## 📌 Mô tả

Dự án xử lý audio đầu vào, trích xuất đặc trưng và xây dựng mô hình để:
- So sánh độ tương đồng giữa các âm thanh
- Truy xuất top-k âm thanh giống nhất
- Ứng dụng cho bài toán audio retrieval

---

## 📁 Cấu trúc thư mục

```

## 📁 Project Structure

```bash
engine-audio-retrieval-system/
│
├── README.md                          # Mô tả dự án, hướng dẫn cài đặt
├── .gitignore
│
├── backend/                           # FastAPI + toàn bộ logic Python
│   ├── main.py                        # Entry point: uvicorn backend.main:app
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example
│   │
│   ├── api/                           # REST API
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── search.py              # POST /search — upload file, trả top-5
│   │   │   ├── audio.py               # CRUD audio records
│   │   │   └── stats.py               # Thống kê dataset
│   │   └── schemas.py                 # Pydantic schemas
│   │
│   ├── features/                      # Trích xuất đặc trưng âm thanh
│   │   ├── __init__.py
│   │   ├── extractor.py               # Pipeline tổng hợp
│   │   ├── mfcc.py                    # MFCC features
│   │   ├── spectral.py                # Spectral Centroid, Rolloff, Bandwidth
│   │   ├── temporal.py                # ZCR, RMS energy, Tempo
│   │   └── harmonic.py                # Harmonic/Percussive features
│   │
│   ├── search/                        # Hệ thống tìm kiếm
│   │   ├── __init__.py
│   │   ├── similarity.py              # Cosine, Euclidean similarity
│   │   ├── indexer.py                 # Xây dựng FAISS index
│   │   └── retrieval.py              # Query & trả về top-5
│   │
│   ├── db/                            # Tầng truy cập CSDL
│   │   ├── __init__.py
│   │   ├── models.py                  # ORM models (SQLAlchemy)
│   │   ├── crud.py                    # Create/Read/Update/Delete
│   │   └── connection.py              # Kết nối SQLite
│   │
│   └── scripts/                       # Chạy 1 lần để setup dữ liệu
│       ├── preprocess_audio.py        # Chuẩn hóa audio (độ dài, sample rate)
│       ├── extract_all_features.py    # Trích xuất features toàn bộ dataset
│       ├── build_index.py             # Xây dựng FAISS index
│       └── evaluate.py               # Đánh giá độ chính xác hệ thống
│
├── frontend/                          # Next.js + React
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── app/                       # Next.js App Router
│       │   ├── layout.tsx
│       │   ├── page.tsx               # Trang chủ
│       │   ├── explorer/
│       │   │   └── page.tsx           # Dataset Explorer — thống kê, nghe thử
│       │   ├── features/
│       │   │   └── page.tsx           # Feature Viewer — xem đặc trưng từng file
│       │   └── search/
│       │       └── page.tsx           # Search Engine — trang demo chính
│       │
│       ├── components/
│       │   ├── AudioPlayer.tsx        # Phát audio
│       │   ├── Waveform.tsx           # Vẽ waveform + spectrogram
│       │   ├── FeatureTable.tsx       # Bảng MFCC, spectral values
│       │   ├── SimilarityChart.tsx    # Bar chart điểm similarity
│       │   ├── ResultCard.tsx         # Hiển thị 1 kết quả trong top-5
│       │   └── SearchPipeline.tsx     # Kết quả trung gian step-by-step
│       │
│       └── lib/
│           ├── api.ts                 # Gọi FastAPI endpoints
│           └── types.ts               # TypeScript types/interfaces
│
├── data/                              # Toàn bộ dữ liệu
│   ├── raw/                           # File âm thanh gốc 500+ files
│   │   ├── diesel/
│   │   ├── gasoline/
│   │   ├── electric/
│   │   ├── turbine/
│   │   └── ...
│   ├── processed/                     # File đã chuẩn hóa (cùng độ dài, sample rate)
│   ├── metadata/
│   │   ├── audio_metadata.csv         # Tên file, loại động cơ, duration, sr...
│   │   └── feature_vectors.csv        # Vector đặc trưng của từng file
│   └── indexes/                       # Generated, gitignored
│       ├── faiss_index.bin
│       └── id_mapping.json            # Map FAISS index → file ID trong DB
│
├── database/                          # CSDL
│   ├── schema.sql                     # Schema SQLite
│   └── engine_sounds.db               # SQLite database
│
├── notebooks/                         # Jupyter — phân tích & báo cáo
│   ├── 01_dataset_exploration.ipynb
│   ├── 02_feature_analysis.ipynb
│   ├── 03_similarity_search_demo.ipynb
│   └── 04_evaluation_results.ipynb
│
├── tests/                             # Unit tests
│   ├── test_features.py
│   ├── test_search.py
│   └── test_db.py
│
└── reports/                           # Báo cáo
    ├── figures/                       # Biểu đồ, spectrogram xuất từ notebook
    └── final_report.pdf
```bash

```

---

## 📦 Dataset

Dataset **không được lưu trong repo**. Tải tại:

👉 https://drive.google.com/drive/folders/1bFD9h3TCubiwOWnEUVhi-ZuHEcAMSB76?usp=drive_link

### 🔧 Setup dữ liệu

1. Tải folder `raw/` từ link trên  
2. Đặt vào thư mục:
```

data/raw/

```
3. Chạy script tiền xử lý:
```

python backend/scripts/preprocess_audio.py

````

---

## ⚙️ Cài đặt

```bash
pip install -r requirements.txt
````

---

## 🔊 Tiền xử lý audio

Script `preprocess_audio.py` sẽ:

* Convert audio về **mono**
* Resample về **22050Hz**
* Normalize biên độ về **[-1, 1]**
* Đổi tên và chuẩn hóa label

---

## 🧪 Kiểm tra dataset

```bash
python backend/scripts/check_dataset.py
```

---

## 🚀 Hướng phát triển

* Trích xuất đặc trưng (Mel Spectrogram / MFCC)
* Xây dựng model (CNN / Siamese Network)
* Triển khai tìm kiếm top-k tương đồng
* Xây dựng demo (Streamlit / FastAPI)

---

## ⚠️ Lưu ý

* Không commit thư mục `data/raw/` và `data/processed/`
* Đảm bảo cấu trúc dataset đúng trước khi train
* Các thành viên phải dùng cùng dataset

---

## 👥 Team


```
```



