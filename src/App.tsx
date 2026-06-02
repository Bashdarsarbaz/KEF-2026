/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Grid,
  FileCode,
  Globe,
  PlusCircle,
  Key,
  ShieldAlert,
  CalendarDays,
  Sparkles,
  Search,
  BookOpen,
  Settings,
  X,
  LogIn,
  LogOut,
  AppWindow,
  FileCheck
} from 'lucide-react';
import { SystemUser } from './types';
import { getDB, saveDB } from './data/mockDatabase';
import RegistrationFlow from './components/RegistrationFlow';
import AdminHub from './components/AdminHub';
import UserHub from './components/UserHub';
import LoginPage from './components/LoginPage';

export default function App() {
  const [sessionUser, setSessionUser] = useState<SystemUser | null>(null);

  // Initial Seed check
  useEffect(() => {
    const me = getDB.currentUser();
    setSessionUser(me);
  }, []);

  const handleUserRegistrationCompleted = (newUser: SystemUser) => {
    // Automatically log into active workspace session for newly registered delegates
    saveDB.setCurrentUser(newUser);
    setSessionUser(newUser);
  };

  const handleLogout = () => {
    saveDB.setCurrentUser(null);
    setSessionUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Top Universal Branding Header navbar */}
      {sessionUser && (
        <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo element representing KEF badge */}
            <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm p-1 overflow-hidden">
              <img src="https://static.wixstatic.com/media/446272_596df79696e14e439527fac871ef2fce~mv2.jpg" className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div>
              <h1 className="text-slate-800 font-black text-base leading-tight uppercase tracking-wider flex items-center gap-2">
                KEF 2026
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                  System Live
                </span>
              </h1>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Kurdistan Education Forum · Erbil, KRG
              </span>
            </div>
          </div>

          {/* Action controllers */}
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 font-sans hidden md:inline">
                Active: <strong className="text-slate-800">{sessionUser.full_name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Orchestration Panels */}
      <main className="flex-grow bg-[#fafbfc]">
        <div className="animate-fade-in">
          {sessionUser ? (
            sessionUser.role === 'admin' || sessionUser.role === 'organizer' ? (
              <AdminHub currentUser={sessionUser} onLogout={handleLogout} lang="en" scannerAdmin={sessionUser.full_name} />
            ) : (
              <UserHub user={sessionUser} onLogout={handleLogout} lang="en" />
            )
          ) : (
            <LoginPage onLoginSuccess={handleUserRegistrationCompleted} />
          )}
        </div>
      </main>

      {/* Universal Footer section */}
      <footer className="no-print bg-white border-t border-slate-100 py-6 px-6 text-center text-[10px] text-slate-400 font-medium">
        <p className="tracking-wide text-center">
          Kurdistan Education Forum (KEF) © 2026 · Designed for Large-Scale Educational Conferences
        </p>
        <p className="text-slate-300 font-mono mt-1 text-[9px] uppercase tracking-widest text-center">
          Secure Multi-step Registry Desk Protocol · Port 3000 Ingress Verification
        </p>
      </footer>
    </div>
  );
}
