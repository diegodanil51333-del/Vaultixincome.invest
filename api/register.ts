import { authoritativeStore, AuthoritativeUser } from './authoritative-store.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { user, referralCode } = req.body || {};

  if (!user || !user.userId || !user.email) {
    return res.status(400).json({ error: 'Invalid user registration payload.' });
  }

  try {
    const authUser: AuthoritativeUser = {
      userId: user.userId,
      accountId: user.accountId || `VX-${Math.floor(100000 + Math.random() * 900000)}`,
      username: user.username,
      fullName: user.fullName || user.username,
      email: user.email,
      role: user.role || 'USER',
      accountStatus: user.accountStatus || 'ACTIVE',
      balance: typeof user.balance === 'number' ? user.balance : 0,
      totalDeposits: typeof user.totalDeposits === 'number' ? user.totalDeposits : 0,
      totalInvestments: typeof user.totalInvestments === 'number' ? user.totalInvestments : 0,
      totalProfitLoss: typeof user.totalProfitLoss === 'number' ? user.totalProfitLoss : 0,
      referralEarnings: typeof user.referralEarnings === 'number' ? user.referralEarnings : 0,
      bonusBalance: typeof user.bonusBalance === 'number' ? user.bonusBalance : 0,
      referralCode: user.referralCode || `VXREF-${Math.floor(1000 + Math.random() * 9000)}`,
      phoneNumber: user.phoneNumber,
      referredBy: user.referredBy,
      referredByUsername: user.referredByUsername,
      referredByDisplayName: user.referredByDisplayName,
      hasReceivedSignupBonus: Boolean(user.hasReceivedSignupBonus),
      hasReceivedFirstDepositBonus: Boolean(user.hasReceivedFirstDepositBonus),
      createdAt: user.createdAt || new Date().toISOString()
    };

    const result = authoritativeStore.registerUserWithReferral(authUser, referralCode);

    return res.status(200).json({
      success: true,
      user: result.user,
      referrer: result.referrer || null,
      newTxs: result.newTxs || []
    });
  } catch (err: any) {
    console.error('Registration backend error:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Registration processing failed.'
    });
  }
}
