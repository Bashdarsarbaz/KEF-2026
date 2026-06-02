/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Grid,
  ClipboardList,
  QrCode,
  Calendar,
  Key,
  BadgeAlert,
  Sliders,
  FileBarChart2,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  XCircle,
  Clock,
  ExternalLink,
  PlusCircle,
  Check,
  CheckSquare,
  Square,
  Printer,
  Sparkles,
  SearchCheck,
  Award,
  LogOut,
  Utensils,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SystemUser, InvitationCode, AgendaSession, AttendanceRecord, SystemSetting, Panelist, MealRecord } from '../types';
import { getDB, saveDB, dbOperations } from '../data/mockDatabase';
import QRCode from 'qrcode';
import QRScanner from './QRScanner';
import BadgeRenderer from './BadgeRenderer';

interface AdminHubProps {
  currentUser: SystemUser;
  onLogout: () => void;
  lang: 'en' | 'ku';
  scannerAdmin: string;
}

export default function AdminHub({ currentUser, onLogout, lang, scannerAdmin }: AdminHubProps) {
  const [activeTab, setActiveTab] = useState<string>(currentUser?.role === 'organizer' ? 'scanner' : 'dashboard');
  
  // Database States
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [agenda, setAgenda] = useState<AgendaSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [panelistsInput, setPanelistsInput] = useState<Panelist[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const [translationLinkInput, setTranslationLinkInput] = useState<string>('');
  const [commentsLinkInput, setCommentsLinkInput] = useState<string>('');

  // Staff Profile Editing States
  const [staffProfile, setStaffProfile] = useState({
    fullName: currentUser?.full_name || '',
    email: currentUser?.email || '',
    username: currentUser?.username || currentUser?.email?.split('@')[0] || '',
    password: '',
    picture: currentUser?.picture || '',
    organization: currentUser?.organization || 'Organizing Secretariat',
    position: currentUser?.position || 'Desk Officer (Staff)',
    phone: currentUser?.phone || '',
    city: currentUser?.city || 'Erbil',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // User creation states (Admin only)
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: 'user' as 'admin' | 'organizer' | 'user',
    organization: '',
    position: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
    foodAllergies: '',
    country: 'Iraq',
    city: 'Erbil',
    status: 'Approved' as 'Approved' | 'Pending' | 'Rejected',
  });

  // Filtering states
  const [userSearch, setUserSearch] = useState<string>('');
  const [selectedUserForBadge, setSelectedUserForBadge] = useState<SystemUser | null>(null);
  
  // Date and Time filter states
  const [attendanceDateFilter, setAttendanceDateFilter] = useState<string>('');
  const [attendanceTimeFilter, setAttendanceTimeFilter] = useState<string>('');
  const [mealDateFilter, setMealDateFilter] = useState<string>('');
  const [mealTimeFilter, setMealTimeFilter] = useState<string>('');

  // Reports analytical filters state
  const [repStatus, setRepStatus] = useState<string>('All');
  const [repCity, setRepCity] = useState<string>('All');
  const [repGender, setRepGender] = useState<string>('All');

  // Form states for adding items
  const [showAddCode, setShowAddCode] = useState<boolean>(false);
  const [newCode, setNewCode] = useState({
    code: '',
    descEn: '',
    descKu: '',
    limit: 1,
    expiry: '2026-06-15',
  });

  const [showAddSession, setShowAddSession] = useState<boolean>(false);
  const [newSession, setNewSession] = useState({
    title: '',
    speaker: '',
    date: '2026-06-15',
    start: '09:00',
    end: '10:00',
    location: '',
    desc: '',
  });

  // Load and refresh state
  const loadDatabase = () => {
    setUsers(getDB.users());
    setCodes(getDB.codes());
    setAgenda(getDB.agenda());
    setAttendance(getDB.attendance());
    setMeals(getDB.meals());
    setSettings(getDB.settings());
  };

  useEffect(() => {
    loadDatabase();
  }, [activeTab]);

  const handleUpdateStaffProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(false);

    const usersList = getDB.users();
    const updatedUsers = usersList.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          full_name: staffProfile.fullName,
          email: staffProfile.email,
          username: staffProfile.username,
          password_hash: staffProfile.password ? staffProfile.password : u.password_hash,
          picture: staffProfile.picture,
          organization: staffProfile.organization,
          position: staffProfile.position,
          phone: staffProfile.phone,
          city: staffProfile.city,
          qr_code_data: `${u.registration_id}|${staffProfile.fullName}|${staffProfile.email}`,
        } as SystemUser;
      }
      return u;
    });

    saveDB.users(updatedUsers);
    
    // Save updated session user so that header updates immediately
    const updatedMe = updatedUsers.find((u) => u.id === currentUser.id);
    if (updatedMe) {
      saveDB.setCurrentUser(updatedMe);
    }

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.fullName || !newUserForm.email || !newUserForm.password) {
      alert('Name, Email and Password are required');
      return;
    }
    
    // Generate unique Registration ID
    const regIdNum = Math.floor(10000 + Math.random() * 90000);
    const registrationId = `KEF-${regIdNum}`;
    const qrCodeData = `${registrationId}|${newUserForm.fullName}|${newUserForm.email}`;
    const newId = String(users.length + 101);

    const newUserObj: SystemUser = {
      id: newId,
      registration_id: registrationId,
      full_name: newUserForm.fullName,
      email: newUserForm.email,
      username: newUserForm.username || newUserForm.email.split('@')[0],
      password_hash: newUserForm.password, // Standard text in our mock DB
      organization: newUserForm.organization || 'Independent',
      position: newUserForm.position || 'Delegate',
      phone: newUserForm.phone || '+964 750 000 0000',
      gender: newUserForm.gender,
      food_allergies: newUserForm.foodAllergies || 'None',
      country: newUserForm.country,
      city: newUserForm.city,
      qr_code_data: qrCodeData,
      role: newUserForm.role,
      email_verified: true,
      created_at: new Date().toISOString().substring(0, 10),
      status: newUserForm.status,
    };

    const updatedUsers = [...users, newUserObj];
    saveDB.users(updatedUsers);
    setUsers(updatedUsers);
    
    // Reset form
    setNewUserForm({
      fullName: '',
      email: '',
      username: '',
      password: '',
      role: 'user',
      organization: '',
      position: '',
      phone: '',
      gender: 'Male',
      foodAllergies: '',
      country: 'Iraq',
      city: 'Erbil',
      status: 'Approved',
    });
    setIsAddingUser(false);
  };

  // Calculations for KPI Cards
  const totalRegistrations = users.filter((u) => u.role === 'user').length;
  const approvedRegistrations = users.filter((u) => u.role === 'user' && u.status === 'Approved').length;
  // Unique users with at least one present scan
  const presentUserIds = new Set(attendance.filter(a => a.attendance_status === 'Present').map(a => a.user_id));
  const totalAttendance = presentUserIds.size;
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0;
  const activeKeysCount = codes.filter((c) => c.status === 'Active' || c.status === 'Unused').length;
  const usedKeysCount = codes.filter((c) => c.status === 'Used').length;

  // New Metrics requested by user
  const totalMealsChecked = meals.filter(m => m.meal_status === 'Approved').length;
  const totalDuplicateMeals = meals.filter(m => m.meal_status === 'Duplicate').length;
  const vipRegistrationsCount = users.filter(u => u.role === 'user' && (u.position.toLowerCase().includes('vip') || u.position.toLowerCase().includes('expert') || u.position.toLowerCase().includes('director') || u.position.toLowerCase().includes('minister'))).length;
  const academicDelegatesCount = users.filter(u => u.role === 'user' && (u.organization.toLowerCase().includes('edu') || u.organization.toLowerCase().includes('school') || u.organization.toLowerCase().includes('university') || u.organization.toLowerCase().includes('college') || u.organization.toLowerCase().includes('ministry'))).length;

  // Update User Status Handler
  const handleUpdateUserStatus = (id: string, newStatus: 'Approved' | 'Rejected') => {
    const allUsers = getDB.users();
    const updated = allUsers.map(u => {
      if (u.id === id) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    saveDB.users(updated);
    setUsers(updated);
  };

  // Add Code Handler
  const handleAddCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.code || !newCode.descEn) return;

    const codeObj: InvitationCode = {
      id: String(codes.length + 1),
      code: newCode.code.trim().toUpperCase(),
      description_en: newCode.descEn,
      description_ku: newCode.descKu || newCode.descEn,
      usage_limit: Number(newCode.limit),
      used_count: 0,
      expiry_date: newCode.expiry,
      status: 'Active',
      created_at: new Date().toISOString().substring(0, 10),
    };

    const updated = [...codes, codeObj];
    saveDB.codes(updated);
    setCodes(updated);
    setNewCode({ code: '', descEn: '', descKu: '', limit: 1, expiry: '2026-06-15' });
    setShowAddCode(false);
  };

  // Add or Update Agenda Session Handler
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title) return;

    // Build speaker list from panelists list if manual speakers not provided
    const computedSpeaker = newSession.speaker || panelistsInput.map(p => p.name).join(', ') || 'Academic Panelists';

    const sessionObj: AgendaSession = {
      id: editingSessionId || String(agenda.length + 1),
      event_id: '1',
      session_title: newSession.title,
      speaker: computedSpeaker,
      session_date: newSession.date,
      start_time: newSession.start,
      end_time: newSession.end,
      location: newSession.location || 'Saad Abdullah Palace, Main Hall',
      description: newSession.desc,
      created_at: new Date().toISOString(),
      panelists: panelistsInput.length > 0 ? panelistsInput : [
        {
          name: computedSpeaker.split(',')[0] || 'TBD Speaker',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
          position: 'Forum Presenter',
          role: 'Speaker'
        }
      ],
      translation_link: translationLinkInput || 'https://meet.google.com/abc-kef-2026',
      comments_link: commentsLinkInput || 'https://meet.google.com/abc-comments-kef',
    };

    let updated: AgendaSession[];
    if (editingSessionId) {
      updated = agenda.map(s => s.id === editingSessionId ? { ...sessionObj, id: editingSessionId } : s);
      setEditingSessionId(null);
    } else {
      updated = [...agenda, sessionObj];
    }

    saveDB.agenda(updated);
    setAgenda(updated);
    
    // Reset inputs
    setNewSession({ title: '', speaker: '', date: '2026-06-15', start: '09:00', end: '10:00', location: '', desc: '' });
    setPanelistsInput([]);
    setTranslationLinkInput('');
    setCommentsLinkInput('');
    setShowAddSession(false);
  };

  const handleEditSessionTrigger = (sess: AgendaSession) => {
    setEditingSessionId(sess.id);
    setNewSession({
      title: sess.session_title,
      speaker: sess.speaker,
      date: sess.session_date,
      start: sess.start_time,
      end: sess.end_time,
      location: sess.location,
      desc: sess.description,
    });
    setPanelistsInput(sess.panelists || []);
    setTranslationLinkInput(sess.translation_link || '');
    setCommentsLinkInput(sess.comments_link || '');
    setShowAddSession(true);
  };

  const handleAddPanelistInput = () => {
    setPanelistsInput([...panelistsInput, {
      name: '',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
      position: '',
      role: 'Panelist'
    }]);
  };

  const handleRemovePanelistInput = (index: number) => {
    setPanelistsInput(panelistsInput.filter((_, i) => i !== index));
  };

  const handlePanelistFieldChange = (index: number, field: keyof Panelist, value: string) => {
    setPanelistsInput(panelistsInput.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  // Delete User Handler
  const handleDeleteUser = (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Action Denied: Organizers cannot delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this participant? This action is irreversible.')) {
      const updated = users.filter((u) => u.id !== id);
      saveDB.users(updated);
      setUsers(updated);
    }
  };

  const handleDeleteCode = (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Action Denied: Organizers cannot delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this invitation code?')) {
      const updated = codes.filter((c) => c.id !== id);
      saveDB.codes(updated);
      setCodes(updated);
    }
  };

  const handleDeleteLog = (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Action Denied: Organizers cannot delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this scan log?')) {
      const updated = attendance.filter((a) => a.id !== id);
      saveDB.attendance(updated);
      setAttendance(updated);
    }
  };

  const handleDeleteMealLog = (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Action Denied: Organizers cannot delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this dining log?')) {
      const updated = meals.filter((m) => m.id !== id);
      saveDB.meals(updated);
      setMeals(updated);
    }
  };

  const handleMassPrintAllBadges = async () => {
    const attendees = users.filter((u) => u.role === 'user');
    if (attendees.length === 0) {
      alert("No registered users to print!");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow pop-ups to print bulk conference badges.");
      return;
    }

    let compiledBadgesHtml = '';

    const generateBadgeHTMLString = async (user: SystemUser) => {
      const emailUpper = user.email.toUpperCase();
      
      const category = user.badge_category || (
        user.role === 'admin' ? 'Administration' :
        (emailUpper.includes('EDU') || user.position.toUpperCase().includes('PROFESSOR') || user.position.toUpperCase().includes('DEAN') || user.position.toUpperCase().includes('DOCTOR') || user.position.toUpperCase().includes('DR.')) ? 'Academic Staff' :
        'Attendee'
      );

      let badgeTheme = {
        bg: 'bg-emerald-50',
        accent: 'bg-emerald-600',
        text: 'text-emerald-800',
        label: 'ATTENDEE',
      };

      if (category === 'Administration') {
        badgeTheme = {
          bg: 'bg-rose-50',
          accent: 'bg-rose-600',
          text: 'text-rose-800',
          label: 'ADMINISTRATION',
        };
      } else if (category === 'Organizer') {
        badgeTheme = {
          bg: 'bg-amber-50',
          accent: 'bg-amber-600',
          text: 'text-amber-800',
          label: 'ORGANIZER',
        };
      } else if (category === 'Academic Staff') {
        badgeTheme = {
          bg: 'bg-sky-50',
          accent: 'bg-sky-600',
          text: 'text-sky-800',
          label: 'ACADEMIC STAFF',
        };
      } else if (category === 'VIP Guest') {
        badgeTheme = {
          bg: 'bg-purple-50',
          accent: 'bg-purple-600',
          text: 'text-purple-800',
          label: 'VIP GUEST',
        };
      }

      const qrData = `${user.registration_id}|${user.full_name}|&reg_id=${user.registration_id}`;
      let qrUrl = '';
      try {
        qrUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 256 });
      } catch (err) {
        console.error(err);
      }

      return `
        <div class="badge-card relative bg-white page-break" style="width: 100mm; height: 150mm; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; margin: 20px auto; page-break-after: always; break-after: page; font-family: system-ui, -apple-system, sans-serif;">
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <img src="https://static.wixstatic.com/media/446272_596df79696e14e439527fac871ef2fce~mv2.jpg" style="width: 70px; height: 70px; object-fit: contain; border-radius: 12px; margin-bottom: 6px;" />
            <span style="font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Kurdistan Education Forum</span>
            <span style="font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 2px;">KEF 2026</span>
            <div style="height: 6px; width: 100%; margin-top: 8px; border-radius: 4px;" class="${badgeTheme.accent}"></div>
          </div>

          <div style="text-align: center; margin: 12px 0; padding: 10px 0; border-top: 1px dashed #e2e8f0; border-bottom: 1px dashed #e2e8f0;">
            <span style="font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 9999px; display: inline-block; margin-bottom: 8px;" class="${badgeTheme.text} ${badgeTheme.bg}">
              ${badgeTheme.label}
            </span>
            <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">${user.full_name}</h1>
            <p style="font-size: 12px; color: #475569; font-weight: 500; margin: 4px 0 0 0;">${user.position}</p>
            <p style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin: 2px 0 0 0;">${user.organization}</p>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 10px;">
            <img src="${qrUrl}" style="width: 100px; height: 100px; object-fit: contain; border: 1px solid #f1f5f9; border-radius: 8px; padding: 4px; background: white;" />
            <div style="text-align: center; margin-top: 6px;">
              <span style="font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; display: block; line-height: 1;">Registration Pass ID</span>
              <span style="font-size: 12px; font-weight: bold; color: #1e293b; font-family: monospace; letter-spacing: 0.15em;">${user.registration_id}</span>
            </div>
          </div>

          <div style="text-align: center; font-size: 8px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; border-top: 1px solid #f1f5f9; padding-top: 8px;">
            Saad Abdullah Palace, Erbil · KRG
          </div>
        </div>
      `;
    };

    for (const attendee of attendees) {
      const markup = await generateBadgeHTMLString(attendee);
      compiledBadgesHtml += markup;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KEF 2026 Bulk Badges</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; padding: 0; background-color: #f8fafc; }
            @media print {
              body { background-color: white; }
              .badge-card {
                margin: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-slate-50 p-4">
          <div class="no-print max-w-xl mx-auto my-6 bg-white border border-slate-300 rounded-3xl p-6 text-center shadow-lg font-sans">
             <h2 class="text-lg font-extrabold text-slate-800">Accredited Badge Compilation Ready</h2>
             <p class="text-xs text-slate-400 mt-1">Found ${attendees.length} participant accounts. Formatted for standardized 100mm x 150mm badge sheet printouts.</p>
             <div class="flex gap-4 justify-center mt-4">
                <button onclick="window.print()" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer">
                  Confirm Print / Export PDF
                </button>
                <button onclick="window.close()" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer">
                  Close Window
                </button>
             </div>
          </div>
          <div id="print-container">
            ${compiledBadgesHtml}
          </div>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteSession = (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Action Denied: Organizers cannot delete records.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this agenda session?')) {
      const updated = agenda.filter((s) => s.id !== id);
      saveDB.agenda(updated);
      setAgenda(updated);
    }
  };

  const purgeSettingsDB = () => {
    if (window.confirm('CRITICAL: Reset database back to default seed state? All live scans and registrations will be refreshed.')) {
      dbOperations.resetDatabase();
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'organizer') return 'Organizer';
    return 'Attendee';
  };

  const exportUsersCSV = () => {
    // Basic browser-native CSV file downloader
    let csvContent = 'data:text/csv;charset=utf-8,ID,Registration ID,Full Name,Email,Organization,Position,Phone,City,Dietary\n';
    users.filter(u => u.role === 'user').forEach(u => {
      csvContent += `"${u.id}","${u.registration_id}","${u.full_name}","${u.email}","${u.organization}","${u.position}","${u.phone}","${u.city}","${u.food_allergies}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'KEF_2026_Participants_List.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCodesCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Code,Description En,Description Ku,Usage Limit,Used Count,Expiry Date,Status\n';
    codes.forEach(c => {
      csvContent += `"${c.code}","${c.description_en}","${c.description_ku}","${c.usage_limit}","${c.used_count}","${c.expiry_date}","${c.status}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'KEF_2026_Invitation_Codes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLogsCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Log ID,Participant Name,Registration ID,Scan Date,Scan Time,Scanning Officer\n';
    attendance.forEach(a => {
      const associatedUser = users.find(u => u.id === a.user_id);
      csvContent += `"${a.id}","${associatedUser?.full_name || 'N/A'}","${associatedUser?.registration_id || 'N/A'}","${a.scan_date}","${a.scan_time}","${a.scanned_by}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'KEF_2026_Attendance_Logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAgendaCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Session ID,Title,Date,Start Time,End Time,Location\n';
    agenda.forEach(s => {
      csvContent += `"${s.id}","${s.session_title}","${s.session_date}","${s.start_time}","${s.end_time}","${s.location}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'KEF_2026_Agenda.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-80px)]">
      {/* Sidebar navigation control list */}
      <nav className="lg:col-span-3 xl:col-span-2 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="p-2 flex items-center gap-3 border-b border-slate-800/80 pb-5">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xl shrink-0">K</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight uppercase tracking-wider">KEF 2026</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-mono">
                {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'organizer' ? 'Organizer' : 'Attendee'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => { setActiveTab('dashboard'); setSelectedUserForBadge(null); }}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Grid size={15} /> <span>Dashboard Metrics</span>
                  </div>
                  {activeTab === 'dashboard' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </button>
                <button
                  onClick={() => { setActiveTab('users'); setSelectedUserForBadge(null); }}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users size={15} /> <span>Users Page</span>
                  </div>
                  {activeTab === 'users' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </button>
                <button
                  onClick={() => { setActiveTab('invitation-codes'); setSelectedUserForBadge(null); }}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'invitation-codes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Key size={15} /> <span>Invitation Codes</span>
                  </div>
                  {activeTab === 'invitation-codes' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </button>
                <button
                  onClick={() => { setActiveTab('agenda'); setSelectedUserForBadge(null); }}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'agenda' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar size={15} /> <span>Forum Agenda</span>
                  </div>
                  {activeTab === 'agenda' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </button>
              </>
            )}

            <button
              onClick={() => { setActiveTab('scanner'); setSelectedUserForBadge(null); }}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition font-mono tracking-wider bg-slate-800/25 border border-slate-800 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-500 cursor-pointer ${
                activeTab === 'scanner' ? 'bg-amber-500/15 border-amber-500/30 text-amber-500' : 'text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode size={15} /> <span>SCANNER DESK</span>
              </div>
              {activeTab === 'scanner' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('attendance'); setSelectedUserForBadge(null); }}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  activeTab === 'attendance' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList size={15} /> <span>Attendance Log</span>
                </div>
                {activeTab === 'attendance' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
              </button>
            )}

            <button
              onClick={() => { setActiveTab('meals'); setSelectedUserForBadge(null); }}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'meals' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Utensils size={15} className="text-amber-500" /> <span>Restaurant Desk</span>
              </div>
              {activeTab === 'meals' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>

            <button
              onClick={() => { setActiveTab('badges'); setSelectedUserForBadge(null); }}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'badges' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award size={15} className="text-amber-400" /> <span>Bulk Badge Printer</span>
              </div>
              {activeTab === 'badges' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={() => { setActiveTab('reports'); setSelectedUserForBadge(null); }}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileBarChart2 size={15} /> <span>Core Reports</span>
                  </div>
                  {activeTab === 'reports' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setSelectedUserForBadge(null); }}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders size={15} /> <span>System Settings</span>
                  </div>
                  {activeTab === 'settings' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </button>
              </>
            )}

            {/* Profile Tab for Admin & Organizer */}
            <button
              onClick={() => { setActiveTab('profile'); setSelectedUserForBadge(null); }}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={15} className="text-emerald-400" /> <span>My Account Profile</span>
              </div>
              {activeTab === 'profile' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {currentUser.picture ? (
                <img
                  src={currentUser.picture}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {scannerAdmin.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold truncate leading-none">{scannerAdmin}</p>
                <p className="text-slate-500 text-[10px] mt-1 truncate">{currentUser.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 text-left hover:bg-slate-800 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-2"
          >
            <LogOut size={14} /> <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Panel Content */}
      <main className="lg:col-span-9 xl:col-span-10 p-6 space-y-6">
        {selectedUserForBadge ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setSelectedUserForBadge(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                ← Return to User List
              </button>
            </div>
            <BadgeRenderer 
              user={selectedUserForBadge} 
              onClose={() => setSelectedUserForBadge(null)} 
              onUserUpdate={(updatedUser) => {
                setSelectedUserForBadge(updatedUser);
                loadDatabase();
              }} 
            />
          </div>
        ) : (
          <>
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-tight">KEF Operational Dashboard</h2>
                  <p className="text-xs text-slate-400">Real-time attendance metric monitoring at Saad Abdullah Palace</p>
                </div>

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Participants</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-slate-900">{totalRegistrations}</h3>
                      <span className="text-emerald-500 text-xs font-bold font-sans tracking-wide">+12%</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Checked In/Arrivals</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-slate-900">{totalAttendance}</h3>
                      <span className="text-slate-400 text-xs font-sans">of {totalRegistrations}</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Attendance Rate</p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-3xl font-black text-slate-900">{attendanceRate}%</h3>
                      <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden self-center shrink-0">
                        <div className="h-full bg-amber-500 animate-pulse" style={{ width: `${attendanceRate}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Invitation Keys</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-slate-900">{activeKeysCount}</h3>
                      <span className="text-slate-400 text-xs font-bold font-sans">Active Keys</span>
                    </div>
                  </div>
                </div>

                {/* Secondary KPI Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Meals Redeemed</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-emerald-700">{totalMealsChecked}</h3>
                      <span className="text-slate-400 text-[10px] font-mono uppercase font-bold">Approved</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">Voucher Duplications Stop</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-rose-700">{totalDuplicateMeals}</h3>
                      <span className="text-slate-400 text-[10px] font-mono uppercase font-bold">Blocked</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1 font-mono">VIP / Ministers Presence</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-amber-500">{vipRegistrationsCount}</h3>
                      <span className="text-slate-400 text-[10px] font-sans">Active Profiles</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Educational Delegates</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black text-indigo-500">{academicDelegatesCount}</h3>
                      <span className="text-slate-400 text-[10px] font-sans font-bold">Academic Core</span>
                    </div>
                  </div>
                </div>

                {/* Split list activity detail rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent registrations */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                      <span>Newly Registered</span>
                      <Users size={14} />
                    </h4>
                    <div className="divide-y divide-slate-100 text-xs">
                      {users.filter(u => u.role === 'user').slice(-4).reverse().map((u) => (
                        <div key={u.id} className="py-2.5 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-800 block">{u.full_name}</span>
                            <span className="text-[10px] text-slate-400">{u.organization}</span>
                          </div>
                          <span className="font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600">
                            {u.registration_id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scans Stream */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
                      <span>Live Arrival Logs</span>
                      <Clock size={14} className="text-slate-500" />
                    </h4>
                    <div className="divide-y divide-slate-100 text-xs text-left">
                      {attendance.length === 0 ? (
                        <p className="text-center text-slate-400 py-6 text-[11px]">Standby scanner for initial check-ins.</p>
                      ) : (
                        attendance.slice(-4).reverse().map((a) => {
                          const linkedUser = users.find(u => u.id === a.user_id);
                          return (
                            <div key={a.id} className="py-2.5 flex justify-between items-center">
                              <div>
                                <span className="font-semibold text-slate-800 block">{linkedUser?.full_name || 'Anonymous User'}</span>
                                <span className="text-[10px] text-slate-400">Scanner: {a.scanner_admin}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono text-[10px] text-slate-500 block">{a.scan_time}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  a.attendance_status === 'Present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                                }`}>
                                  {a.attendance_status}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USERS LIST */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">KEF Users Directory</h2>
                    <p className="text-xs text-slate-400">Secure listing of active certified forum representatives</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddingUser(!isAddingUser)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Plus size={14} /> Add New User
                    </button>
                    <button
                      onClick={exportUsersCSV}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Export CSV List
                    </button>
                  </div>
                </div>

                {isAddingUser && (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in text-left">
                    <h3 className="text-sm font-extrabold text-slate-800">Register New Forum Participant</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. Karwan Mawlood"
                            value={newUserForm.fullName}
                            onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="name@domain.com"
                            value={newUserForm.email}
                            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-505 block">Username (Handle ID)</label>
                          <input
                            type="text"
                            placeholder="karwan_mawlood"
                            value={newUserForm.username}
                            onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-505 block">Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="Set initial password"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">System Account Role *</label>
                          <select
                            value={newUserForm.role}
                            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
                          >
                            <option value="user">Attendee</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Account Status *</label>
                          <select
                            value={newUserForm.status}
                            onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
                          >
                            <option value="Approved">Approved (Access Permitted)</option>
                            <option value="Pending">Pending Approval (Restricted)</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Organization *</label>
                          <input
                            type="text"
                            required
                            placeholder="University / Organization"
                            value={newUserForm.organization}
                            onChange={(e) => setNewUserForm({ ...newUserForm, organization: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Position / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Professor, Delegate"
                            value={newUserForm.position}
                            onChange={(e) => setNewUserForm({ ...newUserForm, position: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Phone Contact Number</label>
                          <input
                            type="tel"
                            placeholder="+964 750 ..."
                            value={newUserForm.phone}
                            onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 block">Gender</label>
                          <select
                            value={newUserForm.gender}
                            onChange={(e) => setNewUserForm({ ...newUserForm, gender: e.target.value as any })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:bg-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-505 block">City</label>
                          <input
                            type="text"
                            value={newUserForm.city}
                            onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-505 block">Dietary Restrictions</label>
                          <input
                            type="text"
                            placeholder="e.g. Vegetarian, None"
                            value={newUserForm.foodAllergies}
                            onChange={(e) => setNewUserForm({ ...newUserForm, foodAllergies: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingUser(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                          Create Account & Approve
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Filter and search bars */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <Search size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Filter by Name, Organization, Registry ID, City..."
                    className="w-full text-xs text-slate-700 bg-transparent py-1 border-none focus:ring-0 focus:outline-none placeholder:text-slate-400"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch('')}
                      className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Main grid table values */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto text-left">
                    <table className="w-full text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4 font-semibold">Reg ID</th>
                          <th className="py-3.5 px-4 font-semibold">Name / Title</th>
                          <th className="py-3.5 px-4 font-semibold">Organization</th>
                          <th className="py-3.5 px-4 font-semibold">Phone / City</th>
                          <th className="py-3.5 px-4 font-semibold">Category</th>
                          <th className="py-3.5 px-4 font-semibold">Status</th>
                          <th className="py-3.5 px-4 font-semibold text-center">Accreditation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users
                          .filter((u) => {
                            const search = userSearch.toLowerCase();
                            return (
                              u.full_name.toLowerCase().includes(search) ||
                              u.organization.toLowerCase().includes(search) ||
                              u.registration_id.toLowerCase().includes(search) ||
                              u.city.toLowerCase().includes(search)
                            );
                          })
                          .map((u) => {
                            const isPresent = presentUserIds.has(u.id);
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{u.registration_id}</td>
                                <td className="py-3.5 px-4">
                                  <div>
                                    <span className="font-bold text-slate-800 block">{u.full_name}</span>
                                    <span className="text-[10px] text-slate-400">{u.position}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div>
                                    <span className="font-semibold text-slate-700 block">{u.organization}</span>
                                    <span className="text-[10px] text-slate-400">{u.email}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div>
                                    <span className="font-mono text-slate-700 block">{u.phone}</span>
                                    <span className="text-[10px] text-slate-400">{u.city}, {u.country}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                    u.role === 'admin'
                                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                                      : u.role === 'organizer'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  }`}>
                                    {getRoleLabel(u.role)}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    u.status === 'Approved'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : u.status === 'Rejected'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {u.status || 'Pending'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    <button
                                      onClick={() => setSelectedUserForBadge(u)}
                                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="View Badge"
                                    >
                                      <Printer size={10} /> View Badge
                                    </button>
                                    
                                    {u.role !== 'admin' && (
                                      <>
                                        {u.status !== 'Approved' && (
                                          <button
                                            onClick={() => handleUpdateUserStatus(u.id, 'Approved')}
                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                            title="Approve Participant"
                                          >
                                            Approve
                                          </button>
                                        )}
                                        {u.status !== 'Rejected' && (
                                          <button
                                            onClick={() => handleUpdateUserStatus(u.id, 'Rejected')}
                                            className="px-2 py-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                            title="Reject Participant"
                                          >
                                            Reject
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteUser(u.id)}
                                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition cursor-pointer"
                                          title="Delete user"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INVITATION CODES */}
            {activeTab === 'invitation-codes' && (
              <div className="space-y-6 text-left">
                <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 leading-snug">Registration Invitation Codes</h2>
                    <p className="text-xs text-slate-400">Manage pre-authorization access links with limit checks</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportCodesCSV}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Export CSV List
                    </button>
                    <button
                      onClick={() => setShowAddCode(!showAddCode)}
                      className="px-3.5 py-1.5 bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={15} /> Add New Code
                    </button>
                  </div>
                </div>

                {showAddCode && (
                  <form onSubmit={handleAddCode} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-inner space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-200/50 pb-2">Generate Code</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Pass Code Text</label>
                        <input
                          type="text"
                          required
                          value={newCode.code}
                          onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                          placeholder="e.g. KEF2026-VIP-SC"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none uppercase font-mono font-bold text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Max Allocation Limit</label>
                        <input
                          type="number"
                          required
                          value={newCode.limit}
                          onChange={(e) => setNewCode({ ...newCode, limit: Number(e.target.value) })}
                          min={1}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Description (English)</label>
                        <input
                          type="text"
                          required
                          value={newCode.descEn}
                          onChange={(e) => setNewCode({ ...newCode, descEn: e.target.value })}
                          placeholder="VIP scientific delegate passes"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Secondary Description</label>
                        <input
                          type="text"
                          value={newCode.descKu}
                          onChange={(e) => setNewCode({ ...newCode, descKu: e.target.value })}
                          placeholder="Alternative custom passes label"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Expiry Date</label>
                        <input
                          type="date"
                          value={newCode.expiry}
                          onChange={(e) => setNewCode({ ...newCode, expiry: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition uppercase cursor-pointer"
                      >
                        Register Code Key
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddCode(false)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 text-left">Code Name</th>
                          <th className="py-3 px-4 text-left">Description En</th>
                          <th className="py-3 px-4 text-right">Description Ku</th>
                          <th className="py-3 px-4 text-center">Utilized Allocation</th>
                          <th className="py-3 px-4 text-left">Expiry Threshold</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {codes.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition whitespace-nowrap">
                            <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.code}</td>
                            <td className="py-3 px-4 font-medium text-slate-600 whitespace-normal">{c.description_en}</td>
                            <td className="py-3 px-4 font-normal text-slate-500 whitespace-normal" dir="rtl">{c.description_ku}</td>
                            <td className="py-3 px-4 text-center font-semibold">
                              <span className="text-slate-700">{c.used_count}</span>
                              <span className="text-slate-400"> / {c.usage_limit}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500">{c.expiry_date}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleDeleteCode(c.id)}
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition cursor-pointer"
                                  title="Delete Code"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: LIVE SCANNER DESK */}
            {activeTab === 'scanner' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-tight">Live scan badge checking terminal</h2>
                  <p className="text-xs text-slate-400">Verify participants attendance utilizing physical QR webcams</p>
                </div>
                {/* Embed modern camera terminal wrapper */}
                <QRScanner scannerAdmin={scannerAdmin} onScanLogged={loadDatabase} />
              </div>
            )}

             {/* TAB: ATTENDANCE LOG */}
             {activeTab === 'attendance' && (
               <div className="space-y-6 text-left">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                   <div>
                     <h2 className="text-xl font-black text-slate-800 leading-tight">Forum Attendance Logs</h2>
                     <p className="text-xs text-slate-400">Audit trail of scanned credentials matching registered database entities</p>
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => {
                         const headers = ['Log ID', 'Participant Name', 'Registration ID', 'Scan Date', 'Scan Time', 'Scanner Admin', 'Status'];
                         const filtered = attendance.filter((a) => {
                           const associatedUser = users.find(u => u.id === a.user_id);
                           const nameMatches = associatedUser ? associatedUser.full_name.toLowerCase().includes(userSearch.toLowerCase()) : true;
                           const dateMatches = attendanceDateFilter ? a.scan_date === attendanceDateFilter : true;
                           const timeMatches = attendanceTimeFilter ? a.scan_time.substring(0, 5) >= attendanceTimeFilter : true; 
                           return nameMatches && dateMatches && timeMatches;
                         });
                         const rows = filtered.map(a => {
                           const associatedUser = users.find(u => u.id === a.user_id);
                           return [
                             a.id,
                             associatedUser?.full_name || 'Unmapped User',
                             associatedUser?.registration_id || '',
                             a.scan_date,
                             a.scan_time,
                             a.scanner_admin,
                             a.attendance_status
                           ];
                         });
                         const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                         const url = URL.createObjectURL(blob);
                         const link = document.createElement("a");
                         link.setAttribute("href", url);
                         link.setAttribute("download", `kef_filtered_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
                         document.body.appendChild(link);
                         link.click();
                         document.body.removeChild(link);
                       }}
                       className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                     >
                       Export Filtered Excel / CSV
                     </button>
                     <button
                       onClick={exportLogsCSV}
                       className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                     >
                       Export All CSV
                     </button>
                   </div>
                 </div>

                 {/* Filter Tools bar */}
                 <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                   <div className="flex items-center gap-2">
                     <span className="text-slate-400">Search Participant Name:</span>
                     <input
                       type="text"
                       placeholder="Scan search..."
                       value={userSearch}
                       onChange={(e) => setUserSearch(e.target.value)}
                       className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800"
                     />
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-slate-400">Filter Date:</span>
                     <input
                       type="date"
                       value={attendanceDateFilter}
                       onChange={(e) => setAttendanceDateFilter(e.target.value)}
                       className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono text-slate-800"
                     />
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-slate-400">Filter Time Onward:</span>
                     <input
                       type="time"
                       value={attendanceTimeFilter}
                       onChange={(e) => setAttendanceTimeFilter(e.target.value)}
                       className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono text-slate-800"
                     />
                   </div>
                   {(attendanceDateFilter || attendanceTimeFilter || userSearch) && (
                     <button
                       onClick={() => { setAttendanceDateFilter(''); setAttendanceTimeFilter(''); setUserSearch(''); }}
                       className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl transition text-slate-700 font-bold"
                     >
                       Clear Filters
                     </button>
                   )}
                 </div>

                 <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                   <div className="overflow-x-auto">
                     <table className="w-full text-xs text-slate-600">
                       <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                         <tr>
                           <th className="py-3 px-4 text-left whitespace-nowrap">Log ID</th>
                           <th className="py-3 px-4 text-left whitespace-nowrap">Participant Name</th>
                           <th className="py-3 px-4 text-left whitespace-nowrap">Registration ID</th>
                           <th className="py-3 px-4 text-left whitespace-nowrap">Scan Date</th>
                           <th className="py-3 px-4 text-left whitespace-nowrap">Scan Time</th>
                           <th className="py-3 px-4 text-left whitespace-nowrap">Scanning Desk Officer</th>
                           <th className="py-3 px-4 text-center whitespace-nowrap">Tracking Status</th>
                           <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {attendance.filter((a) => {
                           const associatedUser = users.find(u => u.id === a.user_id);
                           const nameMatches = associatedUser ? associatedUser.full_name.toLowerCase().includes(userSearch.toLowerCase()) : true;
                           const dateMatches = attendanceDateFilter ? a.scan_date === attendanceDateFilter : true;
                           const timeMatches = attendanceTimeFilter ? a.scan_time.substring(0, 5) >= attendanceTimeFilter : true; 
                           return nameMatches && dateMatches && timeMatches;
                         }).map((a) => {
                           const associatedUser = users.find(u => u.id === a.user_id);
                          return (
                            <tr key={a.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-4 font-mono font-medium text-slate-400">#{a.id}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{associatedUser?.full_name || 'Unmapped User'}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700">{associatedUser?.registration_id || 'N/A'}</td>
                              <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{a.scan_date}</td>
                              <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{a.scan_time}</td>
                              <td className="py-3 px-4 font-medium text-slate-600">{a.scanner_admin}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                  a.attendance_status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {a.attendance_status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleDeleteLog(a.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition cursor-pointer"
                                    title="Delete Log"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MEALS (RESTAURANT DESK) */}
            {activeTab === 'meals' && (
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 leading-tight">Palace Dining & Restaurant Desk</h2>
                    <p className="text-xs text-slate-400 font-medium">Verify diner credential QR codes, enforce single-meals per day/session, and track dietary preferences</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const headers = ['Log ID', 'Participant Name', 'Registration ID', 'Scan Date', 'Scan Time', 'Scanner Admin', 'Dietary Preference', 'Meal Status'];
                        const filtered = meals.filter((m) => {
                          const associatedUser = users.find(u => u.id === m.user_id);
                          const nameMatches = associatedUser ? associatedUser.full_name.toLowerCase().includes(userSearch.toLowerCase()) : true;
                           const dateMatches = mealDateFilter ? m.scan_date === mealDateFilter : true;
                           const timeMatches = mealTimeFilter ? m.scan_time.substring(0, 5) >= mealTimeFilter : true; 
                           return nameMatches && dateMatches && timeMatches;
                        });
                        const rows = filtered.map(m => {
                          const associatedUser = users.find(u => u.id === m.user_id);
                          return [
                            m.id,
                            associatedUser?.full_name || 'Unmapped User',
                            associatedUser?.registration_id || '',
                            m.scan_date,
                            m.scan_time,
                            m.scanner_admin,
                            associatedUser?.food_allergies || 'Standard Meal',
                            m.meal_status
                          ];
                        });
                        const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `kef_filtered_meals_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Export Filtered Meal CSV / Excel
                    </button>
                    <button
                      onClick={() => {
                        const headers = ['Log ID', 'Participant ID', 'Scan Date', 'Scan Time', 'Scanner Admin', 'Status'];
                        const rows = meals.map(m => [m.id, m.user_id, m.scan_date, m.scan_time, m.scanner_admin, m.meal_status]);
                        const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `kef_all_meals_${new Date().toISOString().slice(0, 10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Export All Meals
                    </button>
                  </div>
                </div>

                {/* Interactive Restaurant QR Scanner Section */}
                <div className="bg-slate-55 border border-slate-100 rounded-3xl p-2">
                  <QRScanner mode="meal" scannerAdmin={scannerAdmin} onScanLogged={loadDatabase} />
                </div>

                {/* Filter Tools bar */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Search Diner Name:</span>
                    <input
                      type="text"
                      placeholder="Diner search..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Filter Date:</span>
                    <input
                      type="date"
                      value={mealDateFilter}
                      onChange={(e) => setMealDateFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Filter Time Onward:</span>
                    <input
                      type="time"
                      value={mealTimeFilter}
                      onChange={(e) => setMealTimeFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono text-slate-800"
                    />
                  </div>
                  {(mealDateFilter || mealTimeFilter || userSearch) && (
                    <button
                      onClick={() => { setMealDateFilter(''); setMealTimeFilter(''); setUserSearch(''); }}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl transition text-slate-700 font-bold"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Log ID</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Diner Name</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Registration ID</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Scan Date</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Scan Time</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Dietary Preference</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Dining Status</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {meals.filter((m) => {
                          const associatedUser = users.find(u => u.id === m.user_id);
                          const nameMatches = associatedUser ? associatedUser.full_name.toLowerCase().includes(userSearch.toLowerCase()) : true;
                          const dateMatches = mealDateFilter ? m.scan_date === mealDateFilter : true;
                          const timeMatches = mealTimeFilter ? m.scan_time.substring(0, 5) >= mealTimeFilter : true; 
                          return nameMatches && dateMatches && timeMatches;
                        }).map((m) => {
                          const associatedUser = users.find(u => u.id === m.user_id);
                          return (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-4 font-mono font-medium text-slate-400">#{m.id}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{associatedUser?.full_name || 'Unmapped User'}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-700">{associatedUser?.registration_id || 'N/A'}</td>
                              <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{m.scan_date}</td>
                              <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{m.scan_time}</td>
                              <td className="py-3 px-4 font-medium text-slate-600">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600">
                                  {associatedUser?.food_allergies || 'Standard Meal'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                  m.meal_status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {m.meal_status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleDeleteMealLog(m.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition cursor-pointer"
                                    title="Delete Log"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {meals.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">
                              No dining logs captured yet. Standby for scanned codes.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CORE REPORTS */}
            {activeTab === 'reports' && (() => {
              const repUsers = users.filter(u => u.role === 'user');
              const filteredUsersForReports = repUsers.filter(u => {
                const matchStatus = repStatus === 'All' ? true : u.status === repStatus;
                const matchCity = repCity === 'All' ? true : u.city.toLowerCase() === repCity.toLowerCase();
                const matchGender = repGender === 'All' ? true : u.gender.toLowerCase() === repGender.toLowerCase();
                return matchStatus && matchCity && matchGender;
              });

              const repTotal = filteredUsersForReports.length;
              const repApproved = filteredUsersForReports.filter(u => u.status === 'Approved').length;
              const repPending = filteredUsersForReports.filter(u => u.status === 'Pending').length;
              const repRejected = filteredUsersForReports.filter(u => u.status === 'Rejected').length;

              const repPresentSum = attendance.filter(a => a.attendance_status === 'Present' && filteredUsersForReports.some(u => u.id === a.user_id)).length;
              const repCheckInRate = repTotal > 0 ? Math.round((repPresentSum / repTotal) * 100) : 0;

              return (
                <div className="space-y-6 text-left">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
                    <div>
                      <h2 className="text-lg font-black text-slate-800">Operational Forum Reports</h2>
                      <p className="text-xs text-slate-400">Statistical metrics and demographic graphs for active, pending, or credentialed delegates</p>
                    </div>
                    
                    {/* Diagnostic Filter Control Center */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</span>
                        <select
                          value={repStatus}
                          onChange={(e) => setRepStatus(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-slate-800"
                        >
                          <option value="All">All Accords</option>
                          <option value="Approved">Approved Only</option>
                          <option value="Pending">Pending Only</option>
                          <option value="Rejected">Rejected Only</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">City Origin</span>
                        <select
                          value={repCity}
                          onChange={(e) => setRepCity(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-slate-800"
                        >
                          <option value="All">All Cities</option>
                          <option value="Erbil">Erbil</option>
                          <option value="Sulaymaniyah">Sulaymaniyah</option>
                          <option value="Duhok">Duhok</option>
                          <option value="Halabja">Halabja</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Gender</span>
                        <select
                          value={repGender}
                          onChange={(e) => setRepGender(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-slate-800"
                        >
                          <option value="All">All Genders</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <button
                        onClick={() => { setRepStatus('All'); setRepCity('All'); setRepGender('All'); }}
                        className="self-end px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>

                  {/* Micro Analytical KPI Summary Indicators Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Accredited Pool</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-extrabold text-slate-800">{repTotal}</span>
                        <span className="text-[9px] text-slate-400 font-medium">accounts</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-slate-500 h-1 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Approved Passes</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-extrabold text-emerald-600">{repApproved}</span>
                        <span className="text-[9px] text-emerald-500 font-bold">
                          {repTotal > 0 ? Math.round((repApproved / repTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${repTotal > 0 ? (repApproved / repTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pending Reviews</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-extrabold text-amber-500">{repPending}</span>
                        <span className="text-[9px] text-amber-500 font-bold">
                          {repTotal > 0 ? Math.round((repPending / repTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${repTotal > 0 ? (repPending / repTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Denied passes</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-extrabold text-rose-500">{repRejected}</span>
                        <span className="text-[9px] text-rose-500 font-bold">
                          {repTotal > 0 ? Math.round((repRejected / repTotal) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${repTotal > 0 ? (repRejected / repTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1: Check-in Attendance Circle arc Gasket Widget */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Registry Attendance Rate</h3>
                      <div className="flex items-center justify-center py-6">
                        <div className="relative h-32 w-32 rounded-full border-8 border-slate-105 flex items-center justify-center">
                          <div className="absolute text-center">
                            <span className="text-2xl font-black text-sky-600">{repCheckInRate}%</span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wide block">Checked-In</span>
                          </div>
                          {/* Circle Progress Bar */}
                          <svg className="absolute top-[-8px] left-[-8px] h-32 w-32 transform -rotate-90">
                            <circle
                              className="text-sky-500 font-bold"
                              strokeWidth="8"
                              strokeDasharray={314}
                              strokeDashoffset={314 - (314 * repCheckInRate) / 100}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="52"
                              cx="64"
                              cy="64"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="h-px bg-slate-100 my-4" />
                      <div className="grid grid-cols-2 gap-1 text-center text-[10px]">
                        <div>
                          <span className="text-slate-400 block font-medium uppercase tracking-wider">Filtered Pools</span>
                          <span className="text-sm font-bold text-slate-700">{repTotal}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium uppercase tracking-wider">Checked In Arrivals</span>
                          <span className="text-sm font-bold text-slate-700">{repPresentSum}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Status Proportion Dynamic Grouped Horizontal Meter */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Credentials Admissions Status</h3>
                      <div className="space-y-4 py-2">
                        {/* APPROVED BAR */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Approved Passes</span>
                            <span className="font-mono text-[11px] font-bold text-slate-800">{repApproved} ({repTotal > 0 ? Math.round((repApproved / repTotal) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${repTotal > 0 ? (repApproved / repTotal) * 100 : 0}%` }} />
                          </div>
                        </div>

                        {/* PENDING BAR */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending Reviews</span>
                            <span className="font-mono text-[11px] font-bold text-slate-800">{repPending} ({repTotal > 0 ? Math.round((repPending / repTotal) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${repTotal > 0 ? (repPending / repTotal) * 100 : 0}%` }} />
                          </div>
                        </div>

                        {/* REJECTED BAR */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Denied Delegate Passes</span>
                            <span className="font-mono text-[11px] font-bold text-slate-800">{repRejected} ({repTotal > 0 ? Math.round((repRejected / repTotal) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${repTotal > 0 ? (repRejected / repTotal) * 100 : 0}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="h-px bg-slate-100 my-4" />
                      <p className="text-[10px] text-slate-400 text-center"><span className="font-bold">Security Notice:</span> Accounts flagged as pending will only have viewable agenda access until accreditation is fully validated.</p>
                    </div>

                    {/* Card 3: Geographical City Origin Breakdown */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Origin City Distribution</h3>
                      <div className="space-y-3.5">
                        {['Erbil', 'Sulaymaniyah', 'Duhok', 'Halabja'].map((cName) => {
                          const count = filteredUsersForReports.filter(u => u.city.toLowerCase() === cName.toLowerCase()).length;
                          const percentage = repTotal > 0 ? Math.round((count / repTotal) * 100) : 0;
                          return (
                            <div key={cName} className="text-xs">
                              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                <span>{cName}</span>
                                <span className="font-mono text-slate-900 font-bold">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card 4: Demographics Gender Breakdown Segment */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Demographics Gender segmentation</h3>
                      <div className="space-y-4">
                        {['Male', 'Female'].map((gen) => {
                          const count = filteredUsersForReports.filter(u => u.gender.toLowerCase() === gen.toLowerCase()).length;
                          const percentage = repTotal > 0 ? Math.round((count / repTotal) * 100) : 0;
                          const barColor = gen === 'Male' ? 'bg-sky-500' : 'bg-violet-500';
                          return (
                            <div key={gen} className="text-xs">
                              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                <span className="flex items-center gap-1.5">{gen}</span>
                                <span className="font-mono text-slate-900 font-bold">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 mt-2">
                          Interactive demographic distributions assist the KEF coordinating team in planning seat layouts and custom conference bag packing volumes.
                        </div>
                      </div>
                    </div>

                    {/* Card 5: Meal Sessions Dynamic Indicators */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Catering Seat Allocations</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                            <span>Standard Lunch Packs (Registered Delegates)</span>
                            <span className="font-mono text-[11px] font-bold text-slate-700">{repTotal}</span>
                          </div>
                          <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                            <div className="bg-teal-500 h-2 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                            <span>Expressed Food Allergies / Special Dietary requests</span>
                            {(() => {
                              const specialCount = filteredUsersForReports.filter(u => u.food_allergies && u.food_allergies.toLowerCase() !== 'none' && u.food_allergies.toLowerCase() !== 'no' && u.food_allergies.trim() !== '').length;
                              const specialPercent = repTotal > 0 ? Math.round((specialCount / repTotal) * 100) : 0;
                              return (
                                <>
                                  <span className="font-mono text-[11px] font-bold text-slate-700">{specialCount} ({specialPercent}%)</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            {(() => {
                              const specialCount = filteredUsersForReports.filter(u => u.food_allergies && u.food_allergies.toLowerCase() !== 'none' && u.food_allergies.toLowerCase() !== 'no' && u.food_allergies.trim() !== '').length;
                              const specialPercent = repTotal > 0 ? Math.round((specialCount / repTotal) * 100) : 0;
                              return (
                                <div className="bg-amber-400 h-2 rounded-full animate-fade-in" style={{ width: `${specialPercent}%` }} />
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 6: Invitation Passcode usage efficiency metric */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Promo Invitation Code Efficiency</h3>
                      <div className="space-y-3 font-sans">
                        {codes.slice(0, 4).map((c) => {
                          const capacity = 1; // Limit is single-use now
                          const isUsed = c.status === 'Used' || c.status === 'used';
                          const usagePercent = isUsed ? 100 : 0;
                          return (
                            <div key={c.id} className="text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">{c.code}</span>
                                <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${isUsed ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {isUsed ? 'Used' : 'Unused'}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-1.5 rounded-full ${isUsed ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ width: `${usagePercent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {codes.length === 0 && (
                          <p className="text-[11px] text-slate-400 text-center py-4">No registration promo codes created yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB: FORUM AGENDA */}
            {activeTab === 'agenda' && (
              <div className="space-y-6 text-left animate-fade-in">
                <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800 leading-snug">Kurdistan Education Forum Program schedule</h2>
                    <p className="text-xs text-slate-400">Curate scientific lectures, keynotes and panel locations</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportAgendaCSV}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Export CSV Agenda
                    </button>
                    <button
                      onClick={() => {
                        setEditingSessionId(null);
                        setNewSession({
                          title: '',
                          speaker: '',
                          date: '2026-06-15',
                          start: '09:00',
                          end: '10:00',
                          location: 'Saad Abdullah Palace, Main Hall',
                          desc: '',
                        });
                        setPanelistsInput([]);
                        setTranslationLinkInput('');
                        setShowAddSession(!showAddSession);
                      }}
                      className="px-3.5 py-1.5 bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={15} /> {showAddSession && editingSessionId ? 'Dismiss Form' : 'Schedule Session'}
                    </button>
                  </div>
                </div>

                {showAddSession && (
                  <form onSubmit={handleSaveSession} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-inner space-y-5 text-xs font-semibold">
                    <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-200 pb-2">
                      {editingSessionId ? 'Update KEF Agenda Session' : 'Schedule Forum Activity'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Session Title</label>
                        <input
                          type="text"
                          required
                          value={newSession.title}
                          onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                          placeholder="e.g. Modernizing Pedagogical Quality Assurance"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Translation Link</label>
                        <input
                          type="url"
                          value={translationLinkInput}
                          onChange={(e) => setTranslationLinkInput(e.target.value)}
                          placeholder="https://meet.google.com/abc-kef-2026"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 font-mono text-slate-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Comments Link</label>
                        <input
                          type="url"
                          value={commentsLinkInput}
                          onChange={(e) => setCommentsLinkInput(e.target.value)}
                          placeholder="https://meet.google.com/abc-comments-kef"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 font-mono text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Session Date</label>
                        <input
                          type="date"
                          value={newSession.date}
                          onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Start Time</label>
                        <input
                          type="time"
                          value={newSession.start}
                          onChange={(e) => setNewSession({ ...newSession, start: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">End Time</label>
                        <input
                          type="time"
                          value={newSession.end}
                          onChange={(e) => setNewSession({ ...newSession, end: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Location Hall</label>
                        <input
                          type="text"
                          value={newSession.location}
                          onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                          placeholder="e.g. Saad Abdullah Palace, Hall B"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 block uppercase">Short Synopses</label>
                        <input
                          type="text"
                          value={newSession.desc}
                          onChange={(e) => setNewSession({ ...newSession, desc: e.target.value })}
                          placeholder="Fireside debate on vocational pathways..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-slate-800 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Panelists Section */}
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Speakers and Panelists Profile Cards</h4>
                        <button
                          type="button"
                          onClick={handleAddPanelistInput}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-100 text-sky-700 text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add Speaker Card
                        </button>
                      </div>

                      {panelistsInput.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-3 italic">No specific speakers registered yet. Defaulting to general session keynote.</p>
                      ) : (
                        <div className="space-y-3.5 divide-y divide-slate-100/50">
                          {panelistsInput.map((panelist, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Panelist Full Name</label>
                                <input
                                  type="text"
                                  required
                                  value={panelist.name}
                                  onChange={(e) => handlePanelistFieldChange(index, 'name', e.target.value)}
                                  placeholder="Dr. Alan Noori"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none font-medium text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Position & Org</label>
                                <input
                                  type="text"
                                  required
                                  value={panelist.position}
                                  onChange={(e) => handlePanelistFieldChange(index, 'position', e.target.value)}
                                  placeholder="pedagogical representative, Ministry"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none font-medium text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase">Role In Panel</label>
                                <input
                                  type="text"
                                  required
                                  value={panelist.role}
                                  onChange={(e) => handlePanelistFieldChange(index, 'role', e.target.value)}
                                  placeholder="Moderator / Speaker"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none font-medium text-slate-800"
                                />
                              </div>
                              <div className="flex items-end justify-between gap-2">
                                <div className="space-y-1 w-full">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Avatar / Photo URL</label>
                                  <input
                                    type="text"
                                    value={panelist.picture}
                                    onChange={(e) => handlePanelistFieldChange(index, 'picture', e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none text-[10px] text-slate-500 font-mono"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePanelistInput(index)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 transition shrink-0 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition uppercase cursor-pointer"
                      >
                        {editingSessionId ? 'Save Session Changes' : 'Publish Session'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSession(false);
                          setEditingSessionId(null);
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Agenda card loop layout */}
                <div className="grid grid-cols-1 gap-5">
                  {agenda.map((sess) => (
                    <div key={sess.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                          {sess.session_date} | {sess.start_time} - {sess.end_time}
                        </span>
                        <div className="flex gap-1.5">
                          <span className="text-[10px] bg-slate-100 px-2.5 py-0.5 rounded-full text-slate-700 font-bold border border-slate-200 uppercase font-mono">
                            {sess.location}
                          </span>
                          <button
                            onClick={() => handleEditSessionTrigger(sess)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded border border-amber-200 transition cursor-pointer"
                          >
                            Edit Session
                          </button>
                          <button
                            onClick={() => handleDeleteSession(sess.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded border border-rose-200 transition cursor-pointer"
                          >
                            Delete Session
                          </button>
                        </div>
                      </div>
                      
                      <h4 className="text-base font-extrabold text-slate-800 leading-snug mb-1.5">{sess.session_title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{sess.description}</p>
                      
                      {sess.panelists && sess.panelists.length > 0 && (
                        <div className="border-t border-slate-100 pt-4 mt-4">
                          <button
                            type="button"
                            onClick={() => setExpandedSessions(p => ({ ...p, [sess.id]: !p[sess.id] }))}
                            className="w-full flex justify-between items-center py-2 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl transition cursor-pointer text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-slate-500 group-hover:text-slate-700" />
                              <span className="text-xs font-bold text-slate-700 font-sans">
                                Speakers and Panelists ({sess.panelists.length})
                              </span>
                            </div>
                            {expandedSessions[sess.id] ? (
                              <ChevronUp size={14} className="text-slate-400 group-hover:text-slate-600" />
                            ) : (
                              <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                            )}
                          </button>

                          {expandedSessions[sess.id] && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 pt-2 border-t border-slate-100/30">
                              {sess.panelists.map((panelist, pidx) => (
                                <div key={pidx} className="flex flex-col items-center text-center p-2.5 bg-slate-50/40 hover:bg-slate-50/80 border border-slate-100 rounded-2xl transition shadow-xs">
                                  <img
                                    src={panelist.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'}
                                    alt={panelist.name}
                                    referrerPolicy="no-referrer"
                                    className="w-24 h-24 rounded-2xl object-cover mb-3 shrink-0 border border-slate-200/60"
                                  />
                                  <div className="min-w-0 flex flex-col items-center gap-1">
                                    <div>
                                      <span className="text-xs font-extrabold text-slate-800 block leading-tight">{panelist.name}</span>
                                      <span className="text-[10px] text-slate-500 font-semibold block leading-normal mt-1">{panelist.position}</span>
                                    </div>
                                    <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full w-fit font-mono">
                                      {panelist.role || 'Speaker'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                        <a
                          href={sess.translation_link || 'https://meet.google.com/abc-kef-2026'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          Click me for translation
                        </a>
                        <a
                          href={sess.comments_link || 'https://meet.google.com/abc-comments-kef'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          Click me for comments
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: BULK BADGE COMPILER */}
            {activeTab === 'badges' && (
              <div className="space-y-6 text-left">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Bulk Badge compiler</h2>
                  <p className="text-xs text-slate-400">Preview and print all participants badges directly with matching formatting templates</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
                  <div className="text-xs font-semibold text-slate-600">
                    Total printable badges available: <strong className="text-slate-900">{totalRegistrations}</strong>
                  </div>
                  <button
                    onClick={handleMassPrintAllBadges}
                    className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    <Printer size={15} /> Mass Print All Badges
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {users.filter(u => u.role === 'user').map((u) => (
                    <div key={u.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow transition flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">{u.registration_id}</span>
                        <h4 className="text-xs font-bold text-slate-800 mt-0.5">{u.full_name}</h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{u.organization}</p>
                      </div>
                      <div className="h-px bg-slate-100 my-2.5" />
                      <button
                        onClick={() => setSelectedUserForBadge(u)}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition text-center cursor-pointer"
                      >
                        Compile & Preview Badge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="space-y-6 text-left">
                <div>
                  <h2 className="text-xl font-black text-slate-800">KEF System Settings</h2>
                  <p className="text-xs text-slate-400">Update general forum configurations and manage system state logs</p>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                  {/* General settings table */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">Forum Settings</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {settings.map((s) => (
                        <div key={s.id} className="space-y-1.5 text-xs">
                          <label className="font-bold text-slate-500 uppercase tracking-wide block">{s.setting_name.replace(/_/g, ' ')}</label>
                          <input
                            type="text"
                            value={s.setting_value}
                            onChange={(e) => {
                              const updatedVal = e.target.value;
                              setSettings(prev => prev.map(item => item.id === s.id ? { ...item, setting_value: updatedVal } : item));
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          saveDB.settings(settings);
                          alert("System settings saved and applied successfully across KEF 2026 dashboards!");
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-sm transition cursor-pointer"
                      >
                        Save Configurations
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-4" />

                  {/* Danger zone resetting */}
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-rose-700 uppercase tracking-widest">Database Danger Zone</h4>
                    <p className="text-xs text-rose-600 leading-normal font-medium">
                      Resetting the database purges all registered attendees, recorded attendance check-ins, custom invitation keys, and logs, returning the database back to standard fresh Kurdistan Education Forum seed defaults.
                    </p>
                    <button
                      type="button"
                      onClick={purgeSettingsDB}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs tracking-wider transition cursor-pointer"
                    >
                      Purge & Reset System Database State
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ORGANIZER/STAFF PROFILE CARD */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-6 text-left animate-fade-in">
                <div>
                  <h2 className="text-xl font-black text-slate-800">My Secretariat Profile</h2>
                  <p className="text-xs text-slate-400">Manage and edit your representative credentials in the KEF database</p>
                </div>

                {profileSaved && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-xs rounded-2xl flex items-center gap-2 overflow-hidden">
                    <Check size={16} className="text-emerald-500 shrink-0" />
                    <span>Staff profile updated successfully in database!</span>
                  </div>
                )}

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <form onSubmit={handleUpdateStaffProfile} className="space-y-4">
                    {/* Avatar Selection Option */}
                    <div className="space-y-2">
                      <label className="font-bold text-slate-500 text-xs block">Profile Picture</label>
                      <div className="flex flex-wrap items-center gap-3">
                        {staffProfile.picture ? (
                          <img
                            src={staffProfile.picture}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow"
                            alt="Current staff avatar"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold font-mono">
                            No Image
                          </div>
                        )}
                        
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                            {[
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150',
                              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150',
                              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150',
                              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150',
                              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150'
                            ].map((src, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setStaffProfile({ ...staffProfile, picture: src })}
                                className={`w-9 h-9 rounded-full overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                                  staffProfile.picture === src ? 'border-amber-500 scale-110' : 'border-transparent hover:border-slate-300'
                                }`}
                              >
                                <img src={src} className="w-full h-full object-cover animate-fade-in" alt="" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                          <input
                            type="url"
                            value={staffProfile.picture}
                            onChange={(e) => setStaffProfile({ ...staffProfile, picture: e.target.value })}
                            placeholder="Or paste any custom secure picture URL (https://...)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] text-slate-700 font-mono focus:outline-none focus:border-slate-800 focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-500 block">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={staffProfile.fullName}
                          onChange={(e) => setStaffProfile({ ...staffProfile, fullName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-505 block">Email Account *</label>
                        <input
                          type="email"
                          required
                          value={staffProfile.email}
                          onChange={(e) => setStaffProfile({ ...staffProfile, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-505 block">Username (Handle Account)</label>
                        <input
                          type="text"
                          value={staffProfile.username}
                          onChange={(e) => setStaffProfile({ ...staffProfile, username: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-505 block">Password (Leave empty to keep current)</label>
                        <input
                          type="password"
                          value={staffProfile.password}
                          onChange={(e) => setStaffProfile({ ...staffProfile, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-500 block">Organization *</label>
                        <input
                          type="text"
                          required
                          value={staffProfile.organization}
                          onChange={(e) => setStaffProfile({ ...staffProfile, organization: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-500 block">Position/Title Description</label>
                        <input
                          type="text"
                          value={staffProfile.position}
                          onChange={(e) => setStaffProfile({ ...staffProfile, position: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-500 block">Phone Contact</label>
                        <input
                          type="tel"
                          value={staffProfile.phone}
                          onChange={(e) => setStaffProfile({ ...staffProfile, phone: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="font-bold text-slate-500 block">City</label>
                        <input
                          type="text"
                          value={staffProfile.city}
                          onChange={(e) => setStaffProfile({ ...staffProfile, city: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckSquare size={14} /> Save Secretariat Credentials
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
