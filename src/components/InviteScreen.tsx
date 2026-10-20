import React, { useState, useEffect } from 'react';
import { User, Invitation } from '../types';
import { getUsers, getInvitations, saveInvitations, saveUsers, saveCurrentSession, getReferralConfig, withdrawReferralEarnings, submitBonusWithdrawalRequest } from '../db';
import { Users, Copy, Check, Share2, Award, UserPlus, AlertCircle, CheckCircle, ArrowUpRight, DollarSign, ShieldCheck } from 'lucide-react';

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

  // Real-time synchronization for referred users and bonuses
  const [allUsers, setAllUsers] = useState<User[]>(() => getUsers());

  useEffect(() => {
    const handleUpdate = () => {
      setAllUsers(getUsers());
      const freshUser = getUsers().find((u) => u.userId === user.userId);
      if (freshUser) {
        onUserUpdated(freshUser);
      }
    };

    window.addEventListener('vaultix_users_updated', handleUpdate);
    window.addEventListener('vaultix_txs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('vaultix_users_updated', handleUpdate);
      window.removeEventListener('vaultix_txs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user.userId, onUserUpdated]);

  // Referral Withdrawal State
  const [withdrawStep, setWithdrawStep] = useState<'IDLE' | 'FEE_PROMPT' | 'SUBMIT_ADDRESS'>('IDLE');
  const [withdrawAmt, setWithdrawAmt] = useState<number>(50.0);
  const [feePaidConfirmed, setFeePaidConfirmed] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState('');
  const [wError, setWError] = useState<string | null>(null);
  const [wSuccess, setWSuccess] = useState<string | null>(null);

  const refConfig = getReferralConfig();
  const minThreshold = refConfig.withdrawalThreshold || 50.0;
  const NETWORK_FEE = 15.0;

  const referralLink = `${window.location.origin}/?ref=${user.referralCode}`;
  const invitations = getInvitations().filter((inv) => inv.inviterUsername === user.username);
  
  // Accurately track every referred user by userId, username, or referralCode
  const referredUsers = allUsers.filter((u) => {
    if (!u || u.userId === user.userId) return false;
    const matchId = Boolean(u.referredBy && u.referredBy === user.userId);
    const matchUsername = Boolean(
      u.referredByUsername &&
      user.username &&
      typeof u.referredByUsername === 'string' &&
      typeof user.username === 'string' &&
      u.referredByUsername.toLowerCase() === user.username.toLowerCase()
    );
    const matchRefCode = Boolean(
      u.referredBy &&
      user.referralCode &&
      u.referredBy.toUpperCase() === user.referralCode.toUpperCase()
    );
    return matchId || matchUsername || matchRefCode;
  });

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

  const handleStartWithdrawal = () => {
    setWError(null);
    setWSuccess(null);

    const bonusBal = user.bonusBalance || user.referralEarnings || 0;

    if (bonusBal < minThreshold) {
      setWError(`Bonus Wallet balance ($${bonusBal.toFixed(2)}) is below the $${minThreshold.toFixed(2)} withdrawal threshold.`);
      return;
    }

    setWithdrawAmt(bonusBal);
    setWithdrawStep('FEE_PROMPT');
  };

  const handleConfirmNetworkFee = () => {
    setWError(null);
    setFeePaidConfirmed(true);
    setWithdrawStep('SUBMIT_ADDRESS');
  };

  const handleExecuteReferralWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWError(null);
    setWSuccess(null);

    if (!feePaidConfirmed) {
      setWError('The $15.00 network fee must be confirmed before submitting the withdrawal address.');
      return;
    }

    if (!destinationAddress.trim()) {
      setWError('Please enter a valid destination crypto address.');
      return;
    }

    try {
      const tx = await submitBonusWithdrawalRequest(user, withdrawAmt, destinationAddress.trim());
      const freshUser = getUsers().find((u) => u.userId === user.userId) || user;
      onUserUpdated(freshUser);
      setWSuccess(`Bonus Wallet Withdrawal request #${tx.id} of $${withdrawAmt.toFixed(2)} submitted! Status: PENDING ($15 Network Fee Confirmed)`);
      setWithdrawStep('IDLE');
      setDestinationAddress('');
      setFeePaidConfirmed(false);
    } catch (err: any) {
      setWError(err.message || 'Bonus withdrawal failed.');
    }
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

    if (user?.username && targetUsername.toLowerCase() === user.username.toLowerCase()) {
      setError('You cannot invite yourself.');
      return;
    }

    const allUsers = getUsers();
    const recipient = allUsers.find(
      (u) => Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase() === targetUsername.toLowerCase())
    );

    if (!recipient) {
      setError(`User "@${targetUsername}" was not found on Vaultix Income.`);
      return;
    }

    const allInvs = getInvitations();
    const existing = allInvs.find(
      (inv) =>
        Boolean(inv?.inviterUsername && user?.username && inv.inviterUsername.toLowerCase() === user.username.toLowerCase()) &&
        Boolean(inv?.inviteeUsername && inv.inviteeUsername.toLowerCase() === targetUsername.toLowerCase())
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

    const bonusAmt = 5.0;
    const updatedUser: User = {
      ...user,
      referralEarnings: user.referralEarnings + bonusAmt
    };

    const userIdx = allUsers.findIndex((u) => u.userId === user.userId);
    if (userIdx !== -1) {
      allUsers[userIdx] = updatedUser;
      saveUsers(allUsers);
    }

    saveCurrentSession(updatedUser);
    onUserUpdated(updatedUser);

    setInviteeUsername('');
    setSuccess(`Successfully invited @${recipient.username}! $${bonusAmt.toFixed(2)} referral credit added to your referral balance.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Users className="w-5 h-5 text-[#D4AF37]" />
          <span>Invite Friends & Earn Rewards</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Share your unique referral code with friends. Earn $3.00 USD for every friend who registers using your code.
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#141923] via-[#1D2432] to-[#141923] border border-[#D4AF37]/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Your Referral Reward: $3 USD</h3>
            <p className="text-xs text-slate-300">
              Your friend receives an instant $2 USD welcome bonus upon registration, and you instantly receive a $3 USD referral bonus credited to your bonus balance.
            </p>
          </div>
        </div>

        <div className="bg-[#10141D]/80 border border-[#2A3447] rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-[#D4AF37] block">Referral Earnings Withdrawal Threshold: $50 USD</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Referral earnings become eligible for withdrawal when your available referral earnings reach $50 USD, subject to the platform’s existing withdrawal rules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#2A3447]">
          <div>
            <span className="text-xs text-slate-400">Total Referred Users</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{referredUsers.length}</div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Referral Earnings Balance</span>
            <div className="text-xl font-extrabold text-[#10B981] mt-0.5">
              ${(user.bonusBalance || user.referralEarnings || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Withdrawal Threshold</span>
            <div className="text-xl font-extrabold text-[#06B6D4] mt-0.5">
              $50.00 USD
            </div>
          </div>
        </div>
      </div>

      {/* REQUIREMENT 4: REFERRAL WITHDRAWAL & $15 NETWORK FEE INTERFACE */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ArrowUpRight className="w-4 h-4 text-[#10B981]" />
            <span>Withdraw Referral Earnings</span>
          </h3>
          <span className="text-xs text-[#06B6D4] font-semibold">Min. $50.00 Required</span>
        </div>

        {wError && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{wError}</span>
          </div>
        )}

        {wSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3.5 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{wSuccess}</span>
          </div>
        )}

        {withdrawStep === 'IDLE' && (
          <div className="space-y-3">
            <div className="bg-[#1D2432] p-4 rounded-xl border border-[#2A3447] flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Available Referral Earnings</span>
                <span className="text-lg font-bold text-[#10B981]">${user.referralEarnings.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Withdrawal Status</span>
                <span className={`font-bold ${user.referralEarnings >= minThreshold ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user.referralEarnings >= minThreshold ? 'Eligible for Withdrawal' : `Requires $${(minThreshold - user.referralEarnings).toFixed(2)} More`}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartWithdrawal}
              disabled={user.referralEarnings < minThreshold}
              className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                user.referralEarnings >= minThreshold
                  ? 'bg-[#10B981] hover:bg-[#0d9668] text-black cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              REQUEST REFERRAL WITHDRAWAL ($50 THRESHOLD REACHED)
            </button>
          </div>
        )}

        {/* STEP 1: MANDATORY $15 NETWORK FEE PROMPT */}
        {withdrawStep === 'FEE_PROMPT' && (
          <div className="bg-[#1D2432] border border-[#D4AF37]/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-sm">Step 1: Confirm $15.00 Blockchain Network Fee</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Referral asset payouts require a mandatory <span className="font-bold text-white">$15.00 Network Fee</span> for blockchain gas verification and automated smart contract routing.
            </p>

            <div className="bg-[#0B0E14] border border-[#2A3447] p-3 rounded-lg flex justify-between text-xs">
              <span className="text-slate-400">Withdrawal Amount:</span>
              <span className="font-bold text-[#10B981]">${withdrawAmt.toFixed(2)} USD</span>
            </div>

            <div className="bg-[#0B0E14] border border-[#2A3447] p-3 rounded-lg flex justify-between text-xs">
              <span className="text-slate-400">Mandatory Network Fee:</span>
              <span className="font-bold text-amber-400">$15.00 USD</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setWithdrawStep('IDLE')}
                className="flex-1 bg-[#2A3447] text-slate-300 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNetworkFee}
                className="flex-1 bg-[#D4AF37] hover:bg-[#b8982e] text-black py-2.5 rounded-xl text-xs font-bold shadow-md"
              >
                CONFIRM $15 NETWORK FEE & PROCEED
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DESTINATION CRYPTO ADDRESS SUBMISSION */}
        {withdrawStep === 'SUBMIT_ADDRESS' && (
          <form onSubmit={handleExecuteReferralWithdrawal} className="bg-[#1D2432] border border-emerald-500/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Step 2: Submit Destination Crypto Wallet Address</h4>
            </div>

            <div className="text-xs text-slate-300">
              Network fee of $15.00 confirmed. Enter your receiving wallet address (USDT / BTC / ETH / SOL / XRP).
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1">Destination Crypto Address</label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Paste destination wallet address (e.g. TY8z2K9M1VxL4P7...)"
                className="w-full bg-[#0B0E14] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#10B981]"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWithdrawStep('IDLE')}
                className="flex-1 bg-[#2A3447] text-slate-300 py-2.5 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#10B981] hover:bg-[#0d9668] text-black py-2.5 rounded-xl text-xs font-bold shadow-md"
              >
                SUBMIT REFERRAL WITHDRAWAL
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Referral Share Tools */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Your Unique Referral Share Tools</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Your Referral Code</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={user.referralCode}
                className="flex-1 bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-sm text-[#D4AF37] font-bold focus:outline-none"
              />
              <button
                onClick={handleCopyCode}
                className="bg-[#1D2432] hover:bg-[#2A3447] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 border border-[#2A3447]"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Direct Referral Web Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2 text-sm text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-[#D4AF37] hover:bg-[#b8982e] text-black px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <UserPlus className="w-4 h-4 text-[#06B6D4]" />
          <span>Invite Registered Member by Username</span>
        </h3>

        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSendInvite} className="flex items-center space-x-2">
          <input
            type="text"
            value={inviteeUsername}
            onChange={(e) => setInviteeUsername(e.target.value)}
            placeholder="Enter username (e.g. sarah_crypto)"
            className="flex-1 bg-[#1D2432] border border-[#2A3447] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#06B6D4]"
          />
          <button
            type="submit"
            className="bg-[#06B6D4] hover:bg-[#0891b2] text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all shrink-0"
          >
            Send Invite
          </button>
        </form>
      </div>

      {/* REQUIREMENT 2: REFERRED MEMBERS NETWORK TRACKING LIST */}
      <div className="bg-[#141923] border border-[#2A3447] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span>Referred Network Members ({referredUsers.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Total Registered: <strong className="text-white">{referredUsers.length}</strong></span>
        </div>

        {referredUsers.length === 0 ? (
          <div className="bg-[#1D2432]/60 border border-[#2A3447] rounded-xl p-8 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">No referred members registered yet</p>
            <p className="text-slate-400 max-w-sm mx-auto">Share your referral link or code above. When new members join using your code, they receive $2.00 USD and you earn $3.00 USD instantly!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#1D2432] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#2A3447]">
                <tr>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Account ID</th>
                  <th className="py-2.5 px-3">Registered On</th>
                  <th className="py-2.5 px-3">Bonus Credited</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3447]">
                {referredUsers.map((ru) => (
                  <tr key={ru.userId} className="hover:bg-[#1D2432]/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-xs">
                          {ru.username ? ru.username.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-white">@{ru.username}</div>
                          {ru.fullName && <div className="text-[10px] text-slate-400">{ru.fullName}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{ru.accountId || 'VX-USER'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{ru.createdAt ? new Date(ru.createdAt).toLocaleDateString() : 'Recent'}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 inline mr-1" />
                        <span>+$3.00 USD</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {ru.accountStatus || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
