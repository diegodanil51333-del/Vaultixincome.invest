import React, { useState, useRef } from 'react';
import { User } from '../types';
import { getUsers, saveUsers, saveCurrentSession, updateUserProfile } from '../db';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { uploadAvatarSafely } from '../services/imageUploadService';
import { showToast } from '../services/toastService';
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
  Award,
  Camera,
  Upload
} from 'lucide-react';

interface ProfileScreenProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUserUpdated }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyReferralCode = () => {
    if (!user.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    showToast({ type: 'copy', title: 'Referral Code Copied', message: user.referralCode });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAccountId = () => {
    if (!user.accountId) return;
    navigator.clipboard.writeText(user.accountId);
    setCopiedAccountId(true);
    showToast({ type: 'copy', title: 'Account ID Copied', message: user.accountId });
    setTimeout(() => setCopiedAccountId(false), 2000);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const result = await uploadAvatarSafely(user.userId, file);
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Could not update profile picture.');
      }

      const updated = await updateUserProfile(user.userId, {
        photoURL: result.url,
        avatarUrl: result.url
      });

      if (updated) {
        onUserUpdated(updated);
        showToast({
          type: 'success',
          title: 'Profile Picture Updated',
          message: 'Your profile picture has been updated across your account.'
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Upload Error',
        message: err?.message || 'Could not process profile picture.'
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await updateUserProfile(user.userId, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim()
      });

      if (updated) {
        onUserUpdated(updated);
        showToast({
          type: 'success',
          title: 'Profile Saved',
          message: 'Your profile details have been saved successfully.'
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Failed to update profile details.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast({
        type: 'success',
        title: 'Reset Email Dispatched',
        message: `Security instructions sent to ${user.email}. Check your inbox.`
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: err?.message || 'Please contact security support.'
      });
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

  const currentPhoto = user.photoURL || user.avatarUrl;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141923] border border-[#2A3447] p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#D4AF37] font-bold text-xs tracking-wider uppercase">
            <UserCheck className="w-4 h-4" />
            <span>Account Identification &amp; Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Profile Details</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your personal verification details, contact information, and security credentials.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tier 2 Verified</span>
          </span>
        </div>
      </div>

      {/* Account Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Core Identity Card */}
        <div className="md:col-span-1 bg-[#141923] border border-[#2A3447] rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center shadow-xl">
          {/* Avatar with Camera Overlay */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-[#1D2432] border-2 border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] shadow-xl overflow-hidden relative">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={user.fullName || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black">{user.username ? user.username[0].toUpperCase() : 'V'}</span>
              )}
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="absolute bottom-0 right-0 bg-[#D4AF37] hover:bg-[#b8982e] text-black p-2 rounded-full shadow-lg border-2 border-[#141923] transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="Upload new profile picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-white tracking-tight">{user.fullName || user.username}</h2>
            <div className="text-xs font-mono text-slate-400">@{user.username}</div>
            <div className="inline-block mt-2">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                user.role === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'VERIFIED INVESTOR'}
              </span>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-[#2A3447] space-y-2.5 text-xs text-left">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-slate-500" /> Account ID</span>
              <button
                type="button"
                onClick={handleCopyAccountId}
                className="font-mono text-white font-bold flex items-center gap-1 hover:text-[#D4AF37] transition-colors cursor-pointer"
                title="Copy Account ID"
              >
                <span>{user.accountId || 'VX-DEFAULT'}</span>
                {copiedAccountId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Member Since</span>
              <span className="text-slate-300 font-medium">{formatDate(user.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-slate-500" /> Referral Code</span>
              <button
                type="button"
                onClick={handleCopyReferralCode}
                className="font-mono text-[#D4AF37] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                title="Copy Referral Code"
              >
                <span>{user.referralCode || 'VXREF-DEFAULT'}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Edit & Security Form */}
        <div className="md:col-span-2 bg-[#141923] border border-[#2A3447] rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="border-b border-[#2A3447] pb-3.5">
            <h3 className="text-base font-bold text-white tracking-tight">Personal Information</h3>
            <p className="text-xs text-slate-400 mt-0.5">Update your account name and registered contact details</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your legal full name"
                className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full bg-[#0B0E14]/60 border border-[#2A3447] rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed pl-10"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <span className="absolute right-3.5 top-2.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Verified
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors pl-10"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>

          {/* Security Credentials Section */}
          <div className="pt-6 border-t border-[#2A3447] space-y-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Security Credentials</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage password protection and authentication tokens</p>
            </div>

            <div className="bg-[#0B0E14] border border-[#2A3447] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                  <span>Master Password Authentication</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Receive a secure reset link to update your password via email.
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={isSendingReset}
                className="bg-[#1D2432] hover:bg-[#2A3447] text-white border border-[#2A3447] hover:border-[#D4AF37]/50 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{isSendingReset ? 'Sending...' : 'Reset Password'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
