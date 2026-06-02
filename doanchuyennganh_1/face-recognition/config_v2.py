"""
Cấu hình cho module nhận diện khuôn mặt.

Đặt thư mục này vào dự án:
face-recognition/
├── config_v2.py
├── utils_v2.py
├── face_attendance_mysql_api.py
├── train_face_model.py
├── extract_embeddings.py
├── prepare_dataset.py
├── test_camera.py
├── models/
├── dataset/
├── attendance_images/
└── recognition_logs/
"""

from pathlib import Path
import os

# =========================
# ĐƯỜNG DẪN THƯ MỤC
# =========================

BASE_DIR = Path(__file__).resolve().parent

DATASET_DIR = BASE_DIR / "dataset"
RAW_DATASET_DIR = DATASET_DIR / "raw"
PROCESSED_DATASET_DIR = DATASET_DIR / "processed"
EMBEDDINGS_DIR = DATASET_DIR / "embeddings"

MODEL_DIR = BASE_DIR / "models"
ATTENDANCE_IMAGES_DIR = BASE_DIR / "attendance_images"
RECOGNITION_LOGS_DIR = BASE_DIR / "recognition_logs"

YOLO_FACE_MODEL = MODEL_DIR / "yolov8n-face.pt"
SVM_MODEL_PATH = MODEL_DIR / "svm_face_model.pkl"
LABEL_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"

EMBEDDINGS_FILE = EMBEDDINGS_DIR / "face_embeddings.npz"

# =========================
# CẤU HÌNH CAMERA / ẢNH
# =========================

FRAME_WIDTH = 1280
FRAME_HEIGHT = 720

# Ảnh mặt sau khi crop sẽ resize về kích thước này để train/recognize đồng bộ.
FACE_IMAGE_SIZE = (160, 160)

# Margin crop mặt để lấy đủ vùng mặt, tránh crop quá sát.
FACE_MARGIN_X_RATIO = 0.18
FACE_MARGIN_Y_RATIO = 0.22

# =========================
# CẤU HÌNH MODEL NHẬN DIỆN
# =========================

# Các model DeepFace thường dùng: Facenet512, ArcFace, VGG-Face, Facenet
FACE_RECOGNITION_MODEL = os.getenv("FACE_RECOGNITION_MODEL", "Facenet512")

# Ngưỡng xác suất SVM.
# Nếu nhận diện nhầm nhiều thì tăng lên 0.75 hoặc 0.8.
# Nếu nhận diện khó ra thì giảm xuống 0.55 hoặc 0.6.
PREDICT_PROBA_THRESHOLD = float(os.getenv("PREDICT_PROBA_THRESHOLD", "0.65"))

# Nhãn model đang train là gì?
# True  => label là student_code, ví dụ: 23IT087
# False => label là id_student, ví dụ: 1, 2, 3
MODEL_LABEL_IS_STUDENT_CODE = os.getenv("MODEL_LABEL_IS_STUDENT_CODE", "true").lower() == "true"

# Tránh ghi điểm danh liên tục cùng 1 sinh viên trong thời gian ngắn.
ATTENDANCE_COOLDOWN_SECONDS = int(os.getenv("ATTENDANCE_COOLDOWN_SECONDS", "30"))

# =========================
# CẤU HÌNH MYSQL
# =========================

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "face_attendance_system")

# =========================
# CẤU HÌNH FASTAPI
# =========================

FACE_API_HOST = os.getenv("FACE_API_HOST", "0.0.0.0")
FACE_API_PORT = int(os.getenv("FACE_API_PORT", "8001"))

# Cho phép frontend gọi API.
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# =========================
# CẤU HÌNH TRAIN
# =========================

# Mỗi thư mục trong dataset/raw nên đặt theo student_code hoặc id_student.
# Ví dụ:
# dataset/raw/23IT087/anh1.jpg
# dataset/raw/23IT087/anh2.jpg
SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Số ảnh tối thiểu mỗi sinh viên để train.
MIN_IMAGES_PER_PERSON = 3
