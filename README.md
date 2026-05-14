# CS-020 — Vehicle Detection Benchmark

Compare **YOLOv8** (CNN) and **RT-DETR** (Transformer) — solo and ensemble — across accuracy and speed metrics on your own video.

## Configurations

| Configuration | Description |
|---|---|
| YOLOv8 | Ultralytics YOLOv8n — CNN-based |
| RT-DETR | Ultralytics RT-DETR-L — Transformer-based |
| NMS Ensemble | YOLOv8 + RT-DETR fused with IoU-NMS |
| WBF Ensemble | YOLOv8 + RT-DETR fused with Weighted Box Fusion |

**Metrics:** Precision · Recall · F1 · mAP@0.5 · mAP@[.5:.95] · Temporal Consistency · Inference (ms) · FPS

---

## Quick Start

### Backend

```bash
cd benchmark/backend
pip install -r requirements.txt
python app.py
```

Runs on **http://localhost:5001**

> Model weights (`yolov8n.pt`, `rtdetr-l.pt`) download automatically on first run via Ultralytics.

### Frontend

```bash
cd benchmark/frontend
npm install
npm run dev
```

Runs on **http://localhost:5173**

---

## Usage

1. **No models needed:** Click **Load Sample Data** to preview the full dashboard with mock results.
2. **Live feed:** Upload a video — both YOLOv8 and RT-DETR streams appear side-by-side with real-time bounding boxes.
3. **Benchmark:** Click **Run Benchmark** → progress tracker updates as each config runs → results render automatically.
4. **Export:** Download all metrics as CSV for analysis.

> **Note:** Models are trained on COCO (street-level images). Use side-view footage (dashcam, traffic camera) for best results — aerial/top-down video will not produce detections.

---

## Project Structure

```
benchmark/
├── backend/
│   ├── app.py                      # Flask API
│   ├── models/
│   │   ├── yolov8_runner.py        # YOLOv8 inference
│   │   ├── efficientdet_runner.py  # RT-DETR inference
│   │   └── ensemble.py             # NMS + WBF fusion
│   ├── evaluation/
│   │   ├── metrics.py              # Precision/Recall/F1/mAP
│   │   └── benchmarker.py          # Orchestrates all 4 configs
│   ├── uploads/                    # Uploaded files (gitignored)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx                 # Root state + layout
    │   ├── components/             # UI components
    │   └── lib/api.js              # API calls
    ├── vite.config.js              # Proxy: /api → localhost:5001
    └── tailwind.config.js
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload video/image → `{ job_id }` |
| POST | `/api/benchmark/<job_id>` | Start benchmark (background thread) |
| GET | `/api/status/<job_id>` | Poll progress |
| GET | `/api/results/<job_id>` | Full metrics for all 4 configs |
| GET | `/api/stream/<job_id>?model=yolov8\|rtdetr` | MJPEG live detection stream |
| GET | `/api/preview/<job_id>/<config>` | Annotated frame (base64) |
| GET | `/api/export/<job_id>` | Download results as CSV |
| GET | `/api/sample` | Mock results (no models needed) |

---

## Requirements

- Python 3.9+ · Node 18+
- Key packages: `flask`, `ultralytics`, `ensemble-boxes`, `opencv-python`, `torch`
