# DoAnChuyenNganh_1

HOÀNG KHOAN GHÉP BRANCH bao_diemdanh VÀO NGHEN, KHOAN GHÉP KHOAN KHÉP


<br> <br> <br>

# Setup 
1. nạp file Hoàng gửi bên Zalo face_attendance_system.sql vào database MySQL 
2. chỉnh sửa cài đặt cho data ở DoAnChuyenNganh_1\doanchuyennganh_1\backend\config\db.js
3. Setup Backend, trong terminal chạy:
```
cd doanchuyennganh_1\backend
npm install
```

4. Setup Frontend, trong terminal chạy:
```
cd doanchuyennganh_1
npm install
```

<br> <br> <br>

# Cách chạy
1. Khởi động MySQL bên máy (dùng XamPP / Docker / ...)
2. Khởi động Backend
```
cd doanchuyennganh_1\backend
node server.js
```

3. Khởi động Frontend
```
cd doanchuyennganh_1
npm run dev
```

> khi nào cần tắt chỉ cần ctrl + C tại terminal.


<br> <br> <br>

# Cách cập nhật mới nhất từ GitHub vào branch main <br>
```
git checkout main
git fetch --all --prune
git pull origin main
```