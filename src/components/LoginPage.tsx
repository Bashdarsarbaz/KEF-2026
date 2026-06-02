/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbOperations, getDB, saveDB } from '../data/mockDatabase';
import { SystemUser } from '../types';
import { LogIn, Key, ShieldAlert, Award, FileCheck, Mail, ArrowLeft, CheckCircle2, UserCheck, Globe, HelpCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: SystemUser) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [step, setStep] = useState<'login' | 'ask_code' | 'register' | 'email_received'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Code validation state
  const [invitationCode, setInvitationCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Registration data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    organization: '',
    position: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    foodAllergies: '',
    country: 'Iraq',
    city: '',
  });
  const [regError, setRegError] = useState('');
  const [newlyRegisteredUser, setNewlyRegisteredUser] = useState<SystemUser | null>(null);

  // Sign in handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const inputEmail = loginEmail.trim().toLowerCase();
    const inputPassword = loginPassword.trim();

    if (!inputEmail || !inputPassword) {
      setLoginError('Please enter both your email/username and password');
      return;
    }

    const allUsers = getDB.users();

    // Check specific admin credentials first
    if (inputEmail === 'bashdarsarbazmawlud' || inputEmail === 'bashdarsarbazmawlud@gmail.com') {
      if (inputPassword !== 'Parisiiep2011@@@@@') {
        setLoginError('Invalid password. Please try again.');
        return;
      }
      const adminUser = allUsers.find(u => u.email.trim().toLowerCase() === 'bashdarsarbazmawlud@gmail.com');
      if (adminUser) {
        onLoginSuccess(adminUser);
        return;
      }
    }

    // General fallback
    const matched = allUsers.find(
      (u) => u.email.trim().toLowerCase() === inputEmail
    );

    if (matched) {
      onLoginSuccess(matched);
    } else {
      setLoginError('Invalid credentials. Check your details or contact KEF Organizer.');
    }
  };

  // Code verification handler
  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');

    if (!invitationCode.trim()) {
      setCodeError('Invitation passcode is required');
      return;
    }

    const validation = dbOperations.validateInvitationCode(invitationCode);
    if (validation.success) {
      // Set email if invitation code matches pre-defined category
      setStep('register');
    } else {
      setCodeError(validation.error || 'The entered invitation pass code is invalid.');
    }
  };

  // Final Registration submit
  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!formData.fullName || !formData.email || !formData.password || !formData.organization || !formData.phone || !formData.city) {
      setRegError('Please supply all required fields marked with an asterisk (*)');
      return;
    }

    // Email unique check
    const isTaken = getDB.users().some(u => u.email.trim().toLowerCase() === formData.email.trim().toLowerCase());
    if (isTaken) {
      setRegError('This email address is already registered in the KEF system');
      return;
    }

    try {
      const userResult = dbOperations.registerUser({
        full_name: formData.fullName,
        email: formData.email,
        password_hash: '$2y$10$hashed_simulated_password_hash',
        organization: formData.organization,
        position: formData.position || 'Delegate / Panelist Guest',
        phone: formData.phone,
        gender: formData.gender,
        food_allergies: formData.foodAllergies || 'None',
        country: formData.country,
        city: formData.city,
        role: 'user',
      }, invitationCode);

      setNewlyRegisteredUser(userResult);
      setStep('email_received');
    } catch (err: any) {
      setRegError(err.message || 'An error occurred during registration. Please check inputs.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step === 'login' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
            {/* Centered KEF logo frame - Larger branding style */}
            <div className="w-36 h-36 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 overflow-hidden p-2.5 shadow-md">
              <img 
                src="https://static.wixstatic.com/media/446272_596df79696e14e439527fac871ef2fce~mv2.jpg" 
                className="w-full h-full object-contain rounded-xl" 
                alt="KEF Logo" 
              />
            </div>

            {/* KEF name below the logo */}
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Kurdistan Education Forum</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">Forum Portal LogIn</p>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-semibold my-4 text-left leading-relaxed">
                <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <p>{loginError}</p>
              </div>
            )}

            {/* Username (Email) and Password fields below */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-6 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Username (Email address)</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alan.noori@kef.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm hover:shadow mt-2 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn size={14} /> <span>Login</span>
              </button>
            </form>

            <div className="h-px bg-slate-100 my-6" />

            {/* Registration button triggers code challenge */}
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Do you have an invitation code as a delegate?</p>
              <button
                onClick={() => {
                  setStep('ask_code');
                  setCodeError('');
                  setInvitationCode('');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-extrabold text-xs uppercase tracking-wider transition shadow-xs hover:shadow-sm cursor-pointer"
              >
                Register & Request Badge
              </button>
            </div>

            {/* Demo box removed for production deployment */}
          </div>
        )}

        {step === 'ask_code' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
                <Key size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Enter Your Invitation Passcode</h3>
              <p className="text-xs text-slate-400 mt-1">Please insert the VIP or Delegate code shared by the KEF organizers</p>
            </div>

            {codeError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-semibold mb-4 leading-relaxed">
                <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <p>{codeError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Access Pass Code</label>
                <input
                  type="text"
                  required
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  placeholder="e.g., KEF2026-VIP or KEF2026-GUEST"
                  className="w-full text-center tracking-widest bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 focus:bg-white font-bold rounded-xl px-4 py-3 text-sm focus:outline-none transition uppercase"
                />
                <span className="text-[10px] text-slate-400 text-center block mt-1">
                  Active Demo Codes: <strong className="font-mono text-slate-600">KEF2026-VIP</strong> or <strong className="font-mono text-slate-600">KEF2026-GUEST</strong>
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Verify Access
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'register' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setStep('ask_code')}
                className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft size={13} /> Edit Code
              </button>
              <span className="text-[10px] bg-emerald-50 px-2.5 py-1 rounded-full text-emerald-700 font-bold border border-emerald-100 uppercase tracking-wider">
                Key verified: {invitationCode.toUpperCase()}
              </span>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Complete KEF Registry Form</h3>
              <p className="text-xs text-slate-400 mt-1">Your credentials will generate your security badge token</p>
            </div>

            {regError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-semibold mb-4 leading-relaxed">
                <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <p>{regError}</p>
              </div>
            )}

            <form onSubmit={handleRegistrationSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Alan Noori"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@university.edu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create your portal password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Salahaddin University"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Academic Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g. Assistant Professor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Contacts *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+964 750 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Food allergies / Dietary restrictions</label>
                <input
                  type="text"
                  value={formData.foodAllergies}
                  onChange={(e) => setFormData({ ...formData, foodAllergies: e.target.value })}
                  placeholder="e.g. None specified, Gluten-free, Nuts..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Erbil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('ask_code')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider transition cursor-pointer text-center"
                >
                  Submit Form
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'email_received' && newlyRegisteredUser && (
          <div className="bg-[#f0f4f8] border border-slate-300 rounded-2xl p-6 shadow-xl relative overflow-hidden ring-1 ring-slate-400/20 max-w-2xl mx-auto">
            {/* Top Mail Header banner mimicking email application */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                <span className="ml-2 font-mono">📬 Incoming Organizer Mail Envelope</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded border border-amber-500/20 uppercase font-black">Email Opened</span>
            </div>

            {/* Simulated Email Envelope */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-4 space-y-1.5 text-xs text-slate-600">
                <p><strong>From:</strong> KEF 2026 Organizing Secretariat &lt;<span className="text-slate-500 font-mono">organizers@kef.edu</span>&gt;</p>
                <p><strong>To:</strong> &lt;<span className="text-slate-500 font-mono">{newlyRegisteredUser.email}</span>&gt;</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-slate-800 text-sm mt-2"><strong>Subject:</strong> Welcome to KEF 2026: Registration ID & Forum Information</p>
              </div>

              {/* Email Content */}
              <div className="py-4 text-slate-700 leading-relaxed text-xs space-y-4 font-sans">
                {/* Centered KEF Logo inside email body */}
                <div className="text-center pb-4 border-b border-slate-100 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 p-1 flex items-center justify-center mb-2">
                    <img src="https://static.wixstatic.com/media/446272_596df79696e14e439527fac871ef2fce~mv2.jpg" className="w-full h-full object-contain rounded-lg" alt="KEF Logo" />
                  </div>
                  <h1 className="text-slate-800 font-black tracking-tight text-base">KURDISTAN EDUCATION FORUM 2026</h1>
                  <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">KRG Saad Abdullah Palace, Erbil</p>
                </div>

                <p className="text-sm font-semibold text-slate-800">Dear {newlyRegisteredUser.full_name},</p>
                
                <p>
                  Thank you for successfully applying to attend the <strong>Kurdistan Education Forum (KEF) 2026</strong>. We are pleased to inform you that your registration form invitation details have been received and successfully registered.
                </p>

                <p>
                  Our administrative committee is currently reviewing your registration seat. Below are your security pass ID details:
                </p>

                {/* Profile review card inside email */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">REGISTRATION CODE</span>
                      <strong className="text-slate-800 text-sm font-mono tracking-wider">{newlyRegisteredUser.registration_id}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">APPLICATION STATUS</span>
                      <strong className="text-amber-600 uppercase font-black tracking-wide text-[11px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending Review
                      </strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-2.5">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold font-sans">ORGANIZATION</span>
                      <span className="text-slate-700 text-xs font-semibold">{newlyRegisteredUser.organization}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold font-sans">FORUM SESSIONS</span>
                      <span className="text-slate-700 text-xs font-semibold">June 15 - June 17, 2026</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800">Important Forum Information:</h4>
                  <ul className="list-disc pl-5 space-y-1 select-none text-slate-600">
                    <li><strong>Venue:</strong> Saad Abdullah Palace, Erbil, Kurdistan Region, Iraq.</li>
                    <li><strong>Access:</strong> Please present your digital or printable QR Badge Ticket at the registration desk upon entrance to claim your accreditation neckstrap and seat.</li>
                    <li><strong>Modern Languages:</strong> The official program, live translation channels, and session details are available through your participant portal.</li>
                  </ul>
                </div>

                <p className="italic text-[11px] border-t border-slate-100 pt-3 text-slate-400 text-center">
                  This is an automatic notification generated securely on behalf of the KEF 2026 Organizing Secretariat. No response is requested.
                </p>
              </div>

              {/* Claim / Proceed block */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#fafbfc] -mx-6 -mb-6 p-6 rounded-b-xl border-t border-slate-200">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 size={16} className="text-emerald-500 animate-bounce" />
                  <span>Check inbox confirmation active!</span>
                </div>
                <button
                  onClick={() => onLoginSuccess(newlyRegisteredUser)}
                  className="w-full sm:w-auto py-2.5 px-6 bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer text-center ring-2 ring-slate-800 ring-offset-2 shrink-0"
                >
                  Enter Portal & View My Badge
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
