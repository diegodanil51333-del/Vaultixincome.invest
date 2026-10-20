import React, { useState } from 'react';
import { User, Invitation } from '../types';
import { getUsers, getInvitations, saveInvitations, saveUsers, saveCurrentSession } from '../db';
import { Users, Copy, Check, Share2, Award, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface InviteScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const InviteScreen: React.FC<InviteScreenProps> = ({ user, onUserUpdated }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [inviteeUsername, setInviteeUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const referralLink = `https://vaultix.income/invite?ref=${user.referralCode}`;
  const invitations = getInvitations().filter((inv) => inv.inviterUsername === user.username);
  const referredUsers = getUsers().filter((u) => u.referredByUsername === user.username);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const targetUsername = inviteeUsername.trim();

    if (!targetUsername) {
      setError('Please enter a target username.');
      return;
    }

    if (targetUsername.toLowerCase() === user.username.toLowerCase()) {
      setError('You cannot invite yourself.');
      return;
    }

    const allUsers = getUsers();
    const recipient = allUsers.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase());

    if (!recipient) {
      setError(`User "@${targetUsername}" was not found on Vaultix Income.`);
      return;
    }

    const allInvs = getInvitations();
    const existing = allInvs.find(
      (inv) =>
        inv.inviterUsername.toLowerCase() === user.username.toLowerCase() &&
        inv.inviteeUsername.toLowerCase() === targetUsername.toLowerCase()
    );

    if (existing) {
      setError(`An invitation has already been sent to @${recipient.username}.`);
      return;
    }

    const newInv: Invitation = {
      id: `INVITE-${Math.floor(1000 + Math.random() * 9000)}`,
      inviterUsername: user.username,
      inviteeUsername: recipient.username,
      status: 'ACCEPTED',
      timestamp: new Date().toISOString(),
      rewardClaimed: true
    };

    allInvs.push(newInv);
    saveInvitations(allInvs);

    // Award $25 bonus reward to inviter
    const updatedUser: User = {
      ...user,
      balance: user.balance + 25.0
    };

    const userIdx = allUsers.findIndex((u) => u.userId === user.userId);
    if (userIdx !== -1) {
      allUsers[userIdx] = updatedUser;
      saveUsers(allUsers);
    }

    saveCurrentSession(updatedUser);
    onUserUpdated(updatedUser);

    setInviteeUsername('');
    setSuccess(`Successfully invited @${recipient.username}! $25 bonus reward credited to your account.`);
  };

  return (
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center space-x-2">
          <Users class="w-5 h-5 text-[#D4AF37]" />
          <span>Invite Friends & Earn Rewards</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Earn $25 USD bonus for every friend who joins Vaultix Income</p>
      </div>

      {/* Bonus Stats Card */}
      <div class="bg-gradient-to-r from-[#141923] via-[#1D2432] to-[#141923] border border-[#D4AF37]/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Award class="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">$25 Referral Bonus Reward</h3>
            <p class="text-xs text-slate-300">Earn instant portfolio credit whenever a friend registers using your link or code.</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A3447]">
          <div>
            <span class="text-xs text-slate-400">Total Referred Users</span>
            <div class="text-xl font-extrabold text-white mt-0.5">{referredUsers.length + invitations.length}</div>
          </div>
          <div>
            <span class="text-xs text-slate-400">Referral Rewards Earned</span>
            <div class="text-xl font-extrabold text-[#10B981] mt-0.5">
              +${((referredUsers.length + invitations.length) * 25).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Share Codes & Link */}
      <div class="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white">Your Referral Share Tools</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Your Unique Referral Code</label>
            <div class="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={user.referralCode}
                class="flex-1 bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-sm text-[#D4AF37] font-bold focus:outline-none"
              />
              <button
                onClick={handleCopyCode}
                class="bg-[#1D2432] hover:bg-[#2A3447] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 border border-[#2A3447]"
              >
                {copiedCode ? <Check class="w-4 h-4 text-emerald-400" /> : <Copy class="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Direct Referral Web Link</label>
            <div class="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                class="flex-1 bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-sm text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                class="bg-[#D4AF37] hover:bg-[#b8982e] text-black px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                {copiedLink ? <Check class="w-4 h-4" /> : <Share2 class="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send Direct Username Invite */}
      <div class="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 class="text-sm font-bold text-white flex items-center space-x-2">
          <UserPlus class="w-4 h-4 text-[#06B6D4]" />
          <span>Invite Existing User by Username</span>
        </h3>

        {error && (
          <div class="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div class="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <CheckCircle class="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSendInvite} class="flex items-center space-x-2">
          <input
            type="text"
            value={inviteeUsername}
            onChange={(e) => setInviteeUsername(e.target.value)}
            placeholder="Enter username (e.g. testuser01)"
            class="flex-1 bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
          />
          <button
            type="submit"
            class="bg-[#06B6D4] hover:bg-[#0891b2] text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all shrink-0"
          >
            Send Invite
          </button>
        </form>
      </div>
    </div>
  );
};
