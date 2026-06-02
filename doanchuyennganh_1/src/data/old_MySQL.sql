-- ============================================================
-- Database Structure: face_attendance_system
-- Generated from uploaded MySQL dump
-- Purpose: Recreate database structure only, without sample data
-- MySQL version target: 8.0+
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS `face_attendance_system`;
CREATE DATABASE `face_attendance_system`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `face_attendance_system`;

-- ------------------------------------------------------------
-- Table structure for `department`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `department`;
CREATE TABLE `department` (
  `id_department` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(255) NOT NULL,
  `description` text,
  PRIMARY KEY (`id_department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `teacher`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `teacher`;
CREATE TABLE `teacher` (
  `id_teacher` int NOT NULL AUTO_INCREMENT,
  `teacher_code` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `avatar` longtext,
  `password` varchar(255) NOT NULL,
  `department_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_teacher`),
  UNIQUE KEY `teacher_code` (`teacher_code`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `teacher_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`id_department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `student`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `student`;
CREATE TABLE `student` (
  `id_student` int NOT NULL AUTO_INCREMENT,
  `student_code` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `avatar` longtext,
  `faculty` varchar(255) DEFAULT NULL,
  `class_name` varchar(100) DEFAULT NULL,
  `course_year` varchar(20) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_student`),
  UNIQUE KEY `student_code` (`student_code`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `subject`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `subject`;
CREATE TABLE `subject` (
  `id_subject` int NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(50) NOT NULL,
  `subject_name` varchar(255) NOT NULL,
  `credits` int DEFAULT '3',
  `description` text,
  PRIMARY KEY (`id_subject`),
  UNIQUE KEY `subject_code` (`subject_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `classroom`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `classroom`;
CREATE TABLE `classroom` (
  `id_room` int NOT NULL AUTO_INCREMENT,
  `room_code` varchar(50) NOT NULL,
  `room_name` varchar(255) DEFAULT NULL,
  `building` varchar(100) DEFAULT NULL,
  `floor` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `camera_ip` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','MAINTENANCE') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id_room`),
  UNIQUE KEY `room_code` (`room_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `cameradevice`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `cameradevice`;
CREATE TABLE `cameradevice` (
  `id_camera` int NOT NULL AUTO_INCREMENT,
  `camera_name` varchar(255) DEFAULT NULL,
  `camera_ip` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `id_room` int DEFAULT NULL,
  `status` enum('ONLINE','OFFLINE') DEFAULT 'ONLINE',
  PRIMARY KEY (`id_camera`),
  KEY `id_room` (`id_room`),
  CONSTRAINT `cameradevice_ibfk_1` FOREIGN KEY (`id_room`) REFERENCES `classroom` (`id_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `courseclass`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `courseclass`;
CREATE TABLE `courseclass` (
  `id_course_class` int NOT NULL AUTO_INCREMENT,
  `class_code` varchar(100) NOT NULL,
  `id_subject` int NOT NULL,
  `id_teacher` int NOT NULL,
  `semester` varchar(50) DEFAULT NULL,
  `school_year` varchar(50) DEFAULT NULL,
  `group_number` varchar(20) DEFAULT NULL,
  `max_student` int DEFAULT '50',
  `status` enum('OPEN','CLOSED') DEFAULT 'OPEN',
  PRIMARY KEY (`id_course_class`),
  UNIQUE KEY `class_code` (`class_code`),
  KEY `id_subject` (`id_subject`),
  KEY `id_teacher` (`id_teacher`),
  CONSTRAINT `courseclass_ibfk_1` FOREIGN KEY (`id_subject`) REFERENCES `subject` (`id_subject`),
  CONSTRAINT `courseclass_ibfk_2` FOREIGN KEY (`id_teacher`) REFERENCES `teacher` (`id_teacher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `enrollment`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `enrollment`;
CREATE TABLE `enrollment` (
  `id_enrollment` int NOT NULL AUTO_INCREMENT,
  `id_student` int NOT NULL,
  `id_course_class` int NOT NULL,
  `enroll_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('STUDYING','FINISHED','CANCELLED') DEFAULT 'STUDYING',
  PRIMARY KEY (`id_enrollment`),
  KEY `id_student` (`id_student`),
  KEY `id_course_class` (`id_course_class`),
  CONSTRAINT `enrollment_ibfk_1` FOREIGN KEY (`id_student`) REFERENCES `student` (`id_student`) ON DELETE CASCADE,
  CONSTRAINT `enrollment_ibfk_2` FOREIGN KEY (`id_course_class`) REFERENCES `courseclass` (`id_course_class`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `schedule`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `schedule`;
CREATE TABLE `schedule` (
  `id_schedule` int NOT NULL AUTO_INCREMENT,
  `id_course_class` int NOT NULL,
  `id_room` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id_schedule`),
  KEY `id_course_class` (`id_course_class`),
  KEY `id_room` (`id_room`),
  CONSTRAINT `schedule_ibfk_1` FOREIGN KEY (`id_course_class`) REFERENCES `courseclass` (`id_course_class`),
  CONSTRAINT `schedule_ibfk_2` FOREIGN KEY (`id_room`) REFERENCES `classroom` (`id_room`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `session`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
  `id_session` int NOT NULL AUTO_INCREMENT,
  `id_schedule` int NOT NULL,
  `session_date` date NOT NULL,
  `session_number` int DEFAULT NULL,
  `status` enum('NOT_STARTED','ONGOING','FINISHED') DEFAULT 'NOT_STARTED',
  PRIMARY KEY (`id_session`),
  KEY `id_schedule` (`id_schedule`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`id_schedule`) REFERENCES `schedule` (`id_schedule`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `attendance`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id_attendance` int NOT NULL AUTO_INCREMENT,
  `id_session` int NOT NULL,
  `id_student` int NOT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `status` enum('PRESENT','ABSENT','LATE') DEFAULT 'ABSENT',
  `confidence_score` float DEFAULT NULL,
  `face_image` longtext,
  `note` text,
  PRIMARY KEY (`id_attendance`),
  KEY `id_session` (`id_session`),
  KEY `id_student` (`id_student`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`id_session`) REFERENCES `session` (`id_session`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`id_student`) REFERENCES `student` (`id_student`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `facedata`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `facedata`;
CREATE TABLE `facedata` (
  `id_face` int NOT NULL AUTO_INCREMENT,
  `id_student` int NOT NULL,
  `face_embedding` longtext,
  `face_image` longtext,
  `model_version` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_face`),
  KEY `id_student` (`id_student`),
  CONSTRAINT `facedata_ibfk_1` FOREIGN KEY (`id_student`) REFERENCES `student` (`id_student`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `recognitionhistory`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `recognitionhistory`;
CREATE TABLE `recognitionhistory` (
  `id_history` int NOT NULL AUTO_INCREMENT,
  `id_student` int DEFAULT NULL,
  `capture_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `confidence` float DEFAULT NULL,
  `camera_id` int DEFAULT NULL,
  `result` enum('SUCCESS','FAILED') DEFAULT NULL,
  `image_path` longtext,
  PRIMARY KEY (`id_history`),
  KEY `id_student` (`id_student`),
  KEY `camera_id` (`camera_id`),
  CONSTRAINT `recognitionhistory_ibfk_1` FOREIGN KEY (`id_student`) REFERENCES `student` (`id_student`),
  CONSTRAINT `recognitionhistory_ibfk_2` FOREIGN KEY (`camera_id`) REFERENCES `cameradevice` (`id_camera`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `account`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `account`;
CREATE TABLE `account` (
  `id_account` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','TEACHER','STUDENT') NOT NULL,
  `teacher_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `status` enum('ACTIVE','LOCKED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id_account`),
  UNIQUE KEY `username` (`username`),
  KEY `teacher_id` (`teacher_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`id_teacher`),
  CONSTRAINT `account_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `student` (`id_student`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `notification`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `content` text,
  `receiver_id` int DEFAULT NULL,
  `receiver_role` enum('ADMIN','TEACHER','STUDENT') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id_notification`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `systemlog`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `systemlog`;
CREATE TABLE `systemlog` (
  `id_log` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `device` varchar(255) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `systemsetting`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `systemsetting`;
CREATE TABLE `systemsetting` (
  `id_setting` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext,
  `setting_type` enum('TEXT','NUMBER','BOOLEAN','JSON','IMAGE') DEFAULT 'TEXT',
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_setting`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- Table structure for `dim_customer`
-- ------------------------------------------------------------

DROP TABLE IF EXISTS `dim_customer`;
CREATE TABLE `dim_customer` (
  `customer_key` int NOT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `continent` varchar(50) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `age_group` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`customer_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- End of database structure
-- ============================================================
