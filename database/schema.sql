-- Kurdistan Education Forum (KEF) Database Schema
-- For XAMPP (phpMyAdmin), Cloud SQL, or any Standard MySQL Server 8.0+

CREATE DATABASE IF NOT EXISTS `kef_system` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kef_system`;

-- 1. Table: system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_name` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: invitation_codes
CREATE TABLE IF NOT EXISTS `invitation_codes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `description_en` VARCHAR(255) NOT NULL,
    `description_ku` VARCHAR(255) NOT NULL,
    `usage_limit` INT NOT NULL DEFAULT 1,
    `used_count` INT NOT NULL DEFAULT 0,
    `expiry_date` DATE NOT NULL,
    `status` ENUM('Active', 'Inactive', 'Expired') NOT NULL DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Table: users
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `registration_id` VARCHAR(20) NOT NULL UNIQUE,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `organization` VARCHAR(150) NOT NULL,
    `position` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `gender` VARCHAR(30) NOT NULL,
    `food_allergies` VARCHAR(255) DEFAULT NULL,
    `country` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `qr_code` VARCHAR(255) NOT NULL, -- Paths or text string representation
    `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    `badge_category` ENUM('Administration', 'Organizer', 'Academic Staff', 'Attendee', 'VIP Guest') DEFAULT NULL,
    `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Table: events
CREATE TABLE IF NOT EXISTS `events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Table: agenda
CREATE TABLE IF NOT EXISTS `agenda` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_id` INT NOT NULL,
    `session_title` VARCHAR(255) NOT NULL,
    `speaker` VARCHAR(150) NOT NULL,
    `session_date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `location` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Table: attendance
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `scan_date` DATE NOT NULL,
    `scan_time` TIME NOT NULL,
    `scanner_admin` VARCHAR(150) NOT NULL,
    `attendance_status` ENUM('Present', 'Duplicate') NOT NULL DEFAULT 'Present',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Table: badges
CREATE TABLE IF NOT EXISTS `badges` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `badge_number` VARCHAR(50) NOT NULL UNIQUE,
    `badge_file` VARCHAR(255) NOT NULL,
    `generated_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Table: email_logs
CREATE TABLE IF NOT EXISTS `email_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `email_type` VARCHAR(100) NOT NULL,
    `sent_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` VARCHAR(50) NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- SEED INITIAL DATA
-- --------------------------------------------------------

-- Default Settings
INSERT INTO `system_settings` (`setting_name`, `setting_value`) VALUES
('forum_title_en', 'Kurdistan Education Forum (KEF) 2026'),
('forum_title_ku', 'Kurdistan Education Forum 2026'),
('allow_public_registration', 'true'),
('mandatory_invitation_code', 'true'),
('system_timezone', 'Asia/Baghdad'),
('event_location', 'Saad Abdullah Palace, Erbil, Kurdistan Region');

-- Default Codes
INSERT INTO `invitation_codes` (`code`, `description_en`, `description_ku`, `usage_limit`, `used_count`, `expiry_date`, `status`) VALUES
('KEF2026-VIP', 'Presidents, Ministries, Chancellors and VIP Scholars', 'Presidents, Ministries, Chancellors and VIP Scholars Alt', 50, 0, '2026-06-15', 'Active'),
('KEF2026-ACADEMIC', 'University Lecturers and Institutional Delegates', 'University Lecturers and Institutional Delegates Alt', 200, 0, '2026-06-12', 'Active'),
('KEF2026-GUEST', 'General Registered Attendees', 'General Registered Attendees Alt', 500, 0, '2026-06-15', 'Active');

-- Preseed Event
INSERT INTO `events` (`id`, `event_name`, `location`, `start_date`, `end_date`, `description`) VALUES
(1, 'Kurdistan Education Forum 2026', 'Saad Abdullah Palace, Erbil', '2026-06-15', '2026-06-17', 'Primary forum addressing quality, pedagogy and reforms.');

-- Preseed Sessions
INSERT INTO `agenda` (`event_id`, `session_title`, `speaker`, `session_date`, `start_time`, `end_time`, `location`, `description`) VALUES
(1, 'Keynote Address: Digital Era Pedagogy', 'Minister of Education, KRG', '2026-06-15', '09:00:00', '10:30:00', 'Saad Abdullah Palace, Main Hall', 'Strategic pathways on tech integrations.'),
(1, 'Panel 1: Enhancing Higher Education Quality', 'Salahaddin Univ. Pedagogy Panel', '2026-06-15', '11:00:00', '12:30:00', 'Conference Room Alpha', 'Quality assurance debate.'),
(1, 'Workshop: Interactive Bilingual Methodologies', 'Linguistics Experts', '2026-06-16', '14:00:00', '16:00:00', 'Seminar Hall B', 'Syllabi custom design guides.');

-- Seed Admin User (Password is 'Admin@KEF2026' - bcrypt hash seeded)
INSERT INTO `users` (`id`, `registration_id`, `full_name`, `email`, `password`, `organization`, `position`, `phone`, `gender`, `food_allergies`, `country`, `city`, `qr_code`, `role`, `badge_category`, `email_verified`) VALUES
(1, 'KEF-10041', 'Dr. Alan Noori', 'alan.noori@kef.edu', '$2y$10$wKz0bK9u8f7BOfXvscW3rOI/zNn23Slyf7D7EwS2D1m4F93VofXeq', 'Ministry of Higher Education', 'Committee Head', '07501234567', 'Male', 'None', 'Iraq', 'Erbil', 'KEF-10041|Dr. Alan Noori|alan.noori@kef.edu', 'admin', 'Administration', 1);
