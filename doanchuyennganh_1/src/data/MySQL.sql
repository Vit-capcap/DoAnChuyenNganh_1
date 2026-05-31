CREATE DATABASE face_attendance_system;
USE face_attendance_system;

-- =========================
-- 1. Department
-- =========================
CREATE TABLE Department (
    id_department INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    description TEXT
);

-- =========================
-- 2. Teacher
-- =========================
CREATE TABLE Teacher (
    id_teacher INT AUTO_INCREMENT PRIMARY KEY,
    teacher_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    avatar VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (department_id)
        REFERENCES Department(id_department)
);

-- =========================
-- 3. Student
-- =========================
CREATE TABLE Student (
    id_student INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    avatar VARCHAR(255),

    faculty VARCHAR(255),
    class_name VARCHAR(100),
    course_year VARCHAR(20),

    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- 4. FaceData
-- =========================
CREATE TABLE FaceData (
    id_face INT AUTO_INCREMENT PRIMARY KEY,

    id_student INT NOT NULL,

    face_embedding LONGTEXT,
    face_image VARCHAR(255),

    model_version VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_student)
        REFERENCES Student(id_student)
        ON DELETE CASCADE
);

-- =========================
-- 5. Subject
-- =========================
CREATE TABLE Subject (
    id_subject INT AUTO_INCREMENT PRIMARY KEY,

    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,

    credits INT DEFAULT 3,

    description TEXT
);

-- =========================
-- 6. Classroom
-- =========================
CREATE TABLE ClassRoom (
    id_room INT AUTO_INCREMENT PRIMARY KEY,

    room_code VARCHAR(50) UNIQUE NOT NULL,
    room_name VARCHAR(255),

    building VARCHAR(100),
    floor VARCHAR(50),

    capacity INT,

    camera_ip VARCHAR(255),

    status ENUM('ACTIVE', 'MAINTENANCE')
        DEFAULT 'ACTIVE'
);

-- =========================
-- 7. CameraDevice
-- =========================
CREATE TABLE CameraDevice (
    id_camera INT AUTO_INCREMENT PRIMARY KEY,

    camera_name VARCHAR(255),

    camera_ip VARCHAR(255),

    location VARCHAR(255),

    id_room INT,

    status ENUM('ONLINE', 'OFFLINE')
        DEFAULT 'ONLINE',

    FOREIGN KEY (id_room)
        REFERENCES ClassRoom(id_room)
);

-- =========================
-- 8. CourseClass
-- =========================
CREATE TABLE CourseClass (
    id_course_class INT AUTO_INCREMENT PRIMARY KEY,

    class_code VARCHAR(100) UNIQUE NOT NULL,

    id_subject INT NOT NULL,

    id_teacher INT NOT NULL,

    semester VARCHAR(50),

    school_year VARCHAR(50),

    group_number VARCHAR(20),

    max_student INT DEFAULT 50,

    status ENUM('OPEN', 'CLOSED')
        DEFAULT 'OPEN',

    FOREIGN KEY (id_subject)
        REFERENCES Subject(id_subject),

    FOREIGN KEY (id_teacher)
        REFERENCES Teacher(id_teacher)
);

-- =========================
-- 9. Enrollment
-- =========================
CREATE TABLE Enrollment (
    id_enrollment INT AUTO_INCREMENT PRIMARY KEY,

    id_student INT NOT NULL,

    id_course_class INT NOT NULL,

    enroll_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status ENUM('STUDYING', 'FINISHED', 'CANCELLED')
        DEFAULT 'STUDYING',

    FOREIGN KEY (id_student)
        REFERENCES Student(id_student)
        ON DELETE CASCADE,

    FOREIGN KEY (id_course_class)
        REFERENCES CourseClass(id_course_class)
        ON DELETE CASCADE
);

-- =========================
-- 10. Schedule
-- =========================
CREATE TABLE Schedule (
    id_schedule INT AUTO_INCREMENT PRIMARY KEY,

    id_course_class INT NOT NULL,

    id_room INT NOT NULL,

    day_of_week ENUM(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ),

    start_time TIME,

    end_time TIME,

    start_date DATE,

    end_date DATE,

    FOREIGN KEY (id_course_class)
        REFERENCES CourseClass(id_course_class),

    FOREIGN KEY (id_room)
        REFERENCES ClassRoom(id_room)
);

-- =========================
-- 11. Session
-- =========================
CREATE TABLE Session (
    id_session INT AUTO_INCREMENT PRIMARY KEY,

    id_schedule INT NOT NULL,

    session_date DATE NOT NULL,

    session_number INT,

    status ENUM(
        'NOT_STARTED',
        'ONGOING',
        'FINISHED'
    ) DEFAULT 'NOT_STARTED',

    FOREIGN KEY (id_schedule)
        REFERENCES Schedule(id_schedule)
);

-- =========================
-- 12. Attendance
-- =========================
CREATE TABLE Attendance (
    id_attendance INT AUTO_INCREMENT PRIMARY KEY,

    id_session INT NOT NULL,

    id_student INT NOT NULL,

    check_in_time DATETIME,

    status ENUM(
        'PRESENT',
        'ABSENT',
        'LATE'
    ) DEFAULT 'ABSENT',

    confidence_score FLOAT,

    face_image VARCHAR(255),

    note TEXT,

    FOREIGN KEY (id_session)
        REFERENCES Session(id_session)
        ON DELETE CASCADE,

    FOREIGN KEY (id_student)
        REFERENCES Student(id_student)
        ON DELETE CASCADE
);

-- =========================
-- 13. RecognitionHistory
-- =========================
CREATE TABLE RecognitionHistory (
    id_history INT AUTO_INCREMENT PRIMARY KEY,

    id_student INT,

    capture_time DATETIME
        DEFAULT CURRENT_TIMESTAMP,

    confidence FLOAT,

    camera_id INT,

    result ENUM(
        'SUCCESS',
        'FAILED'
    ),

    image_path VARCHAR(255),

    FOREIGN KEY (id_student)
        REFERENCES Student(id_student),

    FOREIGN KEY (camera_id)
        REFERENCES CameraDevice(id_camera)
);

-- =========================
-- 14. Account
-- =========================
CREATE TABLE Account (
    id_account INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(100)
        UNIQUE NOT NULL,

    password VARCHAR(255)
        NOT NULL,

    role ENUM(
        'ADMIN',
        'TEACHER',
        'STUDENT'
    ) NOT NULL,

    teacher_id INT NULL,

    student_id INT NULL,

    last_login DATETIME,

    status ENUM(
        'ACTIVE',
        'LOCKED'
    ) DEFAULT 'ACTIVE',

    FOREIGN KEY (teacher_id)
        REFERENCES Teacher(id_teacher),

    FOREIGN KEY (student_id)
        REFERENCES Student(id_student)
);

-- =========================
-- 15. Notification
-- =========================
CREATE TABLE Notification (
    id_notification INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255),

    content TEXT,

    receiver_id INT,

    receiver_role ENUM(
        'ADMIN',
        'TEACHER',
        'STUDENT'
    ),

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    is_read BOOLEAN DEFAULT FALSE
);

-- =========================
-- 16. SystemLog
-- =========================
CREATE TABLE SystemLog (
    id_log INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    action VARCHAR(255),

    device VARCHAR(255),

    ip_address VARCHAR(100),

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
);
-- //

CREATE TABLE IF NOT EXISTS SystemSetting (
  id_setting INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value LONGTEXT,
  setting_type ENUM('TEXT', 'NUMBER', 'BOOLEAN', 'JSON', 'IMAGE') DEFAULT 'TEXT',
  description VARCHAR(255),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);