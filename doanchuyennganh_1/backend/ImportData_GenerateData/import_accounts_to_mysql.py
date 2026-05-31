import pandas as pd
import mysql.connector
import os
import math

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\account_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

def clean(value):
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    if pd.isna(value):
        return None
    return value

if not os.path.exists(EXCEL_FILE):
    print("Không tìm thấy file Excel!")
    exit()

df = pd.read_excel(EXCEL_FILE)
df = df.where(pd.notnull(df), None)

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_teacher FROM Teacher")
valid_teachers = {row[0] for row in cursor.fetchall()}

cursor.execute("SELECT id_student FROM Student")
valid_students = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO Account (
    username,
    password,
    role,
    teacher_id,
    student_id,
    last_login,
    status
)
VALUES (%s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role = VALUES(role),
    teacher_id = VALUES(teacher_id),
    student_id = VALUES(student_id),
    last_login = VALUES(last_login),
    status = VALUES(status)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        teacher_id = clean(row["teacher_id"])
        student_id = clean(row["student_id"])

        teacher_id = int(teacher_id) if teacher_id is not None else None
        student_id = int(student_id) if student_id is not None else None

        if teacher_id is not None and teacher_id not in valid_teachers:
            raise ValueError(f"teacher_id {teacher_id} không tồn tại")

        if student_id is not None and student_id not in valid_students:
            raise ValueError(f"student_id {student_id} không tồn tại")

        values = (
            row["username"],
            row["password"],
            row["role"],
            teacher_id,
            student_id,
            clean(row["last_login"]),
            row["status"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import Account hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()