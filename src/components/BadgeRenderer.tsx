/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { SystemUser } from '../types';
import { Printer, Download, UserCheck, ShieldAlert, Award } from 'lucide-react';
import { getDB, saveDB } from '../data/mockDatabase';

interface BadgeRendererProps {
  user: SystemUser;
  onClose?: () => void;
  onUserUpdate?: (updatedUser: SystemUser) => void;
}

export default function BadgeRenderer({ user, onClose, onUserUpdate }: BadgeRendererProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loggedInUser = getDB.currentUser();
  const isAdmin = loggedInUser?.role === 'admin';

  useEffect(() => {
    let active = true;
    const generateQR = async () => {
      try {
        setIsLoading(true);
        // Standard high quality QR code containing Registration ID | Name | Email
        const payload = `${user.registration_id}|${user.full_name}|${user.email}`;
        const url = await QRCode.toDataURL(payload, {
          margin: 1,
          width: 256,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        });
        if (active) {
          setQrCodeUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to generate offline QR code: ', err);
        if (active) {
          setIsLoading(false);
        }
      }
    };
    generateQR();
    return () => {
      active = false;
    };
  }, [user]);

  // Determine badge colors based on registration category or role
  const getBadgeStyles = () => {
    const category = user.badge_category;
    if (category) {
      if (category === 'Administration') {
        return {
          bg: 'from-rose-50 to-rose-100',
          accent: 'bg-rose-600',
          text: 'text-rose-800',
          border: 'border-rose-400',
          label: 'ADMINISTRATION',
          shadow: 'shadow-rose-100',
        };
      } else if (category === 'Organizer') {
        return {
          bg: 'from-amber-50 to-amber-100',
          accent: 'bg-amber-600',
          text: 'text-amber-800',
          border: 'border-amber-400',
          label: 'ORGANIZER',
          shadow: 'shadow-amber-100',
        };
      } else if (category === 'Academic Staff') {
        return {
          bg: 'from-sky-50 to-sky-100',
          accent: 'bg-sky-600',
          text: 'text-sky-800',
          border: 'border-sky-400',
          label: 'ACADEMIC STAFF',
          shadow: 'shadow-sky-100',
        };
      } else if (category === 'VIP Guest') {
        return {
          bg: 'from-purple-50 to-purple-100',
          accent: 'bg-purple-600',
          text: 'text-purple-800',
          border: 'border-purple-400',
          label: 'VIP GUEST',
          shadow: 'shadow-purple-100',
        };
      } else { // 'Attendee'
        return {
          bg: 'from-emerald-50 to-emerald-100',
          accent: 'bg-emerald-600',
          text: 'text-emerald-800',
          border: 'border-emerald-400',
          label: 'ATTENDEE',
          shadow: 'shadow-emerald-100',
        };
      }
    }

    if (user.role === 'admin') {
      return {
        bg: 'from-rose-50 to-rose-100',
        accent: 'bg-rose-600',
        text: 'text-rose-800',
        border: 'border-rose-400',
        label: 'ADMINISTRATION',
        shadow: 'shadow-rose-100',
      };
    }

    const emailUpper = user.email.toUpperCase();
    if (emailUpper.includes('EDU') || user.position.includes('Professor') || user.position.includes('Dean') || user.position.includes('Doctor') || user.position.includes('Dr.')) {
      return {
        bg: 'from-sky-50 to-sky-100',
        accent: 'bg-sky-600',
        text: 'text-sky-800',
        border: 'border-sky-400',
        label: 'ACADEMIC STAFF',
        shadow: 'shadow-sky-100',
      };
    } else {
      return {
        bg: 'from-emerald-50 to-emerald-100',
        accent: 'bg-emerald-600',
        text: 'text-emerald-800',
        border: 'border-emerald-400',
        label: 'ATTENDEE',
        shadow: 'shadow-emerald-100',
      };
    }
  };

  const handleCategoryChange = (category: 'Administration' | 'Organizer' | 'Academic Staff' | 'Attendee' | 'VIP Guest') => {
    const allUsers = getDB.users();
    const updatedUsers = allUsers.map(u => 
      u.id === user.id ? { ...u, badge_category: category } : u
    );
    saveDB.users(updatedUsers);
    
    // Check if current logged in user was modified
    const currentUser = JSON.parse(localStorage.getItem('kef_session_user') || 'null') as SystemUser | null;
    if (currentUser && currentUser.id === user.id) {
      const updatedLoggedInUser = { ...currentUser, badge_category: category };
      saveDB.setCurrentUser(updatedLoggedInUser);
    }

    if (onUserUpdate) {
      const freshUser = updatedUsers.find(u => u.id === user.id);
      if (freshUser) {
        onUserUpdate(freshUser);
      }
    }
  };

  const currentCategory = user.badge_category || (
    user.role === 'admin' ? 'Administration' :
    (user.email.toUpperCase().includes('EDU') || user.position.includes('Professor') || user.position.includes('Dean') || user.position.includes('Doctor') || user.position.includes('Dr.')) ? 'Academic Staff' :
    'Attendee'
  );

  const badgeTheme = getBadgeStyles();

  const triggerDirectPrint = () => {
    // Standard approach is to print the specific card element
    const printContent = document.getElementById('physical-badge-card')?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print KEF Badge - ${user.full_name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  @page { margin: 0; size: 100mm 150mm; }
                  body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body class="p-8 flex justify-center items-center h-screen bg-white">
              <div class="w-[90mm] h-[140mm] border-2 border-slate-300 rounded-2xl overflow-hidden p-6 flex flex-col justify-between shadow-none relative" style="font-family: 'Inter', sans-serif;">
                <div class="text-center flex flex-col items-center justify-center">
                  <img src="https://static.wixstatic.com/media/446272_596df79696e14e439527fac871ef2fce~mv2.jpg" class="w-16 h-16 object-contain rounded-xl mb-1.5" alt="KEF Logo" />
                  <div class="text-slate-400 text-[10px] tracking-wider font-semibold uppercase">Kurdistan Education Forum</div>
                  <div class="text-slate-800 text-lg font-bold leading-tight">KEF 2026</div>
                  <div class="h-1.5 w-full mt-2 rounded ${badgeTheme.accent}"></div>
                </div>

                <div class="text-center my-4 py-2 border-y border-dashed border-slate-200">
                  <div class="text-xs font-semibold ${badgeTheme.text} px-2.5 py-1 rounded-full ${badgeTheme.bg} inline-block mb-3">
                    ${badgeTheme.label}
                  </div>
                  <h1 class="text-xl font-extrabold text-slate-800 tracking-tight leading-snug mb-1">${user.full_name}</h1>
                  <p class="text-xs text-slate-600 font-medium px-4 line-clamp-2">${user.position}</p>
                  <p class="text-slate-500 text-[10px] font-semibold mt-1 uppercase tracking-wide">${user.organization}</p>
                </div>

                <div class="flex flex-col items-center justify-center">
                  <img src="${qrCodeUrl}" class="w-28 h-28 object-contain border border-slate-100 rounded p-1 mb-2" alt="QR Code" />
                  <div class="text-mono text-center">
                    <span class="text-[9px] text-slate-400 uppercase tracking-widest block">Registration Pass ID</span>
                    <span class="text-sm font-bold text-slate-700 font-mono tracking-wider">${user.registration_id}</span>
                  </div>
                </div>

                <div class="text-center border-t border-slate-100 pt-2 text-[8px] text-slate-400 font-medium uppercase tracking-wide">
                  Saad Abdullah Palace, Erbil · KRG
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 max-w-4xl mx-auto align-stretch">
      {/* Visual representation card */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Live Preview Badge</h3>

        {/* The Printable Card Box */}
        <div
          id="physical-badge-card"
          className={`w-72 h-[110mm] bg-gradient-to-b ${badgeTheme.bg} border-2 ${badgeTheme.border} rounded-2xl p-6 flex flex-col justify-between shadow ${badgeTheme.shadow} transition-all duration-300 relative overflow-hidden`}
        >
          {/* Top Strap slot for lanyards */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-slate-800/10 rounded-full flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-800/30 rounded-full"></div>
          </div>

          <div className="text-center pt-2 flex flex-col items-center justify-center">
            <img src="https://static.wixstatic.com/media/446272_596df79696e14e439527fac871ef2fce~mv2.jpg" className="w-16 h-16 object-contain rounded-xl mb-1.5" alt="KEF Logo" />
            <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase block">Kurdistan Education Forum</span>
            <span className="text-xl font-black text-slate-800 tracking-tight font-sans">KEF 2026</span>
            <div className={`h-1.5 w-full mt-2.5 rounded ${badgeTheme.accent}`}></div>
          </div>

          <div className="text-center my-3 py-3 border-y border-dashed border-slate-200">
            <span className={`text-[10px] font-bold ${badgeTheme.text} px-3 py-1 rounded-full ${badgeTheme.accent}/10 inline-block mb-3`}>
              {badgeTheme.label}
            </span>
            <h1 className="text-lg font-extrabold text-slate-800 tracking-tight leading-tight px-1">{user.full_name}</h1>
            <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug line-clamp-1">{user.position}</p>
            <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider line-clamp-1">{user.organization}</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            {isLoading ? (
              <div className="w-28 h-28 bg-white/50 border border-slate-150 rounded-lg flex items-center justify-center mb-1">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
              </div>
            ) : (
              <img
                src={qrCodeUrl}
                className="w-28 h-28 object-contain border border-slate-200 rounded-lg p-1 bg-white mb-1 shadow-sm"
                alt="Badge QR Code"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="text-center mt-1">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest block leading-none">Registration Pass ID</span>
              <span className="text-xs font-bold text-slate-800 font-mono tracking-widest">{user.registration_id}</span>
            </div>
          </div>

          <div className="text-center text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2 border-t border-slate-200/50 pt-2">
            Saad Abdullah Palace, Erbil · KRG
          </div>
        </div>
      </div>

      {/* Side Action panel */}
      <div className="w-full lg:w-72 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h4 className="text-base font-bold text-slate-800 mb-2">Participant Information</h4>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            This card is dynamically linked to their unique KEF registration profile containing the cryptographic verification string printed below.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">Allergies/Dietary</span>
              <span className="text-xs font-semibold text-slate-700">{user.food_allergies || 'None Specified'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium block">Phone contact</span>
              <span className="text-xs font-semibold text-slate-700 font-mono">{user.phone}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 tracking-wider font-medium block">Location</span>
              <span className="text-xs font-semibold text-slate-700">{user.city}, {user.country}</span>
            </div>

            {isAdmin && (
              <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100 text-left">
                <span className="text-[10px] text-blue-600 uppercase tracking-wider font-extrabold block mb-1.5 flex items-center gap-1">
                  <Award size={12} className="text-blue-500" /> Choose Badge Role / Title
                </span>
                <select
                  value={currentCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="Administration">Administration</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Academic Staff">Academic Staff</option>
                  <option value="Attendee">Attendee</option>
                  <option value="VIP Guest">VIP Guest</option>
                </select>
                <span className="text-[8px] text-slate-400 mt-1 block">Configures badge colors & system-wide identity.</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={triggerDirectPrint}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm hover:shadow cursor-pointer"
          >
            <Printer size={15} /> Print Physical Badge
          </button>
          
          <a
            href={qrCodeUrl}
            download={`KEF-Pass-${user.registration_id}.png`}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition shadow-sm text-center"
          >
            <Download size={15} /> Download QR Code Image
          </a>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-medium text-center transition pt-2 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
