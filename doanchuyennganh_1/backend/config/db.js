import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "face_attendance_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;