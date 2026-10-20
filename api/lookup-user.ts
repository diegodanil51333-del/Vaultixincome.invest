import { authoritativeStore } from './authoritative-store.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const query = req.query || {};
  const rawId = body.identifier || body.username || body.email || query.identifier || query.username || query.email || '';
  const identifier = (typeof rawId === 'string' ? rawId : String(rawId || '')).trim().toLowerCase();

  if (!identifier) {
    return res.status(400).json({ error: 'Username or email identifier is required.' });
  }

  try {
    // Standard admin alias lookup
    if (
      identifier === 'vaultix_admin' ||
      identifier === 'admin' ||
      identifier === 'administrator' ||
      identifier === 'vaultixincometeam@outlook.com'
    ) {
      return res.status(200).json({
        success: true,
        email: 'vaultixincometeam@outlook.com',
        username: 'vaultix_admin',
        fullName: 'Vaultix Administrator',
        role: 'ADMIN',
        userId: 'admin-vaultix-system'
      });
    }

    let matchedUser: any = null;
    const allUsers = authoritativeStore.getAllUsers();
    for (const u of allUsers) {
      if (!u) continue;
      const uUsername = u?.username && typeof u.username === 'string' ? u.username.toLowerCase() : '';
      const uEmail = u?.email && typeof u.email === 'string' ? u.email.toLowerCase() : '';

      if (
        (uUsername && uUsername === identifier) ||
        (uEmail && uEmail === identifier)
      ) {
        matchedUser = u;
        break;
      }
    }

    if (matchedUser) {
      return res.status(200).json({
        success: true,
        email: matchedUser.email || '',
        username: matchedUser.username || '',
        fullName: matchedUser.fullName || matchedUser.username || '',
        role: matchedUser.role || 'USER',
        userId: matchedUser.userId || ''
      });
    }

    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  } catch (err: any) {
    console.error('Lookup user backend error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Lookup failed'
    });
  }
}

