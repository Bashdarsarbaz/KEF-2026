/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemUser {
  id: string; // matches numeric auto-increment in DB
  registration_id: string; // KEF-XXXXX
  full_name: string;
  email: string;
  password_hash: string;
  organization: string;
  position: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  food_allergies: string;
  country: string;
  city: string;
  qr_code_data: string; // String embedded in QR code
  role: 'admin' | 'organizer' | 'user';
  email_verified: boolean;
  created_at: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  username?: string;
  picture?: string;
  badge_category?: 'Administration' | 'Organizer' | 'Academic Staff' | 'Attendee' | 'VIP Guest';
}

export interface InvitationCode {
  id: string;
  code: string;
  description_en: string;
  description_ku: string;
  usage_limit: number;
  used_count: number;
  expiry_date: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Used' | 'Unused' | 'used' | 'not used' | 'unused';
  created_at: string;
}

export interface EventInfo {
  id: string;
  event_name: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  created_at: string;
}

export interface Panelist {
  name: string;
  picture: string;
  position: string;
  role: string;
}

export interface AgendaSession {
  id: string;
  event_id: string;
  session_title: string;
  speaker: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
  created_at: string;
  panelists: Panelist[];
  translation_link: string;
  comments_link?: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  scan_date: string;
  scan_time: string;
  scanner_admin: string;
  attendance_status: 'Present' | 'First Duplicate' | 'Duplicate';
}

export interface MealRecord {
  id: string;
  user_id: string;
  scan_date: string;
  scan_time: string;
  scanner_admin: string;
  meal_status: 'Approved' | 'Duplicate' | 'Invalid';
}

export interface BadgeInfo {
  id: string;
  user_id: string;
  badge_number: string;
  badge_file: string;
  generated_date: string;
}

export interface EmailLog {
  id: string;
  user_id: string;
  email_type: string; // 'Verification' | 'Welcome' | 'Badge'
  sent_date: string;
  status: 'Sent' | 'Failed';
}

export interface SystemSetting {
  id: string;
  setting_name: string;
  setting_value: string;
}

export type ViewType = 'preview' | 'source';

export type UserTab = 'profile' | 'badge' | 'agenda' | 'info';

export type AdminTab = 
  | 'dashboard' 
  | 'users' 
  | 'invitation-codes' 
  | 'agenda' 
  | 'scanner' 
  | 'attendance' 
  | 'badges' 
  | 'reports' 
  | 'settings'
  | 'meals'
  | 'profile';
