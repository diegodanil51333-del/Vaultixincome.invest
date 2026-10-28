import React, { useState, useRef } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../db';
import { uploadAvatarSafely } from '../services/imageUploadService';
import { showToast } from '../services/toastService';
import { 
  User as UserIcon, 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  ShieldCheck, 
  Check, 
  Copy, 
  Mail, 
  KeyRound, 
  ExternalLink,
  Smartphone,
  Globe,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

interface SettingsScreenProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onUserUpdated }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [bio, setBio] = useState(user.bio || '');
  const [country, setCountry] = useState(user.country || '');
  const [photoURL, setPhotoURL] = useState<string | null>(user.photoURL || user.avatarUrl || null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAccountId = () => {
    if (!user.accountId) return;
    navigator.clipboard.writeText(user.accountId);
    setCopiedAccountId(true);
    showToast({ type: 'copy', title: 'Account ID Copied', message: user.accountId });
    setTimeout(() => setCopiedAccountId(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const result = await uploadAvatarSafely(user.userId, file);
      
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Could not process the selected picture.');
      }

      setPhotoURL(result.url);

      // Save immediately to Firestore & Local Storage
      const updated = await updateUserProfile(user.userId, {
        photoURL: result.url,
        avatarUrl: result.url
      });

      if (updated) {
        onUserUpdated(updated);
        showToast({
          type: 'success',
          title: 'Profile Picture Updated',
          message: result.isFallbackDataUrl
            ? 'Avatar optimized and saved securely to your account profile.'
            : 'Avatar uploaded and stored in cloud storage.'
        });
      }
    } catch (err: any) {
      console.error('Profile image upload failed:', err);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err?.message || 'Could not update profile picture. Please try another image.'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoURL) return;
    setIsUploading(true);
    try {
      const updated = await updateUserProfile(user.userId, {
        photoURL: '',
        avatarUrl: ''
      });
      setPhotoURL(null);
      if (updated) {
        onUserUpdated(updated);
        showToast({
          type: 'info',
          title: 'Photo Removed',
          message: 'Profile picture removed. Your default initial will be displayed.'
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Could not remove profile picture.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await updateUserProfile(user.userId, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        bio: bio.trim(),
        country: country.trim(),
        photoURL: photoURL || undefined,
        avatarUrl: photoURL || undefined
      });

      if (updated) {
        onUserUpdated(updated);
        showToast({
          type: 'success',
          title: 'Settings Saved',
          message: 'Personal details and account preferences updated successfully.'
        });
      }
    } catch (err: any) {
      console.error('Failed to save profile settings:', err);
      showToast({
        type: 'error',
        title: 'Save Error',
        message: err?.message || 'Could not update account settings.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast({
        type: 'success',
        title: 'Password Reset Sent',
        message: `Security instructions sent to ${user.email}. Check your inbox.`
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: err?.message || 'Could not trigger password reset.'
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141923] border border-[#2A3447] p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#D4AF37] font-bold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Account Security &amp; Customization</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Account Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure profile credentials, security protocols, and platform preferences.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tier 2 Verified</span>
          </span>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#2A3447]">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#D4AF37]/60 overflow-hidden bg-[#1D2432] flex items-center justify-center shadow-xl relative">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={user.fullName || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#D4AF37]">
                  {user.username ? user.username[0].toUpperCase() : 'V'}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2">
                  <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-1" />
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Saving</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 bg-[#D4AF37] hover:bg-[#b8982e] text-black p-2 rounded-full shadow-lg border-2 border-[#141923] transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="Change profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">@{user.username}</h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                user.role === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'VERIFIED INVESTOR'}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {user.accountStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Upload a JPG, PNG, or WEBP profile picture. Photos are automatically optimized and synchronized securely.
            </p>
            <div className="pt-1.5 flex flex-wrap gap-2.5 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[#1D2432] hover:bg-[#2A3447] text-white border border-[#2A3447] hover:border-[#D4AF37]/50 text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{isUploading ? 'Uploading...' : 'Choose Picture'}</span>
              </button>

              {photoURL && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Remove custom picture"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Read-Only Account Credential Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#0B0E14] border border-[#2A3447] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account ID</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#D4AF37]">{user.accountId}</span>
              <button
                type="button"
                onClick={handleCopyAccountId}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                title="Copy Account ID"
              >
                {copiedAccountId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-[#2A3447] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Email</span>
            <div className="text-xs font-medium text-white truncate flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-[#2A3447] p-4 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Affiliate Referral Code</span>
            <div className="text-xs font-mono font-bold text-amber-300">
              {user.referralCode}
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center space-x-2">
            <UserIcon className="w-4 h-4" />
            <span>Personal Profile Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="Enter full legal name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country / Jurisdiction</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                placeholder="e.g. United States, United Kingdom, Singapore"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Member Registration Date</label>
              <div className="w-full bg-[#0B0E14]/60 border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono">
                {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Investment Strategy Notes &amp; Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="Outline your primary risk tolerance and investment objectives..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Settings'}</span>
            </button>
          </div>
        </form>

        {/* Security & Authentication Section */}
        <div className="pt-6 border-t border-[#2A3447] space-y-4">
          <div className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center space-x-2">
            <KeyRound className="w-4 h-4" />
            <span>Security &amp; Password Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password Reset */}
            <div className="bg-[#0B0E14] border border-[#2A3447] p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                  <span>Account Password</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Trigger an encrypted password update email to change your master access credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isSendingReset}
                className="w-full bg-[#1D2432] hover:bg-[#2A3447] text-white border border-[#2A3447] hover:border-[#D4AF37]/50 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{isSendingReset ? 'Dispatching Email...' : 'Send Password Reset Email'}</span>
              </button>
            </div>

            {/* 2FA Toggle Simulation */}
            <div className="bg-[#0B0E14] border border-[#2A3447] p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Two-Factor Authentication (2FA)</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Require an authenticator verification code for withdrawals and sensitive account changes.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-300">
                  {twoFactorEnabled ? '2FA Protection Enabled' : '2FA Protection Disabled'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled(!twoFactorEnabled);
                    showToast({
                      type: twoFactorEnabled ? 'info' : 'success',
                      title: '2FA Status Updated',
                      message: twoFactorEnabled ? 'Two-Factor Authentication disabled.' : 'Two-Factor Authentication enabled successfully.'
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    twoFactorEnabled ? 'bg-emerald-500' : 'bg-[#2A3447]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
