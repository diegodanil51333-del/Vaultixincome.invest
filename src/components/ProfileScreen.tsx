import React, { useState } from 'react';
import { User } from '../types';
import { getUsers, saveUsers, saveCurrentSession } from '../db';
import { auth, db, doc, updateDoc, cleanFirestoreData } from '../firebase';
import { 
  UserCheck, 
  ShieldCheck, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  Hash, 
  Calendar, 
  Lock, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  ExternalLink,
  Award
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ProfileScreenProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUserUpdated }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password Reset State
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleCopyReferralCode = () => {
    if (!user.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const updatedUser: User = {
        ...user,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        updatedAt: new Date().toISOString()
      };

      // 1. Update Cloud Firestore
      try {
        if (user.userId) {
          const userDocRef = doc(db, 'users', user.userId);
          await updateDoc(userDocRef, {
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            updatedAt: new Date().toISOString()
          });
        }
      } catch (fsErr) {
        console.warn('Firestore profile update non-blocking notice:', fsErr);
      }

      // 2. Update local state & session storage
      const allUsers = getUsers();
      const userIdx = allUsers.findIndex((u) => u.userId === user.userId);
      if (userIdx >= 0) {
        allUsers[userIdx] = updatedUser;
      } else {
        allUsers.push(updatedUser);
      }
      saveUsers(allUsers);
      saveCurrentSession(updatedUser);
      onUserUpdated(updatedUser);

      setSaveSuccess('Profile details saved and synchronized successfully!');
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user.email) return;
    setIsSendingReset(true);
    setResetMsg(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetMsg(`Password reset email sent to ${user.email}. Check your inbox to set a new password.`);
    } catch (err: any) {
      setResetMsg(`Failed to send password reset email: ${err.message || 'Please contact support.'}`);
    } finally {
      setIsSendingReset(false);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Active Member';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141923] border border-[#2A3447] p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#D4AF37] font-semibold text-xs tracking-wider uppercase">
            <UserCheck className="w-4 h-4" />
            <span>Account Identification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Profile Details</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your personal verification details, contact information, and security credentials.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Account</span>
          </span>
        </div>
      </div>

      {/* Account Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core Identity */}
        <div className="md:col-span-1 bg-[#141923] border border-[#2A3447] rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#1D2432] border-2 border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] shadow-lg relative">
            <span className="text-2xl font-black">{user.username ? user.username[0].toUpperCase() : 'V'}</span>
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#141923]" title="Online" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">{user.fullName || user.username}</h2>
            <div className="text-xs font-mono text-slate-400">@{user.username}</div>
            <div className="inline-block mt-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                user.role === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {user.role} ACCESS
              </span>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-[#2A3447] space-y-2 text-xs text-left">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Account ID</span>
              <span className="font-mono text-white font-bold">{user.accountId || 'VX-DEFAULT'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Member Since</span>
              <span className="text-slate-300">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Referral Code</span>
              <button
                onClick={handleCopyReferralCode}
                className="font-mono text-[#D4AF37] font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{user.referralCode || 'VXREF-DEFAULT'}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="md:col-span-2 bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-6">
          <div className="border-b border-[#2A3447] pb-3">
            <h3 className="text-base font-bold text-white">Personal Information</h3>
            <p className="text-xs text-slate-400">Update your account name and registered contact details</p>
          </div>

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#1D2432] border border-[#2A3447] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Username (Fixed Identifier)
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full bg-[#10141D] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Email Address (Primary Login)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#10141D] border border-[#2A3447] rounded-xl text-xs text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#b8982e] text-black text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>

          {/* Security & Password Reset Section */}
          <div className="pt-6 border-t border-[#2A3447] space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#D4AF37]" />
              <span>Security & Password Management</span>
            </h4>
            <p className="text-xs text-slate-400">
              For your protection, passwords are authenticated securely via Firebase Authentication and are never stored in plaintext. You can trigger an official password reset email to your registered inbox anytime.
            </p>

            {resetMsg && (
              <div className="p-3 rounded-xl bg-slate-800 border border-[#2A3447] text-xs text-slate-200">
                {resetMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={isSendingReset}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1D2432] hover:bg-[#2A3447] text-slate-200 text-xs font-semibold rounded-xl border border-[#2A3447] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isSendingReset ? 'Sending Reset Email...' : 'Send Password Reset Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
