/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SourceFile {
  filename: string;
  category: 'database' | 'config' | 'public' | 'admin' | 'user' | 'api';
  description: string;
  code: string;
}

export const PHP_SOURCE_FILES: SourceFile[] = [
  {
    filename: 'database/schema.sql',
    category: 'database',
    description: 'Complete MySQL Database Structure & Seeding. Handles foreign key cascades and key constraints.',
    code: `-- Kurdistan Education Forum (KEF) Database Schema
-- For XAMPP (phpMyAdmin) or any Standard MySQL Server 8.0+

CREATE DATABASE IF NOT EXISTS \`kef_system\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`kef_system\`;

-- 1. Table: system_settings
CREATE TABLE IF NOT EXISTS \`system_settings\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`setting_name\` VARCHAR(100) NOT NULL UNIQUE,
    \`setting_value\` TEXT NOT NULL,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: invitation_codes
CREATE TABLE IF NOT EXISTS \`invitation_codes\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`code\` VARCHAR(50) NOT NULL UNIQUE,
    \`description_en\` VARCHAR(255) NOT NULL,
    \`description_ku\` VARCHAR(255) NOT NULL,
    \`usage_limit\` INT NOT NULL DEFAULT 1,
    \`used_count\` INT NOT NULL DEFAULT 0,
    \`expiry_date\` DATE NOT NULL,
    \`status\` ENUM('Active', 'Inactive', 'Expired') NOT NULL DEFAULT 'Active',
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Table: users
CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`registration_id\` VARCHAR(20) NOT NULL UNIQUE,
    \`full_name\` VARCHAR(150) NOT NULL,
    \`email\` VARCHAR(150) NOT NULL UNIQUE,
    \`password\` VARCHAR(255) NOT NULL,
    \`organization\` VARCHAR(150) NOT NULL,
    \`position\` VARCHAR(150) NOT NULL,
    \`phone\` VARCHAR(50) NOT NULL,
    \`gender\` VARCHAR(30) NOT NULL,
    \`food_allergies\` VARCHAR(255) DEFAULT NULL,
    \`country\` VARCHAR(100) NOT NULL,
    \`city\` VARCHAR(100) NOT NULL,
    \`qr_code\` VARCHAR(255) NOT NULL, -- Paths or text string representation
    \`role\` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    \`email_verified\` TINYINT(1) NOT NULL DEFAULT 0,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Table: events
CREATE TABLE IF NOT EXISTS \`events\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`event_name\` VARCHAR(255) NOT NULL,
    \`location\` VARCHAR(255) NOT NULL,
    \`start_date\` DATE NOT NULL,
    \`end_date\` DATE NOT NULL,
    \`description\` TEXT,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Table: agenda
CREATE TABLE IF NOT EXISTS \`agenda\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`event_id\` INT NOT NULL,
    \`session_title\` VARCHAR(255) NOT NULL,
    \`speaker\` VARCHAR(150) NOT NULL,
    \`session_date\` DATE NOT NULL,
    \`start_time\` TIME NOT NULL,
    \`end_time\` TIME NOT NULL,
    \`location\` VARCHAR(150) NOT NULL,
    \`description\` TEXT,
    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Table: attendance
CREATE TABLE IF NOT EXISTS \`attendance\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`scan_date\` DATE NOT NULL,
    \`scan_time\` TIME NOT NULL,
    \`scanner_admin\` VARCHAR(150) NOT NULL,
    \`attendance_status\` ENUM('Present', 'Duplicate') NOT NULL DEFAULT 'Present',
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Table: badges
CREATE TABLE IF NOT EXISTS \`badges\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`badge_number\` VARCHAR(50) NOT NULL UNIQUE,
    \`badge_file\` VARCHAR(255) NOT NULL,
    \`generated_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Table: email_logs
CREATE TABLE IF NOT EXISTS \`email_logs\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`user_id\` INT NOT NULL,
    \`email_type\` VARCHAR(100) NOT NULL,
    \`sent_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \`status\` VARCHAR(50) NOT NULL,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------------------
-- SEED INITIAL DATA
-- --------------------------------------------------------

-- Default Settings
INSERT INTO \`system_settings\` (\`setting_name\`, \`setting_value\`) VALUES
('forum_title_en', 'Kurdistan Education Forum (KEF) 2026'),
('forum_title_ku', 'Kurdistan Education Forum 2026'),
('allow_public_registration', 'true'),
('mandatory_invitation_code', 'true'),
('system_timezone', 'Asia/Baghdad'),
('event_location', 'Saad Abdullah Palace, Erbil, Kurdistan Region');

-- Default Codes
INSERT INTO \`invitation_codes\` (\`code\`, \`description_en\`, \`description_ku\`, \`usage_limit\`, \`used_count\`, \`expiry_date\`, \`status\`) VALUES
('KEF2026-VIP', 'Presidents, Ministries, Chancellors and VVIP Scholars', 'Presidents, Ministries, Chancellors and VVIP Scholars Alt', 50, 0, '2026-06-15', 'Active'),
('KEF2026-ACADEMIC', 'University Lecturers and Institutional Delegates', 'University Lecturers and Institutional Delegates Alt', 200, 0, '2026-06-12', 'Active'),
('KEF2026-GUEST', 'General Registered Attendees', 'General Registered Attendees Alt', 500, 0, '2026-06-15', 'Active');

-- Preseed Event
INSERT INTO \`events\` (\`id\`, \`event_name\`, \`location\`, \`start_date\`, \`end_date\`, \`description\`) VALUES
(1, 'Kurdistan Education Forum 2026', 'Saad Abdullah Palace, Erbil', '2026-06-15', '2026-06-17', 'Primary forum addressing quality, pedagogy and reforms.');

-- Preseed Sessions
INSERT INTO \`agenda\` (\`event_id\`, \`session_title\`, \`speaker\`, \`session_date\`, \`start_time\`, \`end_time\`, \`location\`, \`description\`) VALUES
(1, 'Keynote Address: Digital Era Pedagogy', 'Minister of Education, KRG', '2026-06-15', '09:00:00', '10:30:00', 'Saad Abdullah Palace, Main Hall', 'Strategic pathways on tech integrations.'),
(1, 'Panel 1: Enhancing Higher Education Quality', 'Salahaddin Univ. Pedagogy Panel', '2026-06-15', '11:00:00', '12:30:00', 'Conference Room Alpha', 'Quality assurance debate.'),
(1, 'Workshop: Interactive Bilingual Methodologies', 'Linguistics Experts', '2026-06-16', '14:00:00', '16:00:00', 'Seminar Hall B', 'Syllabi custom design guides.');

-- Seed Admin User (Password is 'Admin@KEF2026')
INSERT INTO \`users\` (\`id\`, \`registration_id\`, \`full_name\`, \`email\`, \`password\`, \`organization\`, \`position\`, \`phone\`, \`gender\`, \`food_allergies\`, \`country\`, \`city\`, \`qr_code\`, \`role\`, \`email_verified\`) VALUES
(1, 'KEF-10041', 'Dr. Alan Noori', 'alan.noori@kef.edu', '$2y$10$wKz0bK9u8f7BOfXvscW3rOI/zNn23Slyf7D7EwS2D1m4F93VofXeq', 'Ministry of Higher Education', 'Committee Head', '07501234567', 'Male', 'None', 'Iraq', 'Erbil', 'KEF-10041|Dr. Alan Noori|alan.noori@kef.edu', 'admin', 1);
`
  },
  {
    filename: 'config/db.php',
    category: 'config',
    description: 'Secure PDO connection configuration with UTF8 character routing.',
    code: `<?php
// Secure PDO Connection Module
// Save as config/db.php on your local XAMPP structure

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', ''); // Standard for local XAMPP default
define('DB_NAME', 'kef_system');

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    die("CRITICAL DATABASE CONNECTION FAILURE: " . $e->getMessage());
}
?>`
  },
  {
    filename: 'config/session.php',
    category: 'config',
    description: 'PHP Session Security and Role-Based Access controls (RBAC). Includes CSRF guards.',
    code: `<?php
// Session Hijacking and CSRF Security Guards
// Include this at the very top of each page

if (session_status() == PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // Set 1 if employing production SSL
    session_start();
}

// Ensure session timing is constrained
if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > 1800)) {
    session_unset();
    session_destroy();
    header("Location: ../index.php?err=Session expired, please login again / ماوەی چوونەژوورەوەت بەسەرچوو");
    exit();
}
$_SESSION['LAST_ACTIVITY'] = time();

// Access Validation Functions
function requireAdmin() {
    if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
        header("Location: ../index.php?err=Access Denied! Administrators only. / ڕێگەپێنەدراوە مۆڵەتی ئەدمین پێویستە");
        exit();
    }
}

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        header("Location: ../index.php?err=Please login first. / سەرەتا بچۆ ژوورەوە");
        exit();
    }
}

// Generate CSRF Token for Form Security
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function verifyCSRF($token) {
    if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        die("Security Exception: CSRF verification failed.");
    }
}
?>`
  },
  {
    filename: 'index.php',
    category: 'public',
    description: 'Fully responsive CSS and Bootstrap 5 powered Login gate with localized Kurdish and English translation tags.',
    code: `<?php
require_once 'config/db.php';
require_once 'config/session.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    verifyCSRF($_POST['csrf_token']);

    if (!empty($email) && !empty($password)) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['registration_id'] = $user['registration_id'];

            if ($user['role'] === 'admin') {
                header("Location: admin/dashboard.php");
            } else {
                header("Location: user/profile.php");
            }
            exit();
        } else {
            $error = 'Incorrect email or password';
        }
    } else {
        $error = 'All fields are required';
    }
}
?>
<!DOCTYPE html>
<html lang="en" class="h-100">
<head>
    <meta charset="UTF-8">
    <title>KEF System Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f8f9fa; font-family: 'Segoe UI', system-ui, sans-serif; }
        .login-card { border-radius: 12px; border: none; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .kef-logo { max-width: 90px; }
    </style>
</head>
<body class="d-flex align-items-center h-100 py-4">
<main class="form-signin w-100 m-auto" style="max-width: 420px;">
    <div class="card login-card p-4">
        <div class="card-body text-center">
            <h5 class="text-secondary tracking-wide uppercase text-xs mb-1">Kurdistan Education Forum</h5>
            <h3 class="mb-4 fw-bold">KEF Portal Login</h3>
            
            <?php if (!empty($error)): ?>
                <div class="alert alert-danger text-sm py-2"><?= htmlspecialchars($error) ?></div>
            <?php endif;?>
            <?php if (isset($_GET['err'])): ?>
                <div class="alert alert-warning text-sm py-2"><?= htmlspecialchars($_GET['err']) ?></div>
            <?php endif;?>

            <form method="POST" action="">
                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                
                <div class="form-floating mb-3 text-start">
                    <input type="email" name="email" class="form-control" id="floatingInput" placeholder="name@example.com" required>
                    <label for="floatingInput">Email address / ئیمەیڵ</label>
                </div>
                <div class="form-floating mb-3 text-start">
                    <input type="password" name="password" class="form-control" id="floatingPassword" placeholder="Password" required>
                    <label for="floatingPassword">Password</label>
                </div>

                <button class="btn btn-primary w-100 py-2.5 mb-3" type="submit">Sign In</button>
                <div class="text-sm">
                    Don't have an account? <a href="register.php" class="text-primary fw-medium">Register here</a>
                </div>
            </form>
        </div>
    </div>
</main>
</body>
</html>`
  },
  {
    filename: 'register.php',
    category: 'public',
    description: 'Dynamic user invitation code verification logic, cascading to full-form registration with auto-generation of unique IDs and QR code database payload string.',
    code: `<?php
require_once 'config/db.php';
require_once 'config/session.php';

$step = 1;
$invitation_code = '';
$code_description = '';
$message = '';
$message_type = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCSRF($_POST['csrf_token']);

    if (isset($_POST['verify_code'])) {
        // Step 1: Validate Code
        $invitation_code = trim($_POST['invitation_code']);
        $stmt = $pdo->prepare("SELECT * FROM invitation_codes WHERE code = ? AND status = 'Active' AND expiry_date >= CURDATE()");
        $stmt->execute([$invitation_code]);
        $codeObj = $stmt->fetch();

        if ($codeObj && ($codeObj['used_count'] < $codeObj['usage_limit'])) {
            $step = 2;
            $code_description = $codeObj['description_en'];
        } else {
            $message = "Invalid, expired, or fully utilized invitation code";
            $message_type = "danger";
        }
    } else if (isset($_POST['complete_register'])) {
        // Step 2: Complete Database Register
        $invitation_code = trim($_POST['invitation_code']);
        $full_name = trim($_POST['full_name']);
        $email = trim($_POST['email']);
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $organization = trim($_POST['organization']);
        $position = trim($_POST['position']);
        $phone = trim($_POST['phone']);
        $gender = trim($_POST['gender']);
        $food_allergies = trim($_POST['food_allergies']);
        $country = trim($_POST['country']);
        $city = trim($_POST['city']);

        // Check if email already registered
        $stmtEx = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmtEx->execute([$email]);
        if ($stmtEx->fetchColumn() > 0) {
            $message = "Email already registered";
            $message_type = "danger";
            $step = 2;
        } else {
            // Transaction-based insertion
            try {
                $pdo->beginTransaction();

                // Generate Registration ID (KEF-Random)
                $uniqueDigits = mt_rand(10000, 99999);
                $registration_id = "KEF-" . $uniqueDigits;
                
                // Embedded QR Code string definition: Registration ID | Name | Email
                $qr_string = $registration_id . "|" . $full_name . "|" . $email;

                // Save user
                $insUser = $pdo->prepare("INSERT INTO users 
                    (registration_id, full_name, email, password, organization, position, phone, gender, food_allergies, country, city, qr_code, role, email_verified) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 1)");
                $insUser->execute([$registration_id, $full_name, $email, $password, $organization, $position, $phone, $gender, $food_allergies, $country, $city, $qr_string]);
                
                $user_db_id = $pdo->lastInsertId();

                // Increment invitation code usage count
                $updCode = $pdo->prepare("UPDATE invitation_codes SET used_count = used_count + 1 WHERE code = ?");
                $updCode->execute([$invitation_code]);

                // Create email log
                $insEmail = $pdo->prepare("INSERT INTO email_logs (user_id, email_type, status) VALUES (?, 'Welcome, QR Badge Attached', 'Sent')");
                $insEmail->execute([$user_db_id]);

                $pdo->commit();
                
                header("Location: index.php?err=" . urlencode("Registration Successful " . $registration_id . "! Login below."));
                exit();
            } catch (Exception $e) {
                $pdo->rollBack();
                $message = "Server error during registration: " . $e->getMessage();
                $message_type = "danger";
                $step = 2;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KEF Forum Registration</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f3f4f6; font-family: system-ui, -apple-system, sans-serif; }
        .box-wrapper { max-width: 600px; margin: 40px auto; }
        .card { border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: none; }
    </style>
</head>
<body>
<div class="container box-wrapper">
    <div class="card p-4">
        <h2 class="text-center fw-bold mb-1">Kurdistan Education Forum</h2>
        <p class="text-muted text-center text-sm mb-4">Registration Gateway & Pass Creator</p>

        <?php if (!empty($message)): ?>
            <div class="alert alert-<?= $message_type ?> text-sm"><?= $message ?></div>
        <?php endif;?>

        <?php if ($step === 1): ?>
            <!-- STEP 1: VERIFY CODE -->
            <form method="POST" action="">
                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                <div class="mb-4">
                    <label class="form-label fw-semibold">Enter invitation code:</label>
                    <input type="text" name="invitation_code" class="form-control form-control-lg text-center" placeholder="e.g. KEF2026-VIP" required>
                    <div class="form-text mt-2 text-xs">A valid invitation pass code is mandatory to access registrations.</div>
                </div>
                <button type="submit" name="verify_code" class="btn btn-primary w-100 py-2.5">Validate Code & Access Registration</button>
            </form>
        <?php else: ?>
            <!-- STEP 2: DETAILS REGISTRATION FORM -->
            <form method="POST" action="">
                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                <input type="hidden" name="invitation_code" value="<?= htmlspecialchars($invitation_code) ?>">
                
                <div class="p-2.5 bg-light mb-3 rounded text-xs text-muted border border-dashed text-center">
                    Invitation Code Verified: <strong><?= htmlspecialchars($invitation_code) ?></strong><br>
                    <?= htmlspecialchars($code_description) ?>
                </div>

                <div class="row g-3">
                    <div class="col-md-12">
                        <label class="form-label text-sm fw-medium">Full Name</label>
                        <input type="text" name="full_name" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Email</label>
                        <input type="email" name="email" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Password</label>
                        <input type="password" name="password" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Organization</label>
                        <input type="text" name="organization" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Job Title</label>
                        <input type="text" name="position" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Phone Number</label>
                        <input type="text" name="phone" class="form-control" placeholder="+964 750..." required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Gender</label>
                        <select name="gender" class="form-select" required>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label text-sm fw-medium">Food Allergies</label>
                        <input type="text" name="food_allergies" class="form-control" placeholder="None, Gluten, Nuts, Vegetarian...">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">Country</label>
                        <input type="text" name="country" class="form-control" value="Iraq" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label text-sm fw-medium">City</label>
                        <input type="text" name="city" class="form-control" required>
                    </div>
                </div>

                <button type="submit" name="complete_register" class="btn btn-success w-100 py-3 mt-4">Complete Registration of KEF Badge</button>
            </form>
        <?php endif;?>
    </div>
</div>
</body>
</html>`
  },
  {
    filename: 'scan_badge.php',
    category: 'public',
    description: 'Dynamic HTML5 QR scanner implementation calling camera feeds, decoding outputs, making dynamic AJAX posts, and outputting clean bilingual modals with real-time success logs.',
    code: `<?php
require_once 'config/db.php';
require_once 'config/session.php';
requireAdmin(); // Guards to requireAdmin for scanning desks
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KEF Real-Time Scan Attendance Desk</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- html5-qrcode library is standard, lightweight and completely offline client-side QR parser -->
    <script src="https://unpkg.com/html5-qrcode"></script>
    <style>
        body { background: #1f2937; color: #f9fafb; font-family: system-ui, sans-serif; }
        .scanner-container { border: 4px solid #374151; border-radius: 12px; overflow: hidden; background: #000; }
        .status-box { border-radius: 8px; font-weight: 600; font-size: 1.1rem; }
        .recent-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; }
    </style>
</head>
<body class="py-4">
<div class="container" style="max-width: 900px;">
    <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3 border-gray">
        <div>
            <h5 class="text-info uppercase text-xs tracking-wider mb-0">Attendance Tracker Module</h5>
            <h2 class="fw-bold mb-0">KEF Live Scanner Desk</h2>
        </div>
        <a href="admin/dashboard.php" class="btn btn-outline-light btn-sm">Return to Admin Dashboard Panel / گەڕانەوە</a>
    </div>

    <div class="row g-4">
        <!-- SCANNER DIV -->
        <div class="col-md-6">
            <div class="card bg-dark border-secondary p-3 text-center h-100">
                <h5 class="text-white mb-3">Live Video Cam Feed</h5>
                <div class="scanner-container mb-3">
                    <div id="reader" style="width: 100%;"></div>
                </div>
                <div class="form-text text-gray text-xs">Hold participants printable or mobile badge up to the camera to instantly log and confirm arrival.</div>
            </div>
        </div>

        <!-- LIVE CONFIRMATION LOGS -->
        <div class="col-md-6">
            <div class="card bg-dark border-secondary p-3 h-100 d-flex flex-column">
                <h5 class="text-white mb-3">Instant Validation Desk</h5>
                
                <!-- Screen Dynamic Status Alerts -->
                <div id="statusAlert" class="alert p-3 mb-3 d-none status-box text-center"></div>

                <div class="bg-black p-3 rounded mb-3 text-start border border-secondary flex-grow-1" id="scannedProfileDetails" style="min-height: 120px; font-family: monospace;">
                    <div class="text-muted text-xs">// Scan a participant badge to parse records...</div>
                </div>

                <!-- Recent live scans table -->
                <h6 class="text-secondary tracking-widest uppercase text-xs mb-2">Live Logs feed on this desk</h6>
                <div class="table-responsive" style="max-height: 160px;">
                    <table class="table table-dark table-striped table-sm text-xs text-start">
                        <thead>
                            <tr>
                                <th>Reg ID</th>
                                <th>Participant</th>
                                <th>Scan Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="scanLogEntries">
                            <tr>
                                <td colspan="4" class="text-muted text-center py-2">No scans registered in this current workspace session yet.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// AJAX Verification Script
function processBadgeScan(qrString) {
    const statusAlert = document.getElementById("statusAlert");
    const scannedDetails = document.getElementById("scannedProfileDetails");
    const adminScanner = "<?= $_SESSION['full_name'] ?>";

    // Stop Reader temporarily to avoid duplicate firing
    html5QrcodeScanner.clear();

    fetch('api/record_scan.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_data: qrString, scanner: adminScanner })
    })
    .then(res => res.json())
    .then(data => {
        statusAlert.classList.remove("d-none", "alert-success", "alert-warning", "alert-danger");
        
        if (data.status === 'success') {
            statusAlert.classList.add("alert-success");
            statusAlert.innerText = "SUCCESS\\n" + data.message;
            scannedDetails.innerHTML = \`<div class="text-success fw-bold">// VALID ATTENDEE GRANTED ENTRY:</div>
<strong>Reg ID:</strong> \${data.user.registration_id}<br>
<strong>Name:</strong> \${data.user.full_name}<br>
<strong>Org:</strong> \${data.user.organization}<br>
<strong>Position:</strong> \${data.user.position}<br>
<strong>Allergies:</strong> \${data.user.food_allergies || 'None'}\`;
            appendToLogTable(data.user.registration_id, data.user.full_name, 'Present');
        } else if (data.status === 'duplicate') {
            statusAlert.classList.add("alert-warning");
            statusAlert.innerText = "WARNING / ئاگاداری\\n" + data.message;
            scannedDetails.innerHTML = \`<div class="text-warning fw-bold">// DUPLICATE SCAN ENTERED:</div>
<strong>Reg ID:</strong> \${data.user.registration_id}<br>
<strong>Name:</strong> \${data.user.full_name}<br>
<strong>Org:</strong> \${data.user.organization}<br>
<strong>Original Scan:</strong> \${data.message}\`;
            appendToLogTable(data.user.registration_id, data.user.full_name, 'Duplicate');
        } else {
            statusAlert.classList.add("alert-danger");
            statusAlert.innerText = "ACCESS REJECTED / نادروست\\n" + data.message;
            scannedDetails.innerHTML = \`<div class="text-danger fw-bold">// INVALID TICKET STRUCT DETECTED:</div>
\${data.message}\`;
        }
        
        // Re-initialize code reader in 3 seconds to let desk operator scan the next participant
        setTimeout(restartQrScanner, 3000);
    })
    .catch(err => {
        alert("Server communication failure.");
        console.error(err);
        setTimeout(restartQrScanner, 3000);
    });
}

function appendToLogTable(id, name, status) {
    const tableBody = document.getElementById("scanLogEntries");
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 8);
    
    // Clear standard empty td
    if (tableBody.innerText.includes("No scans registered")) {
        tableBody.innerHTML = '';
    }

    const row = document.createElement("tr");
    const badgeColor = status === 'Present' ? 'bg-success' : 'bg-warning text-dark';
    row.innerHTML = \`<td><strong>\${id}</strong></td>
                      <td>\${name}</td>
                      <td>\${timeString}</td>
                      <td><span class="badge \${badgeColor}">\${status}</span></td>\`;
    tableBody.insertBefore(row, tableBody.firstChild);
}

function restartQrScanner() {
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText, decodedResult) {
    processBadgeScan(decodedText);
}

function onScanFailure(error) {
    // Quietly monitor scans recursively in background
}

let html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: 240 });
html5QrcodeScanner.render(onScanSuccess, onScanFailure);
</script>
</body>
</html>`
  },
  {
    filename: 'api/record_scan.php',
    category: 'api',
    description: 'Endpoint processing decrypted scan payload, inserting records, verifying timestamps, and outputting JSON data envelopes.',
    code: `<?php
require_once '../config/db.php';
require_once '../config/session.php';
header('Content-Type: application/json');

// Ensure only admins make requests
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['status' => 'invalid', 'message' => 'Unauthorized Admin Session rejected.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
if (empty($data['qr_data'])) {
    echo json_encode(['status' => 'invalid', 'message' => 'Empty scanner metadata.']);
    exit();
}

$qrString = $data['qr_data'];
$scannerName = isset($data['scanner']) ? trim($data['scanner']) : 'Default Admin';

// String format: Registration_ID | Full Name | Email
$parts = explode('|', $qrString);
if (count($parts) < 3) {
    echo json_encode(['status' => 'invalid', 'message' => 'Non-KEF QR data format entered.']);
    exit();
}

$regId = trim($parts[0]);
$fullName = trim($parts[1]);
$email = trim($parts[2]);

// Query matching DB record
$stmt = $pdo->prepare("SELECT * FROM users WHERE registration_id = ? AND email = ?");
$stmt->execute([$regId, $email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'invalid', 'message' => 'Participant identity mismatch with server registry.']);
    exit();
}

// Check existing logs
$stmtCheck = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? ORDER BY id ASC LIMIT 1");
$stmtCheck->execute([$user['id']]);
$prevRecord = $stmtCheck->fetch();

$scanDate = date('Y-m-d');
$scanTime = date('H:i:s');

if ($prevRecord) {
    // Record secondary audit log for duplicate
    $insDup = $pdo->prepare("INSERT INTO attendance (user_id, scan_date, scan_time, scanner_admin, attendance_status) VALUES (?, ?, ?, ?, 'Duplicate')");
    $insDup->execute([$user['id'], $scanDate, $scanTime, $scannerName]);

    echo json_encode([
        'status' => 'duplicate',
        'user' => $user,
        'message' => 'Attendee checked-in originally at ' . $prevRecord['scan_time'] . '. Secondary duplicate entry recorded for security audit.'
    ]);
} else {
    // Record clean attendance
    $insAttendance = $pdo->prepare("INSERT INTO attendance (user_id, scan_date, scan_time, scanner_admin, attendance_status) VALUES (?, ?, ?, ?, 'Present')");
    $insAttendance->execute([$user['id'], $scanDate, $scanTime, $scannerName]);

    echo json_encode([
        'status' => 'success',
        'user' => $user,
        'message' => 'Credentials verified. Entry granted!'
    ]);
}
?>`
  },
  {
    filename: 'admin/dashboard.php',
    category: 'admin',
    description: 'Admin hub compiling overall registration aggregates, code usage indicators, and real-time scanner streams with Bootstrap 5 cards.',
    code: `<?php
require_once '../config/db.php';
require_once '../config/session.php';
requireAdmin();

// 1. Fetch Key Indicators
$registrations = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn(); $attendance = $pdo->query("SELECT COUNT(DISTINCT user_id) FROM attendance")->fetchColumn();
$rate = $registrations > 0 ? round(($attendance / $registrations) * 100, 1) : 0;
$codesActive = $pdo->query("SELECT COUNT(*) FROM invitation_codes WHERE status = 'Active'")->fetchColumn();

// 2. Load Recent Registrations
$stmtReg = $pdo->query("SELECT full_name, organization, created_at, registration_id FROM users WHERE role = 'user' ORDER BY id DESC LIMIT 5");
$recentReg = $stmtReg->fetchAll();

// 3. Load Recent Attendance Scans
$stmtAtt = $pdo->query("SELECT u.full_name, u.registration_id, a.scan_time, a.attendance_status FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.id DESC LIMIT 5"); $recentScans = $stmtAtt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KEF System Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f3f4f6; }
        .sidebar { min-height: 100vh; background: #1e293b; color: #fff; }
        .sidebar a { color: #94a3b8; text-decoration: none; padding: 12px 20px; display: block; }
        .sidebar a:hover, .sidebar a.active { color: #fff; background: #334155; }
        .card-stat { border-radius: 12px; border: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    </style>
</head>
<body>
<div class="container-fluid">
    <div class="row">
        <!-- Sidebar Navigation -->
        <span class="col-md-3 col-lg-2 d-none d-md-block sidebar p-0">
            <div class="p-3 text-center border-bottom border-secondary">
                <h5 class="fw-bold mb-0 text-white">KEF Admin Hub</h5>
                <small class="text-secondary uppercase tracking-widest text-xs">Desks Console</small>
            </div>
            <a href="dashboard.php" class="active"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a>
            <a href="users.php"><i class="bi bi-people me-2"></i> User Registry</a>
            <a href="invitation-codes.php"><i class="bi bi-ticket-perforated me-2"></i> Invitation Codes</a>
            <a href="agenda.php"><i class="bi bi-calendar-event me-2"></i> Forum Agenda</a>
            <a href="../scan_badge.php" target="_blank text-info"><i class="bi bi-qr-code-scan me-2"></i> Scan Desk</a>
            <a href="attendance.php"><i class="bi bi-clipboard2-check me-2"></i> Attendance Log</a>
            <a href="badges.php"><i class="bi bi-person-badge me-2"></i> Manage Badges</a>
            <a href="reports.php"><i class="bi bi-bar-chart-line me-2"></i> Core Reports</a>
            <a href="settings.php"><i class="bi bi-gear me-2"></i> System Settings</a>
            <a href="../index.php" class="text-danger mt-4"><i class="bi bi-box-arrow-left me-2"></i> Log Out</a>
        </span>

        <!-- Main Workspace -->
        <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2 fw-bold text-dark">KEF Management Dashboard</h1>
                <div class="btn-toolbar mb-2 mb-md-0">
                    <a href="../scan_badge.php" class="btn btn-primary d-flex align-items-center gap-2"><i class="bi bi-camera"></i> Launch Scan Desk</a>
                </div>
            </div>

            <!-- Dashboard Indicator Row -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card card-stat p-3 bg-white">
                        <div class="text-muted text-xs uppercase mb-1 fw-bold">Total Registrations</div>
                        <h2 class="fw-extrabold mb-0 text-dark"><?= $registrations ?></h2>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card card-stat p-3 bg-white">
                        <div class="text-muted text-xs uppercase mb-1 fw-bold">Active Attendance</div>
                        <h2 class="fw-extrabold mb-0 text-success"><?= $attendance ?></h2>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card card-stat p-3 bg-white">
                        <div class="text-muted text-xs uppercase mb-1 fw-bold">Attendance Rate</div>
                        <h2 class="fw-extrabold mb-0 text-info"><?= $rate ?>%</h2>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card card-stat p-3 bg-white">
                        <div class="text-muted text-xs uppercase mb-1 fw-bold">Active Codes</div>
                        <h2 class="fw-extrabold mb-0 text-warning"><?= $codesActive ?></h2>
                    </div>
                </div>
            </div>

            <!-- Dynamic Lists Tables Row -->
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="card p-3 border-0 shadow-sm bg-white rounded-4 h-100">
                        <h5 class="fw-bold mb-3">Recent Registered Participants</h5>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover text-sm">
                                <thead><tr><th>Reg ID</th><th>Name</th><th>Organization</th></tr></thead>
                                <tbody>
                                    <?php foreach ($recentReg as $r): ?>
                                    <tr>
                                        <td><strong><?= $r['registration_id'] ?></strong></td>
                                        <td><?= htmlspecialchars($r['full_name']) ?></td>
                                        <td><?= htmlspecialchars($r['organization']) ?></td>
                                    </tr>
                                    <?php endforeach;?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card p-3 border-0 shadow-sm bg-white rounded-4 h-100">
                        <h5 class="fw-bold mb-3">Live Scanned Desk Activity</h5>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover text-sm">
                                <thead><tr><th>Reg ID</th><th>Name</th><th>Time</th><th>Status</th></tr></thead>
                                <tbody>
                                    <?php foreach ($recentScans as $s): ?>
                                    <tr>
                                        <td><strong><?= $s['registration_id'] ?></strong></td>
                                        <td><?= htmlspecialchars($s['full_name']) ?></td>
                                        <td><?= $s['scan_time'] ?></td>
                                        <td>
                                            <span class="badge bg-<?= $s['attendance_status'] === 'Present' ? 'success' : 'warning text-dark' ?>">
                                                <?= $s['attendance_status'] ?>
                                            </span>
                                        </td>
                                    </tr>
                                    <?php endforeach;?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>
</body>
</html>`
  }
];
