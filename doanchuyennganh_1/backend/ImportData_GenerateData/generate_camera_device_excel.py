import pandas as pd
import mysql.connector
import random

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\camera_device_dataset_vku.xlsx"

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345678",
    "database": "face_attendance_system"
}

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

cursor.execute("SELECT id_room, room_code, room_name FROM ClassRoom")
rooms = cursor.fetchall()

camera_data = []

for id_room, room_code, room_name in rooms:
    camera_data.append({
        "camera_name": f"Camera {room_code}",
        "camera_ip": f"192.168.{random.randint(20, 50)}.{random.randint(10, 250)}",
        "location": room_name,
        "id_room": id_room,
        "status": random.choice(["ONLINE", "OFFLINE"])
    })

df = pd.DataFrame(camera_data)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file CameraDevice Excel thành công!")
print(f"File: {OUTPUT_FILE}")

cursor.close()
conn.close()