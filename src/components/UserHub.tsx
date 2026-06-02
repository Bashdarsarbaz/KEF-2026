/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Calendar, Award, Info, Sliders, MapPin, Wifi, Hotel, CalendarDays, KeyRound, Save, Check, LogOut, ExternalLink, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { SystemUser, AgendaSession } from '../types';
import { getDB, saveDB } from '../data/mockDatabase';
import BadgeRenderer from './BadgeRenderer';

interface UserHubProps {
  user: SystemUser;
  onLogout: () => void;
  lang: 'en' | 'ku';
}

export default function UserHub({ user, onLogout, lang }: UserHubProps) {
  const [dbUser, setDbUser] = useState<SystemUser>(user);
  const [activeTab, setActiveTab] = useState<string>('agenda');
  
  // Profile update fields
  const [profileData, setProfileData] = useState({
    fullName: user.full_name,
    email: user.email,
    username: user.username || user.email.split('@')[0],
    password: '',
    picture: user.picture || '',
    organization: user.organization,
    position: user.position,
    phone: user.phone,
    foodAllergies: user.food_allergies,
    city: user.city,
  });

  const [hasSaved, setHasSaved] = useState<boolean>(false);
  const [agenda, setAgenda] = useState<AgendaSession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  const refreshUserStatus = () => {
    const allUsers = getDB.users();
    const freshUser = allUsers.find(u => u.id === user.id);
    if (freshUser) {
      setDbUser(freshUser);
      saveDB.setCurrentUser(freshUser);
      setProfileData({
        fullName: freshUser.full_name,
        email: freshUser.email,
        username: freshUser.username || freshUser.email.split('@')[0],
        password: '',
        picture: freshUser.picture || '',
        organization: freshUser.organization,
        position: freshUser.position,
        phone: freshUser.phone,
        foodAllergies: freshUser.food_allergies,
        city: freshUser.city,
      });
    }
  };

  useEffect(() => {
    refreshUserStatus();
    // Load local schedule options
    setAgenda(getDB.agenda());
  }, [user.id]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSaved(false);

    const users = getDB.users();
    const updatedUsers = users.map((u) => {
      if (u.id === user.id) {
        return {
          ...u,
          full_name: profileData.fullName,
          email: profileData.email,
          username: profileData.username,
          password_hash: profileData.password ? profileData.password : u.password_hash,
          picture: profileData.picture,
          organization: profileData.organization,
          position: profileData.position,
          phone: profileData.phone,
          food_allergies: profileData.foodAllergies,
          city: profileData.city,
          // Re-generate QR string payload if critical name changes
          qr_code_data: `${u.registration_id}|${profileData.fullName}|${profileData.email}`,
        } as SystemUser;
      }
      return u;
    });

    saveDB.users(updatedUsers);
    
    // Save updated session user
    const updatedMe = updatedUsers.find((u) => u.id === user.id);
    if (updatedMe) {
      saveDB.setCurrentUser(updatedMe);
      setDbUser(updatedMe);
    }

    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);
  };

  if (dbUser.status !== 'Approved') {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 bg-slate-50">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <KeyRound size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">Awaiting Accreditation Approval</h1>
            <p className="text-xs text-slate-400 font-mono">Status: <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-bold">{dbUser.status || 'Pending Review'}</span></p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            Welcome to the <strong>Kurdistan Education Forum (KEF) 2026</strong>. 
            To maintain security protocols at the Saad Abdullah Palace in Erbil, all registered delegate accounts must be approved by the Organizing Secretariat before digital pass badges can be activated.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Delegate Name</span>
                <span className="text-slate-800 font-extrabold">{dbUser.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Registration Pass ID</span>
                <span className="text-slate-800 font-mono font-bold tracking-wider">{dbUser.registration_id}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200/50 pt-2">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Organization</span>
                <span className="text-slate-700 font-semibold">{dbUser.organization}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Position</span>
                <span className="text-slate-700 font-semibold">{dbUser.position}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={refreshUserStatus}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              Check Live Status
            </button>
            <button
              onClick={onLogout}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-extrabold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>

          <p className="text-[10px] text-slate-400">
            Please contact organizers at <strong>accreditation@kef.edu</strong> if your registration requires urgent expedited routing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-80px)]">
      {/* Sidebar user panel links */}
      <nav className="lg:col-span-3 xl:col-span-2 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="p-2 flex items-center gap-3 border-b border-slate-800/80 pb-5">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-900 text-xl shrink-0">K</div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight uppercase tracking-wider">KEF 2026</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-mono">My Portal</p>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'agenda' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar size={15} /> <span>Forum Program Schedule</span>
              </div>
              {activeTab === 'agenda' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
            <button
              onClick={() => setActiveTab('badge')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'badge' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award size={15} className="text-amber-400" /> <span>My QR Badge Ticket</span>
              </div>
              {activeTab === 'badge' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User size={15} className="text-emerald-400" /> <span>My Conference Profile</span>
              </div>
              {activeTab === 'profile' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                activeTab === 'info' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Info size={15} /> <span>Venue Information</span>
              </div>
              {activeTab === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {dbUser.picture ? (
                <img
                  src={dbUser.picture}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {dbUser.full_name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden bg-transparent">
                <p className="text-white text-xs font-semibold truncate leading-none">{dbUser.full_name}</p>
                <p className="text-slate-500 text-[10px] mt-1 truncate">{dbUser.registration_id}</p>
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

      {/* Main Panel Content screen */}
      <main className="lg:col-span-9 xl:col-span-10 p-6 space-y-6">
        
        {/* TAB: PROFILE CARD */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-slate-800">My Conference Profile</h2>
              <p className="text-xs text-slate-400">Manage and edit your credential details in the forum database</p>
            </div>

            {hasSaved && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold text-xs rounded-2xl flex items-center gap-2">
                <Check size={16} className="text-emerald-500 shrink-0" />
                <span>Profile updated successfully in Mock Database!</span>
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Avatar Selection Option */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-500 text-xs block">Profile Picture</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {profileData.picture ? (
                      <img
                        src={profileData.picture}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow"
                        alt="Current Profile avatar"
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
                            onClick={() => setProfileData({ ...profileData, picture: src })}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                              profileData.picture === src ? 'border-amber-500 scale-110' : 'border-transparent hover:border-slate-300'
                            }`}
                          >
                            <img src={src} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                      <input
                        type="url"
                        value={profileData.picture}
                        onChange={(e) => setProfileData({ ...profileData, picture: e.target.value })}
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
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-505 block">Email Contact Address *</label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-500 block">Username (Handle Account)</label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-505 block">Password (Leave empty to keep current)</label>
                    <input
                      type="password"
                      value={profileData.password}
                      onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
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
                      value={profileData.organization}
                      onChange={(e) => setProfileData({ ...profileData, organization: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-500 block">Position</label>
                    <input
                      type="text"
                      value={profileData.position}
                      onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-500 block">Phone Contact *</label>
                    <input
                      type="tel"
                      required
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-500 block">City *</label>
                    <input
                      type="text"
                      required
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-slate-500 block">Allergies/Dietary requests</label>
                  <input
                    type="text"
                    value={profileData.foodAllergies || ''}
                    onChange={(e) => setProfileData({ ...profileData, foodAllergies: e.target.value })}
                    placeholder="None, Gluten-free, Nuts, Vegetarian..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save size={14} /> Save Profile Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: MY PASS CREDbadge */}
        {activeTab === 'badge' && (
          <div className="space-y-4">
            <div className="text-left">
              <h2 className="text-xl font-black text-slate-800">My KEF Entrance Ticket</h2>
              <p className="text-xs text-slate-400">Download, print or display your credentials badge up to the scanner desks</p>
            </div>
            {/* Embed high fidelity badge layout */}
            <BadgeRenderer user={dbUser} onUserUpdate={refreshUserStatus} />
          </div>
        )}

        {/* TAB: AGENDA VIEW */}
        {activeTab === 'agenda' && (
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-slate-800">Forum Program Schedule</h2>
              <p className="text-xs text-slate-400">Browse planned keynote briefs, panels and locations</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {agenda.map((sess) => (
                <div key={sess.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow transition">
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                      {sess.session_date} | {sess.start_time} - {sess.end_time}
                    </span>
                    <span className="text-[10px] bg-slate-50 px-2 rounded-full text-slate-700 font-bold border border-slate-100 uppercase font-mono">
                      {sess.location}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-800 leading-snug mb-1">{sess.session_title}</h4>
                  <p className="text-xs text-slate-400 mb-4">{sess.description}</p>
                  
                  {/* Event actions links rows */}
                  <div className="flex flex-wrap gap-2 mb-4 pt-1.5">
                    <a
                      href={sess.translation_link || 'https://meet.google.com/abc-kef-2026'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-55/60 hover:bg-sky-100 text-sky-700 hover:text-sky-800 rounded-xl text-[10px] font-extrabold tracking-wide uppercase transition shadow-sm cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      Click me for translation
                    </a>
                    <a
                      href={sess.comments_link || 'https://meet.google.com/abc-comments-kef'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 hover:border-slate-350 text-slate-600 hover:text-slate-700 rounded-xl text-[10px] font-extrabold tracking-wide uppercase transition cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      Click me for comments
                    </a>
                  </div>
                  
                  {sess.panelists && sess.panelists.length > 0 && (
                    <div className="border-t border-slate-100 pt-4 mt-3">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EVENT INFO */}
        {activeTab === 'info' && (
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div>
              <h2 className="text-xl font-black text-slate-800">Saad Abdullah Palace Conference Information</h2>
              <p className="text-xs text-slate-400">Frequently referenced information guides for international and local guests</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                <MapPin className="text-sky-500" size={20} />
                <h4 className="text-xs font-bold text-slate-800 uppercase">Venue Location</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Saad Abdullah Palace, 100 Meter Rd, Erbil, Kurdistan Region, Iraq
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                <Wifi className="text-emerald-500" size={20} />
                <h4 className="text-xs font-bold text-slate-800 uppercase">Complimentary Wi-Fi</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Network SSD: <strong>KEF_2026_FREE</strong><br />
                  Passkey: <span className="font-mono text-[11px] font-bold text-slate-700">KurdistanEdu2026</span>
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2">
                <Hotel className="text-amber-500" size={20} />
                <h4 className="text-xs font-bold text-slate-800 uppercase">Partner Lodging</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rotana Erbil & Divan Erbil offers direct shuttle runs to and from the forum palace hourly.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
