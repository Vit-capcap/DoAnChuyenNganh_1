import pandas as pd
import mysql.connector
import os

# =========================
# FILE EXCEL
# =========================
EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\teacher_dataset_vku.xlsx"

# =========================
# MYSQL CONFIG
# =========================
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

if not os.path.exists(EXCEL_FILE):
    print("Không tìm thấy file Excel!")
    print("Đường dẫn:", EXCEL_FILE)
    exit()

# =========================
# ĐỌC FILE EXCEL
# =========================
df = pd.read_excel(EXCEL_FILE)
df = df.where(pd.notnull(df), None)

# =========================
# KẾT NỐI MYSQL
# =========================
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

# =========================
# LẤY department_id ĐANG CÓ
# =========================
cursor.execute("SELECT id_department FROM Department")
valid_department_ids = {row[0] for row in cursor.fetchall()}

print("Department hiện có:", valid_department_ids)

# =========================
# INSERT TEACHER
# =========================
sql = """
INSERT INTO Teacher (
    teacher_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    password,
    department_id
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        department_id = int(row["department_id"])

        if department_id not in valid_department_ids:
            raise ValueError(f"department_id {department_id} chưa tồn tại trong bảng Department")

        values = (
            row["teacher_code"],
            row["full_name"],
            row["gender"],
            row["date_of_birth"],
            str(row["phone"]),
            row["email"],
            row["avatar"],
            row["password"],
            department_id
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import dữ liệu giáo viên hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()