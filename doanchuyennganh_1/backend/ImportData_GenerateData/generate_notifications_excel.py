import pandas as pd
import mysql.connector
import random
from datetime import datetime, timedelta

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\notification_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_teacher FROM Teacher")
teachers = [row[0] for row in cursor.fetchall()]

cursor.execute("SELECT id_student FROM Student")
students = [row[0] for row in cursor.fetchall()]

titles = [
    "Thông báo lịch học",
    "Thông báo điểm danh",
    "Cập nhật hệ thống",
    "Nhắc nhở đi học",
    "Thông báo nghỉ học"
]

notifications = []

for i in range(200):
    receiver_role = random.choice(["ADMIN", "TEACHER", "STUDENT"])

    if receiver_role == "ADMIN":
        receiver_id = 1
    elif receiver_role == "TEACHER":
        receiver_id = random.choice(teachers)
    else:
        receiver_id = random.choice(students)

    title = random.choice(titles)

    notifications.append({
        "title": title,
        "content": f"Nội dung {title.lower()} số {i + 1}",
        "receiver_id": receiver_id,
        "receiver_role": receiver_role,
        "created_at": datetime.now() - timedelta(days=random.randint(1, 60)),
        "is_read": random.choice([0, 1])
    })

df = pd.DataFrame(notifications)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo Notification Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()