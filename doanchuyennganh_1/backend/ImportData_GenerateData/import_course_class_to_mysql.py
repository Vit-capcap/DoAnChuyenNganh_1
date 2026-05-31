import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\course_class_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

if not os.path.exists(EXCEL_FILE):
    print("Không tìm thấy file Excel!")
    exit()

df = pd.read_excel(EXCEL_FILE)
df = df.where(pd.notnull(df), None)

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_subject FROM Subject")
valid_subject_ids = {row[0] for row in cursor.fetchall()}

cursor.execute("SELECT id_teacher FROM Teacher")
valid_teacher_ids = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO CourseClass (
    class_code,
    id_subject,
    id_teacher,
    semester,
    school_year,
    group_number,
    max_student,
    status
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    id_subject = VALUES(id_subject),
    id_teacher = VALUES(id_teacher),
    semester = VALUES(semester),
    school_year = VALUES(school_year),
    group_number = VALUES(group_number),
    max_student = VALUES(max_student),
    status = VALUES(status)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        id_subject = int(row["id_subject"])
        id_teacher = int(row["id_teacher"])

        if id_subject not in valid_subject_ids:
            raise ValueError(f"id_subject {id_subject} không tồn tại trong Subject")

        if id_teacher not in valid_teacher_ids:
            raise ValueError(f"id_teacher {id_teacher} không tồn tại trong Teacher")

        values = (
            row["class_code"],
            id_subject,
            id_teacher,
            row["semester"],
            row["school_year"],
            row["group_number"],
            int(row["max_student"]),
            row["status"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import CourseClass hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()