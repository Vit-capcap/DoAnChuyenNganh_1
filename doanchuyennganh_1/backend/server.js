import express from "express";
import cors from "cors";

import dashboardRoutes from "./routes/dashboardRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import roomRouters from "./routes/roomRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import cameraRoutes from "./routes/cameraRoutes.js"


const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/teachers", teacherRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/rooms", roomRouters);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/cameras", cameraRoutes);


const PORT = 3060;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
