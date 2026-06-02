# DoAnChuyenNganh_1

# Setup
1. chạy npm install
2. nạp file DoAnChuyenNganh_1\doanchuyennganh_1\src\data\MySQL.sql vào database MySQL 
3. chỉnh sua config ở DoAnChuyenNganh_1\doanchuyennganh_1\backend\config\db.js


# Cách cập nhật mới nhất từ GitHub vào branch main <br>
```
git checkout main
git fetch --all --prune
git pull origin main
```

# Tạo branch mới để làm tính năng mới trên đó <br>
```
git branch new_branch
git checkout new_branch
```

# Đẩy branch mới lên Github <br>
```
git add .
git commit -m "Thêm chức năng gì đó"
git push origin new_branch
```

# Cách chạy project 
```
B1: chạy DoAnChuyenNganh_1\doanchuyennganh_1\backend\server.js (run)

B2: mở Terminal DoAnChuyenNganh_1\doanchuyennganh_1\face-recognition
cd C:\html\DoAnChuyenNganh_1\doanchuyennganh_1\face-recognition
.\.venv\Scripts\activate
uvicorn app:app --host 0.0.0.0 --port 8001 --reload

B3: mở Terminal DoAnChuyenNganh_1\doanchuyennganh_1
npm run dev   

B4: Ctrl + Click vào link mới xuất hiện http://localhost:5173

B5: mở link http://localhost:5173/camera-room
```
