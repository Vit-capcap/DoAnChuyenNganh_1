# Face Recognition Module

Module này dùng cho dự án hệ thống quản lý lớp học và điểm danh nhận diện khuôn mặt.

## 1. Cấu trúc thư mục

```txt
face-recognition/
├── config_v2.py
├── utils_v2.py
├── face_attendance_mysql_api.py
├── train_face_model.py
├── extract_embeddings.py
├── prepare_dataset.py
├── test_camera.py
├── models/
│   ├── svm_face_model.pkl
│   ├── label_encoder.pkl
│   └── yolov8n-face.pt
├── dataset/
│   ├── raw/
│   ├── processed/
│   └── embeddings/
├── attendance_images/
├── recognition_logs/
├── requirements.txt
└── README.md
```

## 2. Cài thư viện

```bash
cd face-recognition
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Nếu dùng Linux/macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

## 3. Chuẩn bị model YOLO

Đặt file YOLO vào:

```txt
face-recognition/models/yolov8n-face.pt
```

## 4. Chuẩn bị dataset

Tạo dữ liệu theo dạng:

```txt
dataset/raw/
├── 23IT087/
│   ├── 1.jpg
│   ├── 2.jpg
│   ├── 3.jpg
├── 23IT088/
│   ├── 1.jpg
│   ├── 2.jpg
│   ├── 3.jpg
```

Tên thư mục nên là `student_code` để khớp với bảng `Student.student_code`.

Nếu muốn dùng `id_student`, chỉnh trong `config_v2.py`:

```python
MODEL_LABEL_IS_STUDENT_CODE = False
```

## 5. Train model

Chạy lần lượt:

```bash
python prepare_dataset.py
python extract_embeddings.py
python train_face_model.py
```

Sau khi train xong sẽ có:

```txt
models/svm_face_model.pkl
models/label_encoder.pkl
```

## 6. Test camera local

```bash
python test_camera.py
```

Nhấn `ESC` để thoát.

## 7. Chạy API nhận diện

```bash
python face_attendance_mysql_api.py
```

API chạy tại:

```txt
http://localhost:8001
```

Test:

```txt
GET http://localhost:8001/health
```

## 8. API nhận diện

Endpoint:

```txt
POST http://localhost:8001/recognize
```

Body:

```json
{
  "image_base64": "data:image/jpeg;base64,...",
  "id_session": 1,
  "camera_id": 1
}
```

Response mẫu:

```json
{
  "message": "Đã xử lý nhận diện",
  "id_session": 1,
  "camera_id": 1,
  "total_faces": 1,
  "faces": [
    {
      "label": "23IT087",
      "id_student": 1,
      "student_code": "23IT087",
      "full_name": "Nguyễn Quốc Hoàng",
      "confidence": 0.92,
      "status": "ATTENDANCE_SAVED",
      "result": "SUCCESS"
    }
  ]
}
```

## 9. Dữ liệu được lưu vào MySQL

Module lưu vào 2 bảng:

### RecognitionHistory

Lưu lịch sử nhận diện:

```txt
id_student
capture_time
confidence
camera_id
result
image_path
```

### Attendance

Lưu/cập nhật điểm danh:

```txt
id_session
id_student
check_in_time
status
confidence_score
face_image
note
```

Nếu đã có bản ghi `Attendance` của sinh viên trong buổi học thì UPDATE.
Nếu chưa có thì INSERT.

## 10. Cấu hình MySQL

Mặc định trong `config_v2.py`:

```python
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "face_attendance_system"
```

Có thể cấu hình bằng biến môi trường:

```bash
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=
set DB_NAME=face_attendance_system
```

## 11. Tích hợp frontend

Trong React gọi API `http://localhost:8001/recognize`.

File frontend gợi ý:

```txt
src/api/faceRecognitionApi.js
src/pages/teacher/TeacherFaceRecognitionPage.jsx
```

## 12. Lưu ý quan trọng

- `label_encoder.pkl` phải có label trùng với `Student.student_code` hoặc `Student.id_student`.
- Sinh viên phải đã được ghi danh trong bảng `Enrollment`.
- Buổi học phải tồn tại trong bảng `Session`.
- `id_session` gửi từ frontend phải đúng buổi học giáo viên đang điểm danh.
