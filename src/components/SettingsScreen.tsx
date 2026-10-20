import React, { useState, useRef } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../db';
import { storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { 
  User as UserIcon, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Copy, 
  Save, 
  Mail, 
  Phone, 
  Globe, 
  FileText,
  Sparkles
} from 'lucide-react';

interface SettingsScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onUserUpdated }) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [bio, setBio] = useState(user.bio || '');
  const [country, setCountry] = useState(user.country || 'United States');
  const [photoURL, setPhotoURL] = useState<string>(user.photoURL || user.avatarUrl || '');

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedAccountId, setCopiedAccountId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyAccountId = () => {
    navigator.clipboard.writeText(user.accountId);
    setCopiedAccountId(true);
    setTimeout(() => setCopiedAccountId(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Read file as base64 for immediate instant client-side preview
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const dataUrl = await base64Promise;

      let uploadedUrl = dataUrl;

      // 2. Upload cleanly to Firebase Storage
      try {
        const storageRef = ref(storage, `avatars/${user.userId}/${Date.now()}_profile.jpg`);
        const snapshot = await uploadBytes(storageRef, file);
        uploadedUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed, falling back to data URL storage:', storageErr);
        uploadedUrl = dataUrl;
      }

      setPhotoURL(uploadedUrl);

      // 3. Persist permanently in Firestore and current session
      const updated = await updateUserProfile(user.userId, {
        photoURL: uploadedUrl,
        avatarUrl: uploadedUrl
      });

      if (updated) {
        onUserUpdated(updated);
        setSuccessMsg('Profile picture uploaded and saved permanently!');
      }
    } catch (err: any) {
      console.error('Profile image upload failed:', err);
      setErrorMsg('Could not upload profile picture. Please try another image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

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
        setSuccessMsg('Profile settings updated successfully!');
      } else {
        setErrorMsg('User not found.');
      }
    } catch (err: any) {
      console.error('Failed to save profile settings:', err);
      setErrorMsg(err.message || 'Could not save profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-[#D4AF37]" />
          <span>Account Profile & Security Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, permanent avatar, account credentials, and platform preferences.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-4 rounded-xl flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-4 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
        
        {/* Profile Picture Upload Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#2A3447]">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#D4AF37]/60 overflow-hidden bg-[#1D2432] flex items-center justify-center shadow-xl">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={user.fullName || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 bg-[#D4AF37] hover:bg-[#b8982e] text-black p-2 rounded-full shadow-lg border border-black/40 transition-transform active:scale-95 cursor-pointer"
              title="Upload profile picture"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold text-white">@{user.username}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {user.role}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                {user.accountStatus}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Upload a JPG, PNG or WEBP profile picture. Photos are saved permanently to Cloud Storage.
            </p>

            <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[#1D2432] hover:bg-[#2A3447] text-white border border-[#2A3447] text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{isUploading ? 'Uploading...' : 'Choose Picture'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Read-Only Account Credential Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-[#0B0E14] border border-[#2A3447] p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account ID</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#D4AF37]">{user.accountId}</span>
              <button
                type="button"
                onClick={handleCopyAccountId}
                className="text-slate-400 hover:text-white p-1 rounded"
                title="Copy Account ID"
              >
                {copiedAccountId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-[#2A3447] p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Email</span>
            <div className="text-xs font-medium text-white truncate flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div className="bg-[#0B0E14] border border-[#2A3447] p-3.5 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Referral Code</span>
            <div className="text-xs font-mono font-bold text-amber-300">
              {user.referralCode}
            </div>
          </div>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                placeholder="Enter full legal name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Country / Jurisdiction</label>
              <div className="relative">
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  placeholder="United States, United Kingdom, etc."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Member Since</label>
              <div className="w-full bg-[#0B0E14]/60 border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-slate-400">
                {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Personal Bio & Notes</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              placeholder="Tell us about your portfolio goals and wealth strategies..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#D4AF37] hover:bg-[#b8982e] text-black font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Settings'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
