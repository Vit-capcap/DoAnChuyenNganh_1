import pandas as pd
import mysql.connector
from datetime import timedelta
import random

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\session_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

DAY_MAP = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("""
SELECT id_schedule, day_of_week, start_date, end_date
FROM Schedule
""")

schedules = cursor.fetchall()

sessions = []

for id_schedule, day_of_week, start_date, end_date in schedules:
    target_weekday = DAY_MAP[day_of_week]

    current_date = start_date

    while current_date.weekday() != target_weekday:
        current_date += timedelta(days=1)

    session_number = 1

    while current_date <= end_date:
        sessions.append({
            "id_schedule": id_schedule,
            "session_date": current_date,
            "session_number": session_number,
            "status": random.choice(["NOT_STARTED", "ONGOING", "FINISHED"])
        })

        session_number += 1
        current_date += timedelta(days=7)

df = pd.DataFrame(sessions)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file Session Excel thành công!")
print(f"File: {OUTPUT_FILE}")
print(f"Số buổi học: {len(sessions)}")

cursor.close()
conn.close()