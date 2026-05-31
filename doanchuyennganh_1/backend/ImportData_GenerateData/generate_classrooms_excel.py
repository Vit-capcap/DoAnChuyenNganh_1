import pandas as pd
import random

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\classroom_dataset_vku.xlsx"

buildings = ["A", "B", "C", "D"]
statuses = ["ACTIVE", "MAINTENANCE"]

classrooms = []

for i in range(1, 31):
    building = random.choice(buildings)
    floor = random.randint(1, 5)
    room_number = f"{floor}{i:02d}"

    room_code = f"{building}{room_number}"

    classrooms.append({
        "room_code": room_code,
        "room_name": f"Phòng {room_code}",
        "building": f"Tòa {building}",
        "floor": f"Tầng {floor}",
        "capacity": random.choice([30, 40, 50, 60]),
        "camera_ip": f"192.168.{random.randint(1, 10)}.{random.randint(10, 250)}",
        "status": random.choice(statuses)
    })

df = pd.DataFrame(classrooms)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo file ClassRoom Excel thành công!")
print(f"File: {OUTPUT_FILE}")