import pandas as pd
import random
from datetime import datetime, timedelta

OUTPUT_FILE = "C:\\html\\DoAnChuyenNganh_1\\doanchuyennganh_1\\backend\\Data_Excel\\system_log_dataset_vku.xlsx"

actions = [
    "LOGIN",
    "LOGOUT",
    "CREATE_STUDENT",
    "UPDATE_STUDENT",
    "DELETE_STUDENT",
    "CREATE_ATTENDANCE",
    "UPDATE_ATTENDANCE",
    "IMPORT_DATA",
    "EXPORT_REPORT"
]

devices = [
    "Windows 10 - Chrome",
    "Windows 11 - Edge",
    "Android App",
    "iPhone Safari",
    "Admin Dashboard"
]

logs = []

for i in range(300):
    logs.append({
        "user_id": random.randint(1, 1000),
        "action": random.choice(actions),
        "device": random.choice(devices),
        "ip_address": f"192.168.{random.randint(1, 20)}.{random.randint(2, 254)}",
        "created_at": datetime.now() - timedelta(days=random.randint(1, 90))
    })

df = pd.DataFrame(logs)
df.to_excel(OUTPUT_FILE, index=False)

print("Tạo SystemLog Excel thành công!")
print(f"File: {OUTPUT_FILE}")