/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SystemUser,
  InvitationCode,
  AgendaSession,
  AttendanceRecord,
  EmailLog,
  SystemSetting,
  MealRecord,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'kef_users_db',
  CODES: 'kef_codes_db',
  AGENDA: 'kef_agenda_db',
  ATTENDANCE: 'kef_attendance_db',
  EMAILS: 'kef_emails_db',
  SETTINGS: 'kef_settings_db',
  CURRENT_USER: 'kef_session_user',
  MEALS: 'kef_meals_db',
};

// Seed initial dataset
const INITIAL_CODES: InvitationCode[] = [
  {
    id: '1',
    code: 'KEF2026-VIP',
    description_en: 'VIP Attendee Passes - Access to executive salon and forums',
    description_ku: 'VIP Attendee Passes - Access to executive salon and forums',
    usage_limit: 50,
    used_count: 14,
    expiry_date: '2026-06-15',
    status: 'Active',
    created_at: '2026-05-01 10:00:00',
  },
  {
    id: '2',
    code: 'KEF2026-ACADEMIC',
    description_en: 'Academic Staff & University Delegates',
    description_ku: 'Academic Staff & University Delegates',
    usage_limit: 250,
    used_count: 112,
    expiry_date: '2026-06-12',
    status: 'Active',
    created_at: '2026-05-02 09:30:00',
  },
  {
    id: '3',
    code: 'KEF2026-STUDENT',
    description_en: 'Kurdistan Student Union Discount Code',
    description_ku: 'Kurdistan Student Union Discount Code',
    usage_limit: 150,
    used_count: 150, // Exhausted
    expiry_date: '2026-06-10',
    status: 'Expired',
    created_at: '2026-05-03 14:00:00',
  },
  {
    id: '4',
    code: 'KEF2026-GUEST',
    description_en: 'General Invitation Code',
    description_ku: 'General Invitation Code',
    usage_limit: 500,
    used_count: 320,
    expiry_date: '2026-06-30',
    status: 'Active',
    created_at: '2026-05-04 11:20:00',
  },
];

const INITIAL_USERS: SystemUser[] = [
  {
    id: '1',
    registration_id: 'KEF-10821',
    full_name: 'Dr. Alan Noori',
    email: 'alan.noori@kef.edu',
    password_hash: '$2y$10$abcdefghijklmnopqrstuv', // Simulate password_hash in PHP
    organization: 'Salahaddin University-Erbil',
    position: 'Department of Pedagogy, Head',
    phone: '+964 750 123 4567',
    gender: 'Male',
    food_allergies: 'None',
    country: 'Iraq',
    city: 'Erbil',
    qr_code_data: 'KEF-10821|Dr. Alan Noori|alan.noori@kef.edu',
    role: 'admin',
    email_verified: true,
    created_at: '2026-05-15 08:30:12',
    status: 'Approved',
  },
  {
    id: '2',
    registration_id: 'KEF-23841',
    full_name: 'Hero S. Rostam',
    email: 'hero.rostam@auis.edu.krd',
    password_hash: '$2y$10$abcdefghijklmnopqrstuv',
    organization: 'American University of Iraq, Sulaimani',
    position: 'Assistant Professor of Education Policy',
    phone: '+964 770 987 6543',
    gender: 'Female',
    food_allergies: 'Gluten-Free',
    country: 'Iraq',
    city: 'Sulaymaniyah',
    qr_code_data: 'KEF-23841|Hero S. Rostam|hero.rostam@auis.edu.krd',
    role: 'user',
    email_verified: true,
    created_at: '2026-05-16 11:15:44',
    status: 'Approved',
  },
  {
    id: '3',
    registration_id: 'KEF-30912',
    full_name: 'Kamaran Sherwani',
    email: 'k.sherwani@uke.edu',
    password_hash: '$2y$10$abcdefghijklmnopqrstuv',
    organization: 'University of Kurdistan Hewlêr',
    position: 'Dean of Joint Studies',
    phone: '+964 751 321 0987',
    gender: 'Male',
    food_allergies: 'Nuts',
    country: 'Iraq',
    city: 'Erbil',
    qr_code_data: 'KEF-30912|Kamaran Sherwani|k.sherwani@uke.edu',
    role: 'user',
    email_verified: true,
    created_at: '2026-05-18 16:40:02',
    status: 'Approved',
  },
  {
    id: '4',
    registration_id: 'KEF-40123',
    full_name: 'Bashdarsarbazmawlud',
    email: 'Bashdarsarbazmawlud@gmail.com', // Setting default user email for perfect testing and demo
    password_hash: '$2y$10$abcdefghijklmnopqrstuv',
    organization: 'Kurdistan Education Forum',
    position: 'Technical Specialist',
    phone: '+964 750 999 8888',
    gender: 'Male',
    food_allergies: 'None',
    country: 'Iraq',
    city: 'Erbil',
    qr_code_data: 'KEF-40123|Bashdarsarbazmawlud|Bashdarsarbazmawlud@gmail.com',
    role: 'admin',
    email_verified: true,
    created_at: '2026-05-20 09:00:00',
    status: 'Approved',
  },
  {
    id: '5',
    registration_id: 'KEF-55421',
    full_name: 'Darya Karim',
    email: 'darya.karim@spu.edu.krd',
    password_hash: '$2y$10$abcdefghijklmnopqrstuv',
    organization: 'Sulaimani Polytechnic University',
    position: 'Director of Academic Quality Assurance',
    phone: '+964 773 456 1234',
    gender: 'Female',
    food_allergies: 'Vegetarian',
    country: 'Iraq',
    city: 'Sulaymaniyah',
    qr_code_data: 'KEF-55421|Darya Karim|darya.karim@spu.edu.krd',
    role: 'user',
    email_verified: false,
    created_at: '2026-05-25 14:02:18',
    status: 'Pending',
  },
  {
    id: '6',
    registration_id: 'KEF-67123',
    full_name: 'Sara Ahmad',
    email: 'sara.ahmad@su.edu.krd',
    password_hash: '$2y$10$abcdefghijklmnopqrstuv',
    organization: 'Salahaddin University',
    position: 'Junior Academic Fellow',
    phone: '+964 750 234 5678',
    gender: 'Female',
    food_allergies: 'None',
    country: 'Iraq',
    city: 'Erbil',
    qr_code_data: 'KEF-67123|Sara Ahmad|sara.ahmad@su.edu.krd',
    role: 'user',
    email_verified: false,
    created_at: '2026-05-28 09:41:00',
    status: 'Pending',
  },
  {
    id: '7',
    registration_id: 'KEF-78912',
    full_name: 'Yousif Aziz',
    email: 'yousif.aziz@epu.edu.krd',
    password_hash: '$2y$10$abcdefghijklmnopqrstuv',
    organization: 'Erbil Polytechnic University',
    position: 'Student Delegate',
    phone: '+964 770 111 2222',
    gender: 'Male',
    food_allergies: 'None',
    country: 'Iraq',
    city: 'Erbil',
    qr_code_data: 'KEF-78912|Yousif Aziz|yousif.aziz@epu.edu.krd',
    role: 'user',
    email_verified: false,
    created_at: '2026-05-29 15:10:00',
    status: 'Pending',
  }
];

const INITIAL_AGENDA: AgendaSession[] = [
  {
    id: '1',
    event_id: '1',
    session_title: 'Opening Ceremony & Keynote Address on Digital Era Pedagogy',
    speaker: 'Minister of Education, KRG & Educational Scholars',
    session_date: '2026-06-15',
    start_time: '09:00',
    end_time: '10:30',
    location: 'Saad Abdullah Palace, Main Hall',
    description: 'Welcome addresses, KEF goals and strategies, and keynote speeches regarding modernizing pedagogical pipelines in Kurdistan.',
    created_at: '2026-05-01 12:00:00',
    panelists: [
      {
        name: 'Dr. Alan Noori',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        position: 'Head of Pedagogy, Ministry representative',
        role: 'Moderator'
      },
      {
        name: 'Prof. Hero S. Rostam',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        position: 'Dean of Academic Quality',
        role: 'Speaker'
      }
    ],
    translation_link: 'https://meet.google.com/abc-kef-2026'
  },
  {
    id: '2',
    event_id: '1',
    session_title: 'Panel Discussion: Enhancing Quality Assurance in Higher Education',
    speaker: 'Dr. Alan Noori, Dr. Kamaran Sherwani, Hero S. Rostam',
    session_date: '2026-06-15',
    start_time: '11:00',
    end_time: '12:30',
    location: 'Conference Room Alpha',
    description: 'Critical debate and framework evaluation of recent reforms by the Ministry of Higher Education and Scientific Research.',
    created_at: '2026-05-01 12:15:00',
    panelists: [
      {
        name: 'Dr. Kamaran Sherwani',
        picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
        position: 'Dean of Joint Studies, UKH',
        role: 'Moderator'
      },
      {
        name: 'Prof. Hero S. Rostam',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        position: 'Assistant Professor AUIS',
        role: 'Panelist'
      },
      {
        name: 'Dr. Alan Noori',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        position: 'Department of Pedagogy',
        role: 'Panelist'
      }
    ],
    translation_link: 'https://teams.live.com/meet/9384812304918'
  },
  {
    id: '3',
    event_id: '1',
    session_title: 'Interactive Workshop: Integrating Dual-Language Systems',
    speaker: 'Kurdistan Linguistics Institute Core Staff',
    session_date: '2026-06-16',
    start_time: '14:00',
    end_time: '16:00',
    location: 'Seminar Hall B',
    description: 'An operational toolkit deployment for schools seeking bilingual English-Kurdish scientific education methodologies.',
    created_at: '2026-05-10 11:00:00',
    panelists: [
      {
        name: 'Dr. Alan Noori',
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
        position: 'Linguistics Department Head',
        role: 'Workshop Lead'
      }
    ],
    translation_link: 'https://meet.google.com/xyz-bilingual-kef'
  },
  {
    id: '4',
    event_id: '1',
    session_title: 'Fireside Chat: Future Career Readiness in Kurdistan Market',
    speaker: 'Industry Leaders, Tech Founders & Ministry Representatives',
    session_date: '2026-06-17',
    start_time: '10:00',
    end_time: '11:30',
    location: 'Saad Abdullah Palace, Amphitheater',
    description: 'Analyzing the widening skills gap and deploying vocational curricula matching localized digital, industrial, and social growth trends.',
    created_at: '2026-05-12 15:30:00',
    panelists: [
      {
        name: 'Prof. Hero S. Rostam',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
        position: 'Education Policy Expert',
        role: 'Interviewer'
      },
      {
        name: 'Dr. Kamaran Sherwani',
        picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop',
        position: 'Dean of joint Programmes UKH',
        role: 'Discussant'
      }
    ],
    translation_link: 'https://meet.google.com/qwe-readiness-kef'
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: '1',
    user_id: '1', // Dr. Alan Noori
    scan_date: '2026-05-31',
    scan_time: '08:45:12',
    scanner_admin: 'Bashdarsarbazmawlud',
    attendance_status: 'Present',
  },
  {
    id: '2',
    user_id: '2', // Hero S. Rostam
    scan_date: '2026-05-31',
    scan_time: '08:52:45',
    scanner_admin: 'Bashdarsarbazmawlud',
    attendance_status: 'Present',
  },
  {
    id: '3',
    user_id: '3', // Kamaran Sherwani
    scan_date: '2026-05-31',
    scan_time: '09:02:11',
    scanner_admin: 'Bashdarsarbazmawlud',
    attendance_status: 'Present',
  },
];

const INITIAL_SETTINGS: SystemSetting[] = [
  { id: '1', setting_name: 'forum_title_en', setting_value: 'Kurdistan Education Forum (KEF) 2026' },
  { id: '2', setting_name: 'forum_title_ku', setting_value: 'Kurdistan Education Forum 2026' },
  { id: '3', setting_name: 'allow_public_registration', setting_value: 'true' },
  { id: '4', setting_name: 'mandatory_invitation_code', setting_value: 'true' },
  { id: '5', setting_name: 'system_timezone', setting_value: 'Asia/Baghdad' },
  { id: '6', setting_name: 'event_location', setting_value: 'Saad Abdullah Palace, Erbil, KRG' },
];

export const getDB = {
  users: (): SystemUser[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  codes: (): InvitationCode[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CODES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify(INITIAL_CODES));
      return INITIAL_CODES;
    }
    return JSON.parse(data);
  },
  agenda: (): AgendaSession[] => {
    const data = localStorage.getItem(STORAGE_KEYS.AGENDA);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(INITIAL_AGENDA));
      return INITIAL_AGENDA;
    }
    return JSON.parse(data);
  },
  attendance: (): AttendanceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    return JSON.parse(data);
  },
  emails: (): EmailLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMAILS);
    if (!data) {
      const initialLogs: EmailLog[] = [
        { id: '1', user_id: '1', email_type: 'Welcome & QR Ticket', sent_date: '2026-05-15 08:35:00', status: 'Sent' },
        { id: '2', user_id: '2', email_type: 'Welcome & QR Ticket', sent_date: '2026-05-16 11:18:00', status: 'Sent' },
        { id: '3', user_id: '3', email_type: 'Welcome & QR Ticket', sent_date: '2026-05-18 16:45:00', status: 'Sent' },
        { id: '4', user_id: '4', email_type: 'Admin Account Activated', sent_date: '2026-05-20 09:05:00', status: 'Sent' },
      ];
      localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(initialLogs));
      return initialLogs;
    }
    return JSON.parse(data);
  },
  settings: (): SystemSetting[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(data);
  },
  currentUser: (): SystemUser | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  },
  meals: (): MealRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEALS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  },
};

export const saveDB = {
  users: (users: SystemUser[]) => localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)),
  codes: (codes: InvitationCode[]) => localStorage.setItem(STORAGE_KEYS.CODES, JSON.stringify(codes)),
  agenda: (agenda: AgendaSession[]) => localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(agenda)),
  attendance: (record: AttendanceRecord[]) => localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(record)),
  emails: (log: EmailLog[]) => localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(log)),
  settings: (settings: SystemSetting[]) => localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)),
  meals: (meals: MealRecord[]) => localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals)),
  setCurrentUser: (user: SystemUser | null) => {
    if (user === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },
};

// Database Operational Controllers (Simulating PDO procedures)
export const dbOperations = {
  validateInvitationCode: (inputCode: string): { success: boolean; code?: InvitationCode; error?: string } => {
    const codes = getDB.codes();
    const match = codes.find(c => c.code.trim().toUpperCase() === inputCode.trim().toUpperCase());
    if (!match) {
      return { success: false, error: 'Invalid invitation code' };
    }
    if (match.status === 'Used') {
      return { success: false, error: 'This invitation code is already used' };
    }
    if (match.status !== 'Active') {
      return { success: false, error: 'This ticket code is inactive or expired' };
    }
    if (match.used_count >= match.usage_limit) {
      return { success: false, error: 'This invitation code usages limit has been exhausted' };
    }
    const expiry = new Date(match.expiry_date);
    const now = new Date();
    if (expiry < now) {
      return { success: false, error: 'Invitation code has expired' };
    }
    return { success: true, code: match };
  },

  registerUser: (userData: Omit<SystemUser, 'id' | 'registration_id' | 'qr_code_data' | 'email_verified' | 'created_at' | 'status'>, codeUsed: string): SystemUser => {
    const users = getDB.users();
    const codes = getDB.codes();

    // Increment invitation code usage count
    const updatedCodes = codes.map(c => {
      if (c.code.trim().toUpperCase() === codeUsed.trim().toUpperCase()) {
        const nextCount = c.used_count + 1;
        return {
          ...c,
          used_count: nextCount,
          status: nextCount >= c.usage_limit ? 'Used' : c.status,
        } as InvitationCode;
      }
      return c;
    });
    saveDB.codes(updatedCodes);

    // Generate Registration ID: KEF-XXXXX (unique 5 digits)
    const randomID = Math.floor(10000 + Math.random() * 90000);
    const regId = `KEF-${randomID}`;
    const qrText = `${regId}|${userData.full_name}|${userData.email}`;

    const newUser: SystemUser = {
      ...userData,
      id: String(users.length + 1),
      registration_id: regId,
      qr_code_data: qrText,
      email_verified: true, // Simulation verifies immediately
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Pending', // New registrations default to Pending approval
    };

    saveDB.users([...users, newUser]);

    // Insert Email Log
    const emails = getDB.emails();
    const newLog: EmailLog = {
      id: String(emails.length + 1),
      user_id: newUser.id,
      email_type: 'Welcome, Schedule & Badge PDF',
      sent_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Sent',
    };
    saveDB.emails([...emails, newLog]);

    return newUser;
  },

  scanQRCode: (qrString: string, scannerAdmin: string): { status: 'success' | 'duplicate' | 'invalid'; user?: SystemUser; message: string } => {
    const users = getDB.users();
    const attendance = getDB.attendance();

    if (!qrString) {
      return { status: 'invalid', message: 'Empty scan data received' };
    }

    const trimmedStr = qrString.trim();
    let matchedUser: SystemUser | undefined;

    // 1. Try splitting with '|'
    if (trimmedStr.includes('|')) {
      const parts = trimmedStr.split('|').map(p => p.trim());
      const regId = parts[0];
      const email = parts[2];

      // Exact registration ID check (case-insensitive)
      matchedUser = users.find(u => u.registration_id.toLowerCase() === regId.toLowerCase());
      
      // Fallback: match by email (case-insensitive)
      if (!matchedUser && email) {
        matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
    }

    // 2. Fallback: Check if the raw string is exactly a registration ID, email, ID or part of name
    if (!matchedUser) {
      matchedUser = users.find(u => 
        u.registration_id.toLowerCase() === trimmedStr.toLowerCase() ||
        u.email.toLowerCase() === trimmedStr.toLowerCase() ||
        u.id === trimmedStr
      );
    }

    // 3. Fallback: check if the raw string contains a registration ID anywhere inside it
    if (!matchedUser) {
      matchedUser = users.find(u => 
        trimmedStr.toLowerCase().includes(u.registration_id.toLowerCase())
      );
    }

    if (!matchedUser) {
      return { status: 'invalid', message: `No registered participant found in the system for pattern "${trimmedStr}"` };
    }

    // Only allow scanners to record approved participants
    if (matchedUser.status !== 'Approved') {
      return { status: 'invalid', message: `Participant status is ${matchedUser.status}. Scanner cannot check-in pending or rejected registrations.` };
    }

    // Check existing attendance in current day
    const alreadyPresent = attendance.find(a => a.user_id === matchedUser!.id);
    const scanDate = new Date().toISOString().substring(0, 10);
    const scanTime = new Date().toTimeString().substring(0, 8);

    if (alreadyPresent) {
      // Record the subsequent scan duplicate entry
      const newScan: AttendanceRecord = {
        id: String(attendance.length + 1),
        user_id: matchedUser.id,
        scan_date: scanDate,
        scan_time: scanTime,
        scanner_admin: scannerAdmin,
        attendance_status: 'Duplicate',
      };
      saveDB.attendance([...attendance, newScan]);

      return {
        status: 'duplicate',
        user: matchedUser,
        message: `Already checked-in at ${alreadyPresent.scan_time}. Duplicate scan logged.`,
      };
    }

    const newScan: AttendanceRecord = {
      id: String(attendance.length + 1),
      user_id: matchedUser.id,
      scan_date: scanDate,
      scan_time: scanTime,
      scanner_admin: scannerAdmin,
      attendance_status: 'Present',
    };
    saveDB.attendance([...attendance, newScan]);

    return {
      status: 'success',
      user: matchedUser,
      message: `Checked-in Successfully. Welcome to KEF, ${matchedUser.full_name}!`,
    };
  },

  scanMealQRCode: (qrString: string, scannerAdmin: string): { status: 'success' | 'duplicate' | 'invalid'; user?: SystemUser; message: string } => {
    const users = getDB.users();
    const meals = getDB.meals();

    if (!qrString) {
      return { status: 'invalid', message: 'Empty scan data received' };
    }

    const trimmedStr = qrString.trim();
    let matchedUser: SystemUser | undefined;

    // 1. Try splitting with '|'
    if (trimmedStr.includes('|')) {
      const parts = trimmedStr.split('|').map(p => p.trim());
      const regId = parts[0];
      const email = parts[2];

      matchedUser = users.find(u => u.registration_id.toLowerCase() === regId.toLowerCase());
      
      if (!matchedUser && email) {
        matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
    }

    // 2. Fallback: Exact registration ID, email, ID match
    if (!matchedUser) {
      matchedUser = users.find(u => 
        u.registration_id.toLowerCase() === trimmedStr.toLowerCase() ||
        u.email.toLowerCase() === trimmedStr.toLowerCase() ||
        u.id === trimmedStr
      );
    }

    // 3. Fallback: check if the raw string contains a registration ID anywhere inside it
    if (!matchedUser) {
      matchedUser = users.find(u => 
        trimmedStr.toLowerCase().includes(u.registration_id.toLowerCase())
      );
    }

    if (!matchedUser) {
      return { status: 'invalid', message: `No registered participant found in the system for pattern "${trimmedStr}"` };
    }

    // Only allow approved users to scan for meals
    if (matchedUser.status !== 'Approved') {
      return { status: 'invalid', message: `Participant status is ${matchedUser.status}. Scanner cannot log meal for pending/rejected registrations.` };
    }

    // Check existing meal logs in current day
    const alreadyEaten = meals.find(m => m.user_id === matchedUser!.id);
    const scanDate = new Date().toISOString().substring(0, 10);
    const scanTime = new Date().toTimeString().substring(0, 8);

    if (alreadyEaten) {
      // Record duplicate meal claim
      const newMeal: MealRecord = {
        id: String(meals.length + 1),
        user_id: matchedUser.id,
        scan_date: scanDate,
        scan_time: scanTime,
        scanner_admin: scannerAdmin,
        meal_status: 'Duplicate',
      };
      saveDB.meals([...meals, newMeal]);

      return {
        status: 'duplicate',
        user: matchedUser,
        message: `Already redeemed meal at ${alreadyEaten.scan_time}. Ticket duplicate warning!`,
      };
    }

    const newMeal: MealRecord = {
      id: String(meals.length + 1),
      user_id: matchedUser.id,
      scan_date: scanDate,
      scan_time: scanTime,
      scanner_admin: scannerAdmin,
      meal_status: 'Approved',
    };
    saveDB.meals([...meals, newMeal]);

    return {
      status: 'success',
      user: matchedUser,
      message: `Meal Verified successfully. Bon Appétit, ${matchedUser.full_name}!`,
    };
  },

  resetDatabase: () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CODES);
    localStorage.removeItem(STORAGE_KEYS.AGENDA);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.EMAILS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.MEALS);
    // Trigger window reload to reload state safely
    window.location.reload();
  },
};
