/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbOperations } from '../data/mockDatabase';
import { UserPlus, ShieldAlert, CheckCircle2, Copy, FileCheck, ArrowLeft, Globe } from 'lucide-react';
import { SystemUser } from '../types';
import BadgeRenderer from './BadgeRenderer';

interface RegistrationFlowProps {
  onRegistrationCompleted?: (user: SystemUser) => void;
}

export default function RegistrationFlow({ onRegistrationCompleted }: RegistrationFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successUser, setSuccessUser] = useState<SystemUser | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    organization: '',
    position: '',
    phone: '',
    gender: 'Male' as any,
    foodAllergies: '',
    country: 'Iraq',
    city: '',
  });

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!invitationCode.trim()) {
      setErrorMessage('Please enter an invitation pass code');
      return;
    }

    const validation = dbOperations.validateInvitationCode(invitationCode);
    if (validation.success) {
      setStep(2);
    } else {
      setErrorMessage(validation.error || 'Invalid code');
    }
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Field check validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.organization || !formData.phone || !formData.city) {
      setErrorMessage('Please fill in all mandatory fields');
      return;
    }

    try {
      // Simulate PHP password_hash() and save user
      const userResult = dbOperations.registerUser({
        full_name: formData.fullName,
        email: formData.email,
        password_hash: '$2y$10$hashed_simulated_password_hash', // Simulated
        organization: formData.organization,
        position: formData.position || 'Delegate',
        phone: formData.phone,
        gender: formData.gender,
        food_allergies: formData.foodAllergies || 'None',
        country: formData.country,
        city: formData.city,
        role: 'user', // Default is normal standard user
      }, invitationCode);

      setSuccessUser(userResult);
      setStep(3);

      if (onRegistrationCompleted) {
        onRegistrationCompleted(userResult);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration.');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {step === 1 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
              <UserPlus className="text-slate-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">KEF 2026 Participant Registry</h2>
            <p className="text-xs text-slate-400 mt-1">Verify invitation key credentials to access registration</p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-semibold mb-4 leading-relaxed">
              <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleValidateCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                Enter Invitation Code
              </label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                placeholder="e.g. KEF2026-VIP or KEF2026-GUEST"
                className="w-full text-center tracking-widest bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-slate-800 focus:bg-white focus:ring-0 rounded-2xl px-4 py-3 text-sm font-bold placeholder:text-slate-300 focus:outline-none transition uppercase"
              />
              <span className="text-[10px] text-slate-400 text-center block mt-1">
                Demo passes: <span className="font-mono font-bold text-slate-600">KEF2026-VIP</span> or <span className="font-mono font-bold text-slate-600">KEF2026-GUEST</span>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs tracking-wider uppercase transition mt-2 cursor-pointer"
            >
              Verify Code
            </button>
          </form>

          {/* Bilingual Support Note footer of login */}
          <div className="border-t border-slate-100/80 pt-4 mt-6 text-[10px] text-slate-400 font-medium">
            <div className="flex gap-2 justify-center items-center">
              <Globe size={12} />
              <span>Bilingual Registration Gate Protocol</span>
            </div>
            <p className="text-center mt-1">Accreditation matching and system digital check</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <button
              onClick={() => setStep(1)}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-[11px] bg-emerald-50 px-2.5 py-1 rounded-full text-emerald-700 font-bold border border-emerald-100">
              Verified: {invitationCode.toUpperCase()}
            </span>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Complete Participant Profile</h3>
            <p className="text-xs text-slate-400 mt-1">Enter details below matching your identification documents</p>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-semibold mb-4 leading-relaxed">
              <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div className="space-y-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Alan Noori"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Email & Password Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email address *</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Organization & Position Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Salahaddin University"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Assistant Lecturer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone & Gender Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Contact *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+964 750 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Food Allergies */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Food allergies</label>
                <input
                  type="text"
                  value={formData.foodAllergies}
                  onChange={(e) => setFormData({ ...formData, foodAllergies: e.target.value })}
                  placeholder="e.g. None, Gluten-free, Nuts, Vegetarian..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Country & City */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Iraq"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Erbil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs tracking-wider uppercase transition mt-6 cursor-pointer"
            >
              Complete Registration of KEF Badge
            </button>
          </form>
        </div>
      )}

      {step === 3 && successUser && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-center">
            {/* Visual Success Indicator icon */}
            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3.5">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-slate-800">Registration Complete!</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Congratulations! Your unique KEF accreditation details has been successfully compiled and entered in the secure database.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 font-mono inline-flex gap-4 items-center justify-center my-4">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">PASS ID</span>
                <span className="text-sm font-bold text-slate-700 tracking-widest">{successUser.registration_id}</span>
              </div>
              <div className="h-6 w-px bg-slate-300" />
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Verification Status</span>
                <span className="text-xs font-bold text-emerald-600">Verified & Active</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-normal">
              An offline welcome ticket confirmation email containing your entry schedule and attached printable QR credentials has been logged to your inbox.
            </p>
          </div>

          {/* Render badge and action controls */}
          <BadgeRenderer user={successUser} onClose={() => setStep(1)} />
        </div>
      )}
    </div>
  );
}
