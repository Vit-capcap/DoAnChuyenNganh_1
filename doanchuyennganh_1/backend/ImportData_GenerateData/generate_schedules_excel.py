import pandas as pd
import mysql.connector
import random
from datetime import date, timedelta

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\schedule_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_course_class FROM CourseClass")
course_classes = [row[0] for row in cursor.fetchall()]

cursor.execute("SELECT id_room FROM ClassRoom")
rooms = [row[0] for row in cursor.fetchall()]

days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

time_slots = [
    ("07:00:00", "09:00:00"),
    ("09:15:00", "11:15:00"),
    ("13:00:00", "15:00:00"),
    ("15:15:00", "17:15:00"),
]

schedules = []

start_date = date(2025, 9, 1)
end_date = date(2025, 12, 31)

for id_course_class in course_classes:
    id_room = random.choice(rooms)
    day_of_week = random.choice(days)
    start_time, end_time = random.choice(time_slots)

    schedules.append({
        "id_course_class": id_course_class,
        "id_room": id_room,
        "day_of_week": day_of_week,
        "start_time": start_time,
        "end_time": end_time,
        "start_date": start_date,
        "end_date": end_date
    })

df = pd.DataFrame(schedules)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file Schedule Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()