import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
// import dotenv from "dotenv";

// __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dashboardRoutes from "./routes/dashboardRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import roomRouters from "./routes/roomRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";

import accountRoutes from "./routes/accountRoutes.js";
import studentSelfRoutes from "./routes/studentSelfRoutes.js";

import settingRoutes from "./routes/settingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";


const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files: serve ảnh avatars và faces từ thư mục backend/avatars, backend/faces
// Nếu thư mục chưa tồn tại, middleware này tự bỏ qua (không crash)
app.use("/avatars", express.static(path.join(__dirname, "avatars")));
app.use("/faces", express.static(path.join(__dirname, "faces")));


app.use("/api/teachers", teacherRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/rooms", roomRouters);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/student", studentSelfRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/reports", reportRoutes);


const PORT = 3060;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});