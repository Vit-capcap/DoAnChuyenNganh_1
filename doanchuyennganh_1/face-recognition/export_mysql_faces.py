# // OK nha
import os
import re
import base64
import shutil
from pathlib import Path

import pymysql


# =========================
# Cấu hình MySQL
# =========================
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",  # Nếu MySQL có mật khẩu thì điền vào đây
    "database": "face_attendance_system",
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}


# =========================
# Cấu hình đường dẫn
# =========================
BASE_DIR = Path(__file__).resolve().parent

# Xuất ảnh trực tiếp vào dataset/raw để train model nhận diện
OUTPUT_DIR = BASE_DIR / "dataset" / "raw"

# Nếu ảnh trong MySQL lưu dạng đường dẫn tương đối, script sẽ dò thêm các thư mục này
PROJECT_ROOT = BASE_DIR.parent

SEARCH_IMAGE_DIRS = [
    PROJECT_ROOT,
    PROJECT_ROOT / "public",
    PROJECT_ROOT / "uploads",
    PROJECT_ROOT / "src",
    PROJECT_ROOT / "backend" / "uploads",
    PROJECT_ROOT / "frontend" / "public",
]


# =========================
# Helper: Chuẩn hóa tên folder/file
# =========================
def safe_name(value):
    if not value:
        return "unknown"

    value = str(value).strip()
    value = re.sub(r"[^\w\s.-]", "", value, flags=re.UNICODE)
    value = re.sub(r"\s+", "_", value)

    return value


# =========================
# Kiểm tra dữ liệu ảnh là base64 hay path
# =========================
def is_base64_image(value):
    if not value:
        return False

    value = str(value).strip()

    return value.startswith("data:image") or len(value) > 500


# =========================
# Lưu ảnh base64
# =========================
def save_base64_image(base64_string, output_path):
    try:
        base64_string = str(base64_string).strip()

        if "," in base64_string:
            base64_string = base64_string.split(",", 1)[1]

        image_data = base64.b64decode(base64_string)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "wb") as f:
            f.write(image_data)

        return True

    except Exception as e:
        print(f"[ERROR] Không thể lưu base64: {output_path}")
        print("Lỗi:", e)
        return False


# =========================
# Lưu ảnh từ path hoặc base64
# =========================
def save_image(image_value, output_path):
    if not image_value:
        return False

    image_value = str(image_value).strip()

    # Trường hợp ảnh lưu dạng base64 / LONGTEXT
    if is_base64_image(image_value):
        return save_base64_image(image_value, output_path)

    # Chuẩn hóa path nếu có dấu / ở đầu
    clean_path = image_value.lstrip("/").replace("\\", "/")

    possible_paths = []

    # Nếu là đường dẫn tuyệt đối
    possible_paths.append(Path(image_value))

    # Nếu là đường dẫn tương đối
    for folder in SEARCH_IMAGE_DIRS:
        possible_paths.append(folder / clean_path)

    for path in possible_paths:
        if path.exists() and path.is_file():
            output_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(path, output_path)
            return True

    print(f"[WARNING] Không tìm thấy file ảnh: {image_value}")
    return False


# =========================
# Export ảnh sinh viên từ MySQL
# =========================
def export_students(cursor):
    print("\n========== EXPORT ẢNH SINH VIÊN ==========")

    cursor.execute(
        """
        SELECT
            s.id_student,
            s.student_code,
            s.full_name,
            s.avatar,
            f.id_face,
            f.face_image
        FROM Student s
        LEFT JOIN FaceData f
            ON s.id_student = f.id_student
        WHERE s.status = 'ACTIVE'
        ORDER BY s.id_student ASC, f.id_face ASC
        """
    )

    rows = cursor.fetchall()

    total_saved = 0
    total_students = 0
    current_student = None
    image_index_by_student = {}

    for row in rows:
        id_student = row.get("id_student")
        student_code = row.get("student_code") or f"student_{id_student}"
        full_name = row.get("full_name") or "unknown"

        # Tên label dùng để train model:
        # Ví dụ: 23IT087_DangThanCau
        student_label = safe_name(f"{student_code}_{full_name}")

        student_folder = OUTPUT_DIR / student_label
        student_folder.mkdir(parents=True, exist_ok=True)

        if student_label not in image_index_by_student:
            image_index_by_student[student_label] = 1
            total_students += 1

        # Lưu avatar 1 lần cho mỗi sinh viên
        if current_student != student_label:
            current_student = student_label

            if row.get("avatar"):
                avatar_path = student_folder / f"{student_label}_avatar.jpg"

                if save_image(row["avatar"], avatar_path):
                    total_saved += 1
                    image_index_by_student[student_label] += 1
                    print(f"[OK] {student_label}: lưu avatar")

        # Lưu ảnh khuôn mặt trong FaceData
        if row.get("face_image"):
            index = image_index_by_student[student_label]
            face_id = row.get("id_face") or index

            face_path = student_folder / f"{student_label}_face_{face_id}.jpg"

            if save_image(row["face_image"], face_path):
                total_saved += 1
                image_index_by_student[student_label] += 1
                print(f"[OK] {student_label}: lưu face {face_id}")

    print("\n========== KẾT QUẢ ==========")
    print(f"Tổng sinh viên đã xử lý: {total_students}")
    print(f"Tổng ảnh đã lưu: {total_saved}")
    print(f"Thư mục dataset raw: {OUTPUT_DIR.resolve()}")

# =========================
# Export ảnh giáo viên nếu cần
# =========================
def export_teachers(cursor):
    print("\n========== EXPORT ẢNH GIÁO VIÊN ==========")

    teacher_output_dir = BASE_DIR / "data_raw" / "teachers"
    teacher_output_dir.mkdir(parents=True, exist_ok=True)

    cursor.execute(
        """
        SELECT
            id_teacher,
            teacher_code,
            full_name,
            avatar
        FROM Teacher
        ORDER BY id_teacher ASC
        """
    )

    rows = cursor.fetchall()

    count = 0

    for row in rows:
        teacher_code = row.get("teacher_code") or f"teacher_{row.get('id_teacher')}"
        full_name = row.get("full_name") or "unknown"

        folder_name = safe_name(f"{teacher_code}_{full_name}")
        teacher_folder = teacher_output_dir / folder_name
        teacher_folder.mkdir(parents=True, exist_ok=True)

        if row.get("avatar"):
            avatar_path = teacher_folder / f"{safe_name(teacher_code)}_avatar.jpg"

            if save_image(row["avatar"], avatar_path):
                count += 1
                print(f"[OK] Lưu avatar giáo viên: {teacher_code} - {full_name}")

    print(f"\n[OK] Tổng ảnh giáo viên đã lưu: {count}")


# =========================
# Main
# =========================
def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("====================================")
    print("EXPORT ẢNH TỪ MYSQL RA DATASET RAW")
    print("Database:", DB_CONFIG["database"])
    print("Output:", OUTPUT_DIR.resolve())
    print("====================================")

    try:
        connection = pymysql.connect(**DB_CONFIG)

        with connection.cursor() as cursor:
            export_students(cursor)

            # Không bắt buộc cho điểm danh sinh viên.
            # Nếu muốn export giáo viên thì mở dòng dưới:
            # export_teachers(cursor)

        connection.close()

        print("\n====================================")
        print("[DONE] Đã export xong ảnh sinh viên")
        print("Bước tiếp theo chạy:")
        print("python prepare_dataset.py")
        print("python extract_embeddings.py")
        print("python train_face_model.py")
        print("====================================")

    except Exception as e:
        print(f"[ERROR] Lỗi kết nối hoặc export dữ liệu: {e}")


if __name__ == "__main__":
    main()