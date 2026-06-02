# import os
# import time
# import json
# import joblib
# import uvicorn
# import cv2
# import numpy as np
# import mysql.connector
# from pathlib import Path
# from datetime import datetime
# from typing import Optional, List, Dict, Any

# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from ultralytics import YOLO
# from deepface import DeepFace

# from config_v2 import (
#     YOLO_FACE_MODEL,
#     SVM_MODEL_PATH,
#     LABEL_ENCODER_PATH,
#     FACE_RECOGNITION_MODEL,
#     PREDICT_PROBA_THRESHOLD,
#     MODEL_LABEL_IS_STUDENT_CODE,
#     ATTENDANCE_COOLDOWN_SECONDS,
#     ATTENDANCE_IMAGES_DIR,
#     RECOGNITION_LOGS_DIR,
#     DB_HOST,
#     DB_PORT,
#     DB_USER,
#     DB_PASSWORD,
#     DB_NAME,
#     FACE_API_HOST,
#     FACE_API_PORT,
#     CORS_ORIGINS,
# )
# from utils_v2 import (
#     ensure_dirs,
#     crop_face_with_margin,
#     resize_face,
#     base64_to_image,
#     imwrite_unicode,
#     draw_face_box,
#     image_to_base64,
#     now_string,
#     get_attendance_status_by_time,
# )


# app = FastAPI(
#     title="Face Attendance Recognition API",
#     version="1.0.0",
#     description="YOLO + DeepFace + SVM API cho hệ thống điểm danh khuôn mặt",
# )

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# detector = None
# svm_model = None
# label_encoder = None
# last_mark = {}


# class RecognizeRequest(BaseModel):
#     image_base64: str
#     id_session: int
#     camera_id: Optional[int] = None


# class RecognizedFace(BaseModel):
#     label: str
#     id_student: Optional[int] = None
#     student_code: Optional[str] = None
#     full_name: Optional[str] = None
#     confidence: float
#     status: str
#     result: str
#     box: Dict[str, int]
#     image_path: Optional[str] = None


# def get_db_connection():
#     return mysql.connector.connect(
#         host=DB_HOST,
#         port=DB_PORT,
#         user=DB_USER,
#         password=DB_PASSWORD,
#         database=DB_NAME,
#         autocommit=False,
#     )


# def load_models():
#     global detector, svm_model, label_encoder

#     ensure_dirs(ATTENDANCE_IMAGES_DIR, RECOGNITION_LOGS_DIR)

#     if not Path(YOLO_FACE_MODEL).exists():
#         raise FileNotFoundError(f"Không tìm thấy YOLO model: {YOLO_FACE_MODEL}")

#     if not Path(SVM_MODEL_PATH).exists():
#         raise FileNotFoundError(f"Không tìm thấy SVM model: {SVM_MODEL_PATH}")

#     if not Path(LABEL_ENCODER_PATH).exists():
#         raise FileNotFoundError(f"Không tìm thấy label encoder: {LABEL_ENCODER_PATH}")

#     detector = YOLO(str(YOLO_FACE_MODEL))
#     svm_model = joblib.load(SVM_MODEL_PATH)
#     label_encoder = joblib.load(LABEL_ENCODER_PATH)

#     print("[OK] Đã load YOLO:", YOLO_FACE_MODEL)
#     print("[OK] Đã load SVM:", SVM_MODEL_PATH)
#     print("[OK] Đã load LabelEncoder:", LABEL_ENCODER_PATH)
#     print("[OK] Số class:", len(label_encoder.classes_))


# @app.on_event("startup")
# def startup_event():
#     try:
#         load_models()
#     except Exception as e:
#         print("[ERROR] Không load được model:", e)
#         print("API vẫn chạy, nhưng /recognize sẽ báo lỗi cho đến khi đủ model.")


# def extract_embedding(face_img):
#     try:
#         if face_img is None or face_img.size == 0:
#             return None

#         face_img = resize_face(face_img)

#         reps = DeepFace.represent(
#             img_path=face_img,
#             model_name=FACE_RECOGNITION_MODEL,
#             detector_backend="skip",
#             enforce_detection=False,
#             align=False,
#         )

#         if not reps:
#             return None

#         return np.array(reps[0]["embedding"], dtype=np.float32).reshape(1, -1)

#     except Exception as e:
#         print("[ERROR] Lỗi extract embedding:", e)
#         return None


# def find_student_by_label(conn, label):
#     """
#     Tìm sinh viên từ label predict.
#     Nếu MODEL_LABEL_IS_STUDENT_CODE=True: label là Student.student_code.
#     Nếu False: label là Student.id_student.
#     """
#     cursor = conn.cursor(dictionary=True)

#     if MODEL_LABEL_IS_STUDENT_CODE:
#         cursor.execute(
#             """
#             SELECT
#                 id_student,
#                 student_code,
#                 full_name,
#                 class_name,
#                 email,
#                 avatar,
#                 status
#             FROM Student
#             WHERE student_code = %s
#             LIMIT 1
#             """,
#             (str(label),),
#         )
#     else:
#         try:
#             id_student = int(label)
#         except Exception:
#             cursor.close()
#             return None

#         cursor.execute(
#             """
#             SELECT
#                 id_student,
#                 student_code,
#                 full_name,
#                 class_name,
#                 email,
#                 avatar,
#                 status
#             FROM Student
#             WHERE id_student = %s
#             LIMIT 1
#             """,
#             (id_student,),
#         )

#     student = cursor.fetchone()
#     cursor.close()
#     return student


# def check_student_in_session(conn, id_session, id_student):
#     """
#     Kiểm tra sinh viên có thuộc lớp học phần của session không.
#     """
#     cursor = conn.cursor(dictionary=True)
#     cursor.execute(
#         """
#         SELECT
#             e.id_enrollment,
#             e.status AS enrollment_status,
#             cc.id_course_class,
#             cc.class_code,
#             sub.subject_name
#         FROM Session se
#         INNER JOIN Schedule s
#             ON se.id_schedule = s.id_schedule
#         INNER JOIN CourseClass cc
#             ON s.id_course_class = cc.id_course_class
#         INNER JOIN Subject sub
#             ON cc.id_subject = sub.id_subject
#         INNER JOIN Enrollment e
#             ON e.id_course_class = cc.id_course_class
#            AND e.id_student = %s
#            AND e.status = 'STUDYING'
#         WHERE se.id_session = %s
#         LIMIT 1
#         """,
#         (id_student, id_session),
#     )
#     row = cursor.fetchone()
#     cursor.close()
#     return row


# def save_recognition_history(
#     conn,
#     id_student,
#     confidence,
#     camera_id,
#     result,
#     image_path,
# ):
#     cursor = conn.cursor()

#     cursor.execute(
#         """
#         INSERT INTO RecognitionHistory (
#             id_student,
#             capture_time,
#             confidence,
#             camera_id,
#             result,
#             image_path
#         )
#         VALUES (%s, NOW(), %s, %s, %s, %s)
#         """,
#         (
#             id_student,
#             float(confidence) if confidence is not None else None,
#             camera_id,
#             result,
#             image_path,
#         ),
#     )

#     history_id = cursor.lastrowid
#     cursor.close()
#     return history_id


# def upsert_attendance(
#     conn,
#     id_session,
#     id_student,
#     confidence_score,
#     face_image,
#     note=None,
# ):
#     """
#     Lưu điểm danh:
#     - Nếu sinh viên đã có Attendance trong session thì UPDATE.
#     - Nếu chưa có thì INSERT.
#     """
#     status = get_attendance_status_by_time()

#     cursor = conn.cursor(dictionary=True)
#     cursor.execute(
#         """
#         SELECT id_attendance
#         FROM Attendance
#         WHERE id_session = %s
#           AND id_student = %s
#         LIMIT 1
#         """,
#         (id_session, id_student),
#     )

#     existing = cursor.fetchone()
#     cursor.close()

#     cursor = conn.cursor()

#     if existing:
#         cursor.execute(
#             """
#             UPDATE Attendance
#             SET
#                 check_in_time = NOW(),
#                 status = %s,
#                 confidence_score = %s,
#                 face_image = %s,
#                 note = %s
#             WHERE id_attendance = %s
#             """,
#             (
#                 status,
#                 float(confidence_score),
#                 face_image,
#                 note or "Cập nhật bằng nhận diện khuôn mặt",
#                 existing["id_attendance"],
#             ),
#         )
#         attendance_id = existing["id_attendance"]
#     else:
#         cursor.execute(
#             """
#             INSERT INTO Attendance (
#                 id_session,
#                 id_student,
#                 check_in_time,
#                 status,
#                 confidence_score,
#                 face_image,
#                 note
#             )
#             VALUES (%s, %s, NOW(), %s, %s, %s, %s)
#             """,
#             (
#                 id_session,
#                 id_student,
#                 status,
#                 float(confidence_score),
#                 face_image,
#                 note or "Điểm danh bằng nhận diện khuôn mặt",
#             ),
#         )
#         attendance_id = cursor.lastrowid

#     cursor.close()
#     return attendance_id


# def save_frame_image(frame, label, result):
#     ensure_dirs(ATTENDANCE_IMAGES_DIR)

#     safe_label = str(label).replace("/", "_").replace("\\", "_").replace(" ", "_")
#     image_name = f"{safe_label}_{result}_{now_string()}.jpg"
#     image_path = Path(ATTENDANCE_IMAGES_DIR) / image_name

#     imwrite_unicode(image_path, frame)

#     return str(image_path)


# def write_local_log(data):
#     ensure_dirs(RECOGNITION_LOGS_DIR)
#     log_path = Path(RECOGNITION_LOGS_DIR) / f"recognition_{datetime.now().strftime('%Y%m%d')}.jsonl"

#     with open(log_path, "a", encoding="utf-8") as f:
#         f.write(json.dumps(data, ensure_ascii=False, default=str) + "\n")


# @app.get("/health")
# def health():
#     return {
#         "status": "ok",
#         "message": "Face Attendance API đang chạy",
#         "model_loaded": detector is not None and svm_model is not None and label_encoder is not None,
#         "threshold": PREDICT_PROBA_THRESHOLD,
#         "model_label_is_student_code": MODEL_LABEL_IS_STUDENT_CODE,
#     }


# @app.post("/recognize")
# def recognize(req: RecognizeRequest):
#     global detector, svm_model, label_encoder, last_mark

#     if detector is None or svm_model is None or label_encoder is None:
#         raise HTTPException(
#             status_code=503,
#             detail="Model chưa được load. Kiểm tra thư mục models và file cấu hình.",
#         )

#     frame = base64_to_image(req.image_base64)

#     if frame is None:
#         raise HTTPException(status_code=400, detail="Ảnh base64 không hợp lệ")

#     if not req.id_session:
#         raise HTTPException(status_code=400, detail="Thiếu id_session")

#     results = detector(frame, verbose=False)

#     recognized_faces = []
#     total_faces = 0

#     for r in results:
#         for b in r.boxes:
#             total_faces += 1

#             x1, y1, x2, y2 = map(int, b.xyxy[0])
#             face = crop_face_with_margin(frame, (x1, y1, x2, y2))

#             if face is None or face.size == 0:
#                 recognized_faces.append({
#                     "label": "Unknown",
#                     "confidence": 0,
#                     "status": "BAD_CROP",
#                     "result": "FAILED",
#                     "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "message": "Không crop được khuôn mặt",
#                 })
#                 continue

#             emb = extract_embedding(face)

#             if emb is None:
#                 recognized_faces.append({
#                     "label": "Unknown",
#                     "confidence": 0,
#                     "status": "NO_EMBEDDING",
#                     "result": "FAILED",
#                     "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "message": "Không trích xuất được embedding",
#                 })
#                 continue

#             probs = svm_model.predict_proba(emb)[0]
#             best_idx = int(np.argmax(probs))
#             confidence = float(probs[best_idx])
#             pred_label = str(label_encoder.inverse_transform([best_idx])[0])

#             top3_idx = np.argsort(probs)[-3:][::-1]
#             top3 = [
#                 {
#                     "label": str(label_encoder.inverse_transform([int(i)])[0]),
#                     "confidence": float(probs[int(i)]),
#                 }
#                 for i in top3_idx
#             ]

#             if confidence < PREDICT_PROBA_THRESHOLD:
#                 image_path = save_frame_image(frame, pred_label, "UNKNOWN")

#                 conn = None
#                 try:
#                     conn = get_db_connection()
#                     save_recognition_history(
#                         conn=conn,
#                         id_student=None,
#                         confidence=confidence,
#                         camera_id=req.camera_id,
#                         result="FAILED",
#                         image_path=image_path,
#                     )
#                     conn.commit()
#                 except Exception as e:
#                     if conn:
#                         conn.rollback()
#                     print("[ERROR] Lỗi lưu RecognitionHistory UNKNOWN:", e)
#                 finally:
#                     if conn:
#                         conn.close()

#                 draw_face_box(frame, x1, y1, x2, y2, "Unknown", confidence)

#                 recognized_faces.append({
#                     "label": "Unknown",
#                     "predicted_label": pred_label,
#                     "confidence": confidence,
#                     "status": "LOW_CONFIDENCE",
#                     "result": "FAILED",
#                     "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "top3": top3,
#                     "image_path": image_path,
#                 })
#                 continue

#             conn = None
#             try:
#                 conn = get_db_connection()

#                 student = find_student_by_label(conn, pred_label)

#                 if not student:
#                     image_path = save_frame_image(frame, pred_label, "NO_STUDENT")
#                     save_recognition_history(
#                         conn=conn,
#                         id_student=None,
#                         confidence=confidence,
#                         camera_id=req.camera_id,
#                         result="FAILED",
#                         image_path=image_path,
#                     )
#                     conn.commit()

#                     draw_face_box(frame, x1, y1, x2, y2, "No student", confidence)

#                     recognized_faces.append({
#                         "label": pred_label,
#                         "confidence": confidence,
#                         "status": "STUDENT_NOT_FOUND",
#                         "result": "FAILED",
#                         "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                         "top3": top3,
#                         "image_path": image_path,
#                         "message": "Không tìm thấy sinh viên tương ứng với label",
#                     })
#                     continue

#                 id_student = student["id_student"]

#                 session_info = check_student_in_session(conn, req.id_session, id_student)
#                 if not session_info:
#                     image_path = save_frame_image(frame, pred_label, "NOT_IN_SESSION")
#                     save_recognition_history(
#                         conn=conn,
#                         id_student=id_student,
#                         confidence=confidence,
#                         camera_id=req.camera_id,
#                         result="FAILED",
#                         image_path=image_path,
#                     )
#                     conn.commit()

#                     draw_face_box(frame, x1, y1, x2, y2, student["student_code"], confidence)

#                     recognized_faces.append({
#                         "label": pred_label,
#                         "id_student": id_student,
#                         "student_code": student["student_code"],
#                         "full_name": student["full_name"],
#                         "confidence": confidence,
#                         "status": "NOT_IN_SESSION",
#                         "result": "FAILED",
#                         "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                         "top3": top3,
#                         "image_path": image_path,
#                         "message": "Sinh viên không thuộc lớp học phần của buổi học này",
#                     })
#                     continue

#                 now = time.time()
#                 cooldown_key = f"{req.id_session}_{id_student}"

#                 if cooldown_key in last_mark and now - last_mark[cooldown_key] < ATTENDANCE_COOLDOWN_SECONDS:
#                     draw_face_box(frame, x1, y1, x2, y2, student["student_code"], confidence)

#                     recognized_faces.append({
#                         "label": pred_label,
#                         "id_student": id_student,
#                         "student_code": student["student_code"],
#                         "full_name": student["full_name"],
#                         "confidence": confidence,
#                         "status": "COOLDOWN",
#                         "result": "SUCCESS",
#                         "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                         "top3": top3,
#                         "message": "Sinh viên đã được ghi nhận gần đây",
#                     })
#                     conn.rollback()
#                     continue

#                 image_path = save_frame_image(frame, student["student_code"], "SUCCESS")

#                 history_id = save_recognition_history(
#                     conn=conn,
#                     id_student=id_student,
#                     confidence=confidence,
#                     camera_id=req.camera_id,
#                     result="SUCCESS",
#                     image_path=image_path,
#                 )

#                 attendance_id = upsert_attendance(
#                     conn=conn,
#                     id_session=req.id_session,
#                     id_student=id_student,
#                     confidence_score=confidence,
#                     face_image=image_path,
#                     note=f"Nhận diện khuôn mặt thành công. history_id={history_id}",
#                 )

#                 conn.commit()
#                 last_mark[cooldown_key] = now

#                 draw_face_box(frame, x1, y1, x2, y2, student["student_code"], confidence)

#                 recognized_faces.append({
#                     "label": pred_label,
#                     "id_student": id_student,
#                     "student_code": student["student_code"],
#                     "full_name": student["full_name"],
#                     "confidence": confidence,
#                     "status": "ATTENDANCE_SAVED",
#                     "result": "SUCCESS",
#                     "id_attendance": attendance_id,
#                     "id_history": history_id,
#                     "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "top3": top3,
#                     "image_path": image_path,
#                 })

#             except Exception as e:
#                 if conn:
#                     conn.rollback()
#                 print("[ERROR] Lỗi xử lý nhận diện:", e)

#                 recognized_faces.append({
#                     "label": pred_label,
#                     "confidence": confidence,
#                     "status": "SERVER_ERROR",
#                     "result": "FAILED",
#                     "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
#                     "top3": top3,
#                     "message": str(e),
#                 })
#             finally:
#                 if conn:
#                     conn.close()

#     annotated_image_base64 = image_to_base64(frame)

#     response = {
#         "message": "Đã xử lý nhận diện",
#         "id_session": req.id_session,
#         "camera_id": req.camera_id,
#         "total_faces": total_faces,
#         "faces": recognized_faces,
#         "annotated_image_base64": annotated_image_base64,
#         "created_at": datetime.now().isoformat(),
#     }

#     write_local_log(response)

#     return response


# if __name__ == "__main__":
#     uvicorn.run(
#         "face_attendance_mysql_api:app",
#         host=FACE_API_HOST,
#         port=FACE_API_PORT,
#         reload=False,
#     )


import os
import time
import json
import joblib
import uvicorn
import cv2
import numpy as np
import mysql.connector
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from deepface import DeepFace

from config_v2 import (
    YOLO_FACE_MODEL,
    SVM_MODEL_PATH,
    LABEL_ENCODER_PATH,
    FACE_RECOGNITION_MODEL,
    PREDICT_PROBA_THRESHOLD,
    MODEL_LABEL_IS_STUDENT_CODE,
    ATTENDANCE_COOLDOWN_SECONDS,
    ATTENDANCE_IMAGES_DIR,
    RECOGNITION_LOGS_DIR,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    FACE_API_HOST,
    FACE_API_PORT,
    CORS_ORIGINS,
)
from utils_v2 import (
    ensure_dirs,
    crop_face_with_margin,
    resize_face,
    base64_to_image,
    imwrite_unicode,
    draw_face_box,
    image_to_base64,
    now_string,
    get_attendance_status_by_time,
)


app = FastAPI(
    title="Face Attendance Recognition API",
    version="1.0.0",
    description="YOLO + DeepFace + SVM API cho hệ thống điểm danh khuôn mặt",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


detector = None
svm_model = None
label_encoder = None
last_mark = {}


class RecognizeRequest(BaseModel):
    image_base64: str
    id_session: int
    camera_id: Optional[int] = None


class ConfirmAttendanceRequest(BaseModel):
    id_session: int
    id_student: int
    student_code: str
    full_name: str
    confidence: float
    camera_id: Optional[int] = None
    image_base64: Optional[str] = None


class RecognizedFace(BaseModel):
    label: str
    id_student: Optional[int] = None
    student_code: Optional[str] = None
    full_name: Optional[str] = None
    confidence: float
    status: str
    result: str
    box: Dict[str, int]
    image_path: Optional[str] = None


def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        autocommit=False,
    )


def load_models():
    global detector, svm_model, label_encoder

    ensure_dirs(ATTENDANCE_IMAGES_DIR, RECOGNITION_LOGS_DIR)

    if not Path(YOLO_FACE_MODEL).exists():
        raise FileNotFoundError(f"Không tìm thấy YOLO model: {YOLO_FACE_MODEL}")

    if not Path(SVM_MODEL_PATH).exists():
        raise FileNotFoundError(f"Không tìm thấy SVM model: {SVM_MODEL_PATH}")

    if not Path(LABEL_ENCODER_PATH).exists():
        raise FileNotFoundError(f"Không tìm thấy label encoder: {LABEL_ENCODER_PATH}")

    detector = YOLO(str(YOLO_FACE_MODEL))
    svm_model = joblib.load(SVM_MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)

    print("[OK] Đã load YOLO:", YOLO_FACE_MODEL)
    print("[OK] Đã load SVM:", SVM_MODEL_PATH)
    print("[OK] Đã load LabelEncoder:", LABEL_ENCODER_PATH)
    print("[OK] Số class:", len(label_encoder.classes_))


@app.on_event("startup")
def startup_event():
    try:
        load_models()
    except Exception as e:
        print("[ERROR] Không load được model:", e)
        print("API vẫn chạy, nhưng /recognize sẽ báo lỗi cho đến khi đủ model.")


def extract_embedding(face_img):
    try:
        if face_img is None or face_img.size == 0:
            return None

        face_img = resize_face(face_img)

        reps = DeepFace.represent(
            img_path=face_img,
            model_name=FACE_RECOGNITION_MODEL,
            detector_backend="skip",
            enforce_detection=False,
            align=False,
        )

        if not reps:
            return None

        return np.array(reps[0]["embedding"], dtype=np.float32).reshape(1, -1)

    except Exception as e:
        print("[ERROR] Lỗi extract embedding:", e)
        return None


def extract_student_code_from_label(label):
    """
    Nếu label là SV008_Nguyen_Van_A hoặc SV008_Nguyễn_Văn_A
    thì lấy SV008 để tìm trong bảng Student.
    Nếu label đã là SV008 thì giữ nguyên.
    """
    label = str(label).strip()

    if "_" in label:
        return label.split("_", 1)[0]

    return label


def find_student_by_label(conn, label):
    """
    Tìm sinh viên từ label predict.
    Nếu MODEL_LABEL_IS_STUDENT_CODE=True:
    - label có thể là Student.student_code, ví dụ SV008
    - hoặc tên thư mục train, ví dụ SV008_Nguyen_Van_A
    Nếu MODEL_LABEL_IS_STUDENT_CODE=False:
    - label là Student.id_student.
    """
    cursor = conn.cursor(dictionary=True)

    if MODEL_LABEL_IS_STUDENT_CODE:
        student_code = extract_student_code_from_label(label)

        cursor.execute(
            """
            SELECT
                id_student,
                student_code,
                full_name,
                class_name,
                email,
                avatar,
                status
            FROM Student
            WHERE student_code = %s
            LIMIT 1
            """,
            (student_code,),
        )
    else:
        try:
            id_student = int(label)
        except Exception:
            cursor.close()
            return None

        cursor.execute(
            """
            SELECT
                id_student,
                student_code,
                full_name,
                class_name,
                email,
                avatar,
                status
            FROM Student
            WHERE id_student = %s
            LIMIT 1
            """,
            (id_student,),
        )

    student = cursor.fetchone()
    cursor.close()
    return student

def check_student_in_session(conn, id_session, id_student):
    """
    Kiểm tra sinh viên có thuộc lớp học phần của session không.
    """
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            e.id_enrollment,
            e.status AS enrollment_status,
            cc.id_course_class,
            cc.class_code,
            sub.subject_name
        FROM Session se
        INNER JOIN Schedule s
            ON se.id_schedule = s.id_schedule
        INNER JOIN CourseClass cc
            ON s.id_course_class = cc.id_course_class
        INNER JOIN Subject sub
            ON cc.id_subject = sub.id_subject
        INNER JOIN Enrollment e
            ON e.id_course_class = cc.id_course_class
           AND e.id_student = %s
           AND e.status = 'STUDYING'
        WHERE se.id_session = %s
        LIMIT 1
        """,
        (id_student, id_session),
    )
    row = cursor.fetchone()
    cursor.close()
    return row


def save_recognition_history(
    conn,
    id_student,
    confidence,
    camera_id,
    result,
    image_path,
):
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO RecognitionHistory (
            id_student,
            capture_time,
            confidence,
            camera_id,
            result,
            image_path
        )
        VALUES (%s, NOW(), %s, %s, %s, %s)
        """,
        (
            id_student,
            float(confidence) if confidence is not None else None,
            camera_id,
            result,
            image_path,
        ),
    )

    history_id = cursor.lastrowid
    cursor.close()
    return history_id


def upsert_attendance(
    conn,
    id_session,
    id_student,
    confidence_score,
    face_image,
    note=None,
):
    """
    Lưu điểm danh:
    - Nếu sinh viên đã có Attendance trong session thì UPDATE.
    - Nếu chưa có thì INSERT.
    """
    status = get_attendance_status_by_time()

    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT id_attendance
        FROM Attendance
        WHERE id_session = %s
          AND id_student = %s
        LIMIT 1
        """,
        (id_session, id_student),
    )

    existing = cursor.fetchone()
    cursor.close()

    cursor = conn.cursor()

    if existing:
        cursor.execute(
            """
            UPDATE Attendance
            SET
                check_in_time = NOW(),
                status = %s,
                confidence_score = %s,
                face_image = %s,
                note = %s
            WHERE id_attendance = %s
            """,
            (
                status,
                float(confidence_score),
                face_image,
                note or "Cập nhật bằng nhận diện khuôn mặt",
                existing["id_attendance"],
            ),
        )
        attendance_id = existing["id_attendance"]
    else:
        cursor.execute(
            """
            INSERT INTO Attendance (
                id_session,
                id_student,
                check_in_time,
                status,
                confidence_score,
                face_image,
                note
            )
            VALUES (%s, %s, NOW(), %s, %s, %s, %s)
            """,
            (
                id_session,
                id_student,
                status,
                float(confidence_score),
                face_image,
                note or "Điểm danh bằng nhận diện khuôn mặt",
            ),
        )
        attendance_id = cursor.lastrowid

    cursor.close()
    return attendance_id


def save_frame_image(frame, label, result):
    ensure_dirs(ATTENDANCE_IMAGES_DIR)

    safe_label = str(label).replace("/", "_").replace("\\", "_").replace(" ", "_")
    image_name = f"{safe_label}_{result}_{now_string()}.jpg"
    image_path = Path(ATTENDANCE_IMAGES_DIR) / image_name

    imwrite_unicode(image_path, frame)

    return str(image_path)


def write_local_log(data):
    ensure_dirs(RECOGNITION_LOGS_DIR)
    log_path = Path(RECOGNITION_LOGS_DIR) / f"recognition_{datetime.now().strftime('%Y%m%d')}.jsonl"

    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(data, ensure_ascii=False, default=str) + "\n")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "Face Attendance API đang chạy",
        "model_loaded": detector is not None and svm_model is not None and label_encoder is not None,
        "threshold": PREDICT_PROBA_THRESHOLD,
        "model_label_is_student_code": MODEL_LABEL_IS_STUDENT_CODE,
    }


@app.post("/recognize-preview")
def recognize_preview(req: RecognizeRequest):
    """
    API nhận diện thử trước khi lưu điểm danh.

    Luồng mới:
    - React gửi ảnh + id_session.
    - Python nhận diện khuôn mặt.
    - Nếu nhận diện đúng và sinh viên thuộc buổi học:
      trả về status = WAITING_CONFIRM.
    - Chưa lưu Attendance.
    - Chỉ khi React gọi /confirm-attendance thì mới lưu Attendance.
    """
    global detector, svm_model, label_encoder, last_mark

    if detector is None or svm_model is None or label_encoder is None:
        raise HTTPException(
            status_code=503,
            detail="Model chưa được load. Kiểm tra thư mục models và file cấu hình.",
        )

    frame = base64_to_image(req.image_base64)

    if frame is None:
        raise HTTPException(status_code=400, detail="Ảnh base64 không hợp lệ")

    if not req.id_session:
        raise HTTPException(status_code=400, detail="Thiếu id_session")

    results = detector(frame, verbose=False)

    recognized_faces = []
    total_faces = 0

    for r in results:
        for b in r.boxes:
            total_faces += 1

            x1, y1, x2, y2 = map(int, b.xyxy[0])
            face = crop_face_with_margin(frame, (x1, y1, x2, y2))

            if face is None or face.size == 0:
                recognized_faces.append({
                    "label": "Unknown",
                    "confidence": 0,
                    "status": "BAD_CROP",
                    "result": "FAILED",
                    "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "message": "Không crop được khuôn mặt",
                })
                continue

            emb = extract_embedding(face)

            if emb is None:
                recognized_faces.append({
                    "label": "Unknown",
                    "confidence": 0,
                    "status": "NO_EMBEDDING",
                    "result": "FAILED",
                    "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "message": "Không trích xuất được embedding",
                })
                continue

            probs = svm_model.predict_proba(emb)[0]
            best_idx = int(np.argmax(probs))
            confidence = float(probs[best_idx])
            pred_label = str(label_encoder.inverse_transform([best_idx])[0])

            top3_idx = np.argsort(probs)[-3:][::-1]
            top3 = [
                {
                    "label": str(label_encoder.inverse_transform([int(i)])[0]),
                    "confidence": float(probs[int(i)]),
                }
                for i in top3_idx
            ]

            if confidence < PREDICT_PROBA_THRESHOLD:
                image_path = save_frame_image(frame, pred_label, "UNKNOWN")

                conn = None
                try:
                    conn = get_db_connection()
                    save_recognition_history(
                        conn=conn,
                        id_student=None,
                        confidence=confidence,
                        camera_id=req.camera_id,
                        result="FAILED",
                        image_path=image_path,
                    )
                    conn.commit()
                except Exception as e:
                    if conn:
                        conn.rollback()
                    print("[ERROR] Lỗi lưu RecognitionHistory UNKNOWN:", e)
                finally:
                    if conn:
                        conn.close()

                draw_face_box(frame, x1, y1, x2, y2, "Unknown", confidence)

                recognized_faces.append({
                    "label": "Unknown",
                    "predicted_label": pred_label,
                    "confidence": confidence,
                    "status": "LOW_CONFIDENCE",
                    "result": "FAILED",
                    "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "top3": top3,
                    "image_path": image_path,
                    "message": "Độ tin cậy chưa đủ để xác nhận sinh viên",
                })
                continue

            conn = None
            try:
                conn = get_db_connection()

                student = find_student_by_label(conn, pred_label)

                if not student:
                    image_path = save_frame_image(frame, pred_label, "NO_STUDENT")
                    save_recognition_history(
                        conn=conn,
                        id_student=None,
                        confidence=confidence,
                        camera_id=req.camera_id,
                        result="FAILED",
                        image_path=image_path,
                    )
                    conn.commit()

                    draw_face_box(frame, x1, y1, x2, y2, "No student", confidence)

                    recognized_faces.append({
                        "label": pred_label,
                        "confidence": confidence,
                        "status": "STUDENT_NOT_FOUND",
                        "result": "FAILED",
                        "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        "top3": top3,
                        "image_path": image_path,
                        "message": "Không tìm thấy sinh viên tương ứng với label",
                    })
                    continue

                id_student = student["id_student"]

                session_info = check_student_in_session(conn, req.id_session, id_student)
                if not session_info:
                    image_path = save_frame_image(frame, pred_label, "NOT_IN_SESSION")
                    save_recognition_history(
                        conn=conn,
                        id_student=id_student,
                        confidence=confidence,
                        camera_id=req.camera_id,
                        result="FAILED",
                        image_path=image_path,
                    )
                    conn.commit()

                    draw_face_box(frame, x1, y1, x2, y2, student["student_code"], confidence)

                    recognized_faces.append({
                        "label": pred_label,
                        "id_student": id_student,
                        "student_code": student["student_code"],
                        "full_name": student["full_name"],
                        "confidence": confidence,
                        "status": "NOT_IN_SESSION",
                        "result": "FAILED",
                        "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        "top3": top3,
                        "image_path": image_path,
                        "message": "Sinh viên không thuộc lớp học phần của buổi học này",
                    })
                    continue

                now = time.time()
                cooldown_key = f"{req.id_session}_{id_student}"

                if cooldown_key in last_mark and now - last_mark[cooldown_key] < ATTENDANCE_COOLDOWN_SECONDS:
                    draw_face_box(frame, x1, y1, x2, y2, student["student_code"], confidence)
                    conn.rollback()

                    recognized_faces.append({
                        "label": pred_label,
                        "id_student": id_student,
                        "student_code": student["student_code"],
                        "full_name": student["full_name"],
                        "confidence": confidence,
                        "status": "COOLDOWN",
                        "result": "SUCCESS",
                        "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                        "top3": top3,
                        "message": "Sinh viên đã được điểm danh gần đây",
                    })
                    continue

                # Chỉ lưu ảnh preview để hiển thị/log cục bộ, KHÔNG lưu Attendance ở đây.
                image_path = save_frame_image(frame, student["student_code"], "PREVIEW")
                conn.rollback()

                draw_face_box(frame, x1, y1, x2, y2, student["student_code"], confidence)

                recognized_faces.append({
                    "label": pred_label,
                    "id_student": id_student,
                    "student_code": student["student_code"],
                    "full_name": student["full_name"],
                    "confidence": confidence,
                    "status": "WAITING_CONFIRM",
                    "result": "PREVIEW",
                    "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "top3": top3,
                    "image_path": image_path,
                    "message": "Đã nhận diện sinh viên. Chờ bấm OK để lưu điểm danh.",
                })

            except Exception as e:
                if conn:
                    conn.rollback()
                print("[ERROR] Lỗi xử lý nhận diện preview:", e)

                recognized_faces.append({
                    "label": pred_label,
                    "confidence": confidence,
                    "status": "SERVER_ERROR",
                    "result": "FAILED",
                    "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "top3": top3,
                    "message": str(e),
                })
            finally:
                if conn:
                    conn.close()

    annotated_image_base64 = image_to_base64(frame)

    response = {
        "success": True,
        "message": "Đã xử lý nhận diện preview",
        "id_session": req.id_session,
        "camera_id": req.camera_id,
        "total_faces": total_faces,
        "faces": recognized_faces,
        "annotated_image_base64": annotated_image_base64,
        "created_at": datetime.now().isoformat(),
    }

    write_local_log(response)

    return response


@app.post("/confirm-attendance")
def confirm_attendance(req: ConfirmAttendanceRequest):
    """
    API xác nhận điểm danh sau khi sinh viên bấm OK trên React.

    API này mới thực sự ghi:
    - RecognitionHistory
    - Attendance
    """
    global last_mark

    if not req.id_session:
        raise HTTPException(status_code=400, detail="Thiếu id_session")

    if not req.id_student:
        raise HTTPException(status_code=400, detail="Thiếu id_student")

    conn = None

    try:
        conn = get_db_connection()

        session_info = check_student_in_session(
            conn,
            req.id_session,
            req.id_student,
        )

        if not session_info:
            conn.rollback()
            raise HTTPException(
                status_code=400,
                detail="Sinh viên không thuộc lớp học phần của buổi học này",
            )

        cooldown_key = f"{req.id_session}_{req.id_student}"
        now = time.time()

        if (
            cooldown_key in last_mark
            and now - last_mark[cooldown_key] < ATTENDANCE_COOLDOWN_SECONDS
        ):
            conn.rollback()

            response = {
                "success": True,
                "status": "COOLDOWN",
                "message": "Sinh viên đã được điểm danh gần đây",
                "id_session": req.id_session,
                "id_student": req.id_student,
                "student_code": req.student_code,
                "full_name": req.full_name,
                "created_at": datetime.now().isoformat(),
            }
            write_local_log(response)
            return response

        image_path = None

        if req.image_base64:
            frame = base64_to_image(req.image_base64)

            if frame is not None:
                image_path = save_frame_image(
                    frame,
                    req.student_code,
                    "CONFIRMED",
                )

        history_id = save_recognition_history(
            conn=conn,
            id_student=req.id_student,
            confidence=req.confidence,
            camera_id=req.camera_id,
            result="SUCCESS",
            image_path=image_path,
        )

        attendance_id = upsert_attendance(
            conn=conn,
            id_session=req.id_session,
            id_student=req.id_student,
            confidence_score=req.confidence,
            face_image=image_path,
            note=f"Sinh viên đã xác nhận OK. history_id={history_id}",
        )

        conn.commit()
        last_mark[cooldown_key] = now

        response = {
            "success": True,
            "status": "ATTENDANCE_CONFIRMED",
            "message": "Đã xác nhận và lưu điểm danh thành công",
            "id_session": req.id_session,
            "id_student": req.id_student,
            "student_code": req.student_code,
            "full_name": req.full_name,
            "confidence": req.confidence,
            "id_attendance": attendance_id,
            "id_history": history_id,
            "image_path": image_path,
            "created_at": datetime.now().isoformat(),
        }

        write_local_log(response)

        return response

    except HTTPException:
        raise

    except Exception as e:
        if conn:
            conn.rollback()

        print("[ERROR] Lỗi xác nhận điểm danh:", e)

        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xác nhận điểm danh: {str(e)}",
        )

    finally:
        if conn:
            conn.close()


# Giữ lại endpoint /recognize để tương thích tạm thời với frontend cũ.
# Endpoint này KHÔNG còn lưu điểm danh, mà gọi cùng logic preview.
@app.post("/recognize")
def recognize(req: RecognizeRequest):
    return recognize_preview(req)


if __name__ == "__main__":
    uvicorn.run(
        "face_attendance_mysql_api:app",
        host=FACE_API_HOST,
        port=FACE_API_PORT,
        reload=False,
    )
