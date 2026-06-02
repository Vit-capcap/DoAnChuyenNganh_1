# DoAnChuyenNganh_1


<br> <br> <br>

# Setup 

> chú ý: project này yêu cầu Python phiên bản -3.11 <br>
> vào link ni để tải Python -3.11, cụ thể hơn là -3.11.9 https://www.python.org/downloads/release/python-3119/ <br>

1. nạp file Hoàng gửi bên Zalo face_attendance_system.sql vào database MySQL 
2. chỉnh sửa cài đặt cho data ở DoAnChuyenNganh_1\doanchuyennganh_1\backend\config\db.js
3. Setup Backend, trong terminal chạy:
```bash
cd doanchuyennganh_1\backend
npm install
```

4. Setup Frontend, trong terminal chạy:
```bash
cd doanchuyennganh_1
npm install
```

5. Setup AI, trong terminal chạy:
```bash
cd doanchuyennganh_1\face-recognition
python -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

sau lệnh "pip install -r requirements.txt" thì chờ hắn tải xong thì có thể chạy lệnh này để tắt .venv virtual enviroment
```bash
deactivate
```

<br> <br> <br>

# Cách chạy
1. Khởi động MySQL bên máy (dùng XamPP / Docker / ...)
2. Khởi động Backend (trong 1 terminal riêng)
```
cd doanchuyennganh_1\backend
node server.js
```

3. Khởi động AI (trong 1 terminal riêng)
```
cd doanchuyennganh_1\face-recognition
.\.venv\Scripts\activate
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

4. Khởi động Frontend (trong 1 terminal riêng)
```
cd doanchuyennganh_1
npm run dev
```


<br> <br> <br>

# Cách tắt.
1. đối với terminal frontend, chỉ cần Ctrl + C là đủ

2. đối với terminal AI, Ctrl + C để tắt uvicorn, còn nếu muốn tắt cả .venv virtual enviroment thì
```bash
deactivate
```

3. đối với terminal Backend, chỉ cần Ctrl + C là đủ


<br> <br> <br>

# Cách cập nhật mới nhất từ GitHub vào branch main <br>
```
git checkout main
git fetch --all --prune
git pull origin main
```


<br> <br> <br>

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
