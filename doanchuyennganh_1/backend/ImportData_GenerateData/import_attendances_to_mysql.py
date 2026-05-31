import pandas as pd
import mysql.connector
import os
import math

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\attendance_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

def clean_value(value):
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

cursor.execute("SELECT id_session FROM Session")
valid_session_ids = {row[0] for row in cursor.fetchall()}

cursor.execute("SELECT id_student FROM Student")
valid_student_ids = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO Attendance (
    id_session,
    id_student,
    check_in_time,
    status,
    confidence_score,
    face_image,
    note
)
VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        id_session = int(row["id_session"])
        id_student = int(row["id_student"])

        if id_session not in valid_session_ids:
            raise ValueError(f"id_session {id_session} không tồn tại")

        if id_student not in valid_student_ids:
            raise ValueError(f"id_student {id_student} không tồn tại")

        values = (
            id_session,
            id_student,
            clean_value(row["check_in_time"]),
            row["status"],
            clean_value(row["confidence_score"]),
            clean_value(row["face_image"]),
            clean_value(row["note"])
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import Attendance hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()