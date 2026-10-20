import { authoritativeStore } from './authoritative-store.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const queryParams = req.query || {};
  const bodyParams = req.body || {};

  const referralCode = bodyParams.referralCode ?? bodyParams.code ?? queryParams.referralCode ?? queryParams.code ?? '';
  const currentUsername = bodyParams.currentUsername ?? bodyParams.username ?? queryParams.currentUsername ?? queryParams.username ?? '';
  const currentEmail = bodyParams.currentEmail ?? bodyParams.email ?? queryParams.currentEmail ?? queryParams.email ?? '';
  const currentUserId = bodyParams.currentUserId ?? bodyParams.userId ?? queryParams.currentUserId ?? queryParams.userId ?? '';

  try {
    const result = authoritativeStore.validateReferralCode(
      referralCode,
      currentUsername,
      currentEmail,
      currentUserId
    );

    if (!result.valid) {
      return res.status(200).json({
        valid: false,
        isSelfReferral: result.isSelfReferral || false,
        error: result.error || 'Invalid referral code provided.'
      });
    }

    return res.status(200).json({
      valid: true,
      isBlank: result.isBlank || false,
      referrer: result.referrer || null
    });
  } catch (err: any) {
    console.error('Referral validation backend error:', err);
    return res.status(400).json({
      valid: false,
      error: err.message || 'Referral validation failed.'
    });
  }
}
