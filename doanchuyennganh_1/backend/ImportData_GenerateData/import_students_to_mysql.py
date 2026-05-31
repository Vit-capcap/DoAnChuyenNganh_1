import pandas as pd
import mysql.connector
from datetime import datetime

# =========================
# CẤU HÌNH
# =========================
EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\student_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

# =========================
# ĐỌC FILE EXCEL
# =========================
df = pd.read_excel(EXCEL_FILE)

# Đổi tên giới tính cho đúng ENUM MySQL
gender_map = {
    "Nam": "Male",
    "Nữ": "Female",
    "Nu": "Female",
    "Male": "Male",
    "Female": "Female",
    "Other": "Other"
}

df["gender"] = df["gender"].map(gender_map).fillna("Other")

# Xử lý dữ liệu rỗng
df = df.where(pd.notnull(df), None)

# =========================
# KẾT NỐI MYSQL
# =========================
conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

# =========================
# CÂU LỆNH INSERT
# =========================
sql = """
INSERT INTO Student (
    student_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    faculty,
    class_name,
    course_year,
    status
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

success = 0
failed = 0

# =========================
# IMPORT DỮ LIỆU
# =========================
for index, row in df.iterrows():
    try:
        values = (
            row["student_code"],
            row["full_name"],
            row["gender"],
            row["date_of_birth"],
            str(row["phone"]),
            row["email"],
            row["avatar"],
            row["faculty"],
            row["class_name"],
            row["course_year"],
            row["status"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import dữ liệu hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()