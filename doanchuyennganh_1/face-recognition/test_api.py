import base64
import requests

IMAGE_PATH = "test.jpg"
API_URL = "http://127.0.0.1:8001/recognize"

with open(IMAGE_PATH, "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode("utf-8")

payload = {
    "image": f"data:image/jpeg;base64,{image_base64}"
}

session = requests.Session()
session.trust_env = False  # bỏ qua proxy trong Windows/environment

res = session.post(API_URL, json=payload, timeout=60)

print("Status:", res.status_code)

try:
    print(res.json())
except Exception:
    print(res.text)