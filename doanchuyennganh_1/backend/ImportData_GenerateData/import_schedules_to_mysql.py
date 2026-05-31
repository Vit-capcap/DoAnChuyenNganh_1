import pandas as pd
import mysql.connector
import os

EXCEL_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\schedule_dataset_vku.xlsx"

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

cursor.execute("SELECT id_course_class FROM CourseClass")
valid_course_class_ids = {row[0] for row in cursor.fetchall()}

cursor.execute("SELECT id_room FROM ClassRoom")
valid_room_ids = {row[0] for row in cursor.fetchall()}

sql = """
INSERT INTO Schedule (
    id_course_class,
    id_room,
    day_of_week,
    start_time,
    end_time,
    start_date,
    end_date
)
VALUES (%s, %s, %s, %s, %s, %s, %s)
"""

success = 0
failed = 0

for index, row in df.iterrows():
    try:
        id_course_class = int(row["id_course_class"])
        id_room = int(row["id_room"])

        if id_course_class not in valid_course_class_ids:
            raise ValueError(f"id_course_class {id_course_class} không tồn tại")

        if id_room not in valid_room_ids:
            raise ValueError(f"id_room {id_room} không tồn tại")

        values = (
            id_course_class,
            id_room,
            row["day_of_week"],
            str(row["start_time"]),
            str(row["end_time"]),
            row["start_date"],
            row["end_date"]
        )

        cursor.execute(sql, values)
        success += 1

    except Exception as e:
        failed += 1
        print(f"Lỗi dòng Excel {index + 2}: {e}")

conn.commit()

print("Import Schedule hoàn tất!")
print(f"Thành công: {success}")
print(f"Lỗi: {failed}")

cursor.close()
conn.close()