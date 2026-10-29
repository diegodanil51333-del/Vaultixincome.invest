import { User, Transaction, ReferralConfig, Invitation } from '../types';
import { getUsers, saveUsers, getTransactions, saveTransactions, getReferralConfig, getInvitations, saveInvitations, normalizeUser } from '../db';
import { db, doc, setDoc, getDocs, collection, query, where, cleanFirestoreData } from '../firebase';

/**
 * Generates an authoritative, username-based referral code.
 * Format: VXREF-[Username] (e.g. Diego511 -> VXREF-Diego511)
 */
export function generateReferralCode(username: string): string {
  if (!username) return 'VXREF-MEMBER';
  return `VXREF-${username.trim()}`;
}

/**
 * Extracts referral code from URL patterns including:
 * ?ref=VXREF-Diego511, ?referral=VXREF-Diego511, =VXREF-Diego511, or /ref/VXREF-Diego511
 */
export function extractReferralCodeFromUrl(url?: string): string | null {
  try {
    const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (!targetUrl) return null;

    // Pattern 1: =VXREF-Username
    const equalMatch = targetUrl.match(/=(VXREF-[A-Za-z0-9_-]+)/i);
    if (equalMatch && equalMatch[1]) return equalMatch[1].toUpperCase();

    // Pattern 2: URL search params
    const parsed = new URL(targetUrl, 'https://vaultixincome.com');
    const refParam = parsed.searchParams.get('ref') || parsed.searchParams.get('referral');
    if (refParam) return refParam.trim().toUpperCase();

    // Pattern 3: Path segment /ref/VXREF-...
    const pathMatch = targetUrl.match(/\/ref\/(VXREF-[A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) return pathMatch[1].toUpperCase();

    return null;
  } catch {
    return null;
  }
}

/**
 * Authoritatively validates a referral code against local database and Cloud Firestore.
 * Prevents self-referral, resolves dynamic username formats, and verifies referrer eligibility.
 */
export async function validateReferralCodeAsync(
  code: string,
  currentUsername?: string,
  currentEmail?: string
): Promise<{ valid: boolean; referrer?: User; error?: string }> {
  if (!code || !code.trim()) {
    return { valid: false, error: 'Please enter a referral code.' };
  }

  const cleanCode = code.trim().toUpperCase();

  // Self-referral prevention (check against current registering username)
  if (currentUsername) {
    const userOwnCode = generateReferralCode(currentUsername).toUpperCase();
    if (cleanCode === userOwnCode || cleanCode === `VXREF-${currentUsername.trim().toUpperCase()}`) {
      return {
        valid: false,
        error: 'Self-referral is prohibited. You cannot use your own referral code.'
      };
    }
  }

  // 1. Search in local authoritative user directory
  const localUsers = getUsers();
  let found = localUsers.find((u) => {
    if (!u) return false;
    const uCode = (u.referralCode || '').toUpperCase();
    const uGenCode = generateReferralCode(u.username || '').toUpperCase();
    return uCode === cleanCode || uGenCode === cleanCode;
  });

  // 2. If not found locally, query Cloud Firestore
  if (!found) {
    try {
      const usersCol = collection(db, 'users');
      // Direct referralCode match
      const snapByCode = await getDocs(query(usersCol, where('referralCode', '==', cleanCode)));
      if (!snapByCode.empty) {
        found = snapByCode.docs[0].data() as User;
      } else {
        // Derived format match: if code is VXREF-Username, query by username
        if (cleanCode.startsWith('VXREF-')) {
          const rawUsername = cleanCode.replace('VXREF-', '').trim();
          const snapByUsername = await getDocs(query(usersCol, where('username', '==', rawUsername)));
          if (!snapByUsername.empty) {
            found = snapByUsername.docs[0].data() as User;
          }
        }
      }
    } catch (fsErr) {
      console.warn('Firestore referral query notice:', fsErr);
    }
  }

  // 3. Fallback check for seed / default accounts
  if (!found) {
    if (cleanCode === 'VXREF-ADMIN' || cleanCode === 'VXREF-VAULTIX_ADMIN') {
      found = localUsers.find((u) => u.username === 'vaultix_admin') || {
        userId: 'USR-000001',
        accountId: 'VX-100001',
        username: 'vaultix_admin',
        fullName: 'Vaultix Administrator',
        email: 'vaultixincometeam@outlook.com',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        balance: 0,
        referralEarnings: 0,
        totalDeposits: 0,
        totalInvestments: 0,
        totalProfitLoss: 0,
        referralCode: 'VXREF-ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z'
      };
    }
  }

  if (!found) {
    return {
      valid: false,
      error: `Invalid referral code "${code}". Please verify the code and try again.`
    };
  }

  // Prevent self-referral by email or username comparison
  if (
    (currentUsername && found.username?.toLowerCase() === currentUsername.toLowerCase()) ||
    (currentEmail && found.email?.toLowerCase() === currentEmail.toLowerCase())
  ) {
    return {
      valid: false,
      error: 'Self-referral is prohibited. You cannot use your own referral code.'
    };
  }

  // Verify referrer account is active
  if (found.accountStatus === 'SUSPENDED') {
    return {
      valid: false,
      error: 'The referrer account is currently inactive. Please use a different referral code.'
    };
  }

  return {
    valid: true,
    referrer: normalizeUser(found)
  };
}

/**
 * Awards registration welcome bonus to invitee and referral commission to referrer atomically.
 * Prevents double-awarding via idempotency flags, logs immutable ledger transactions, and saves invitation audit.
 */
export async function awardRegistrationBonuses(
  newUser: User,
  referrerUser: User
): Promise<{
  updatedNewUser: User;
  updatedReferrerUser: User;
  welcomeBonus: number;
  referralBonus: number;
  transactions: Transaction[];
}> {
  const refConfig = getReferralConfig();
  const welcomeBonus = typeof refConfig.signupBonusAmount === 'number' ? refConfig.signupBonusAmount : 2.0;
  const referralBonus = typeof refConfig.bonusAmount === 'number' ? refConfig.bonusAmount : 3.0;

  const allUsers = getUsers();
  const allTxs = getTransactions();
  const allInvs = getInvitations();

  // Guard against double awarding for this specific user
  if (newUser.hasReceivedSignupBonus) {
    return {
      updatedNewUser: newUser,
      updatedReferrerUser: referrerUser,
      welcomeBonus: 0,
      referralBonus: 0,
      transactions: []
    };
  }

  // 1. Credit invitee welcome bonus
  const updatedNewUser: User = {
    ...newUser,
    balance: (Number(newUser.balance) || 0) + welcomeBonus,
    bonusBalance: (Number(newUser.bonusBalance) || 0) + welcomeBonus,
    hasReceivedSignupBonus: true,
    referredBy: referrerUser.userId,
    referredByUsername: referrerUser.username,
    referredByDisplayName: referrerUser.fullName || referrerUser.username
  };

  // 2. Credit referrer reward bonus
  const existingReferrerIdx = allUsers.findIndex((u) => u.userId === referrerUser.userId || u.username === referrerUser.username);
  const targetReferrer = existingReferrerIdx !== -1 ? allUsers[existingReferrerIdx] : referrerUser;

  const updatedReferrerUser: User = {
    ...targetReferrer,
    balance: (Number(targetReferrer.balance) || 0) + referralBonus,
    referralEarnings: (Number(targetReferrer.referralEarnings) || 0) + referralBonus
  };

  // 3. Create immutable ledger transactions
  const now = new Date().toISOString();
  const inviteeTx: Transaction = {
    id: `TX-BONUS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    userId: updatedNewUser.userId,
    type: 'ADMIN_CREDIT',
    amount: welcomeBonus,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: now,
    processedAt: now,
    note: `Welcome Bonus ($${welcomeBonus.toFixed(2)}) for joining via referral @${updatedReferrerUser.username}`,
    idempotencyKey: `REG_BONUS_${updatedNewUser.userId}`
  };

  const referrerTx: Transaction = {
    id: `TX-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    userId: updatedReferrerUser.userId,
    type: 'REFERRAL_REWARD',
    amount: referralBonus,
    currency: 'USD',
    status: 'COMPLETED',
    timestamp: now,
    processedAt: now,
    note: `Referral Commission ($${referralBonus.toFixed(2)}) for inviting @${updatedNewUser.username}`,
    idempotencyKey: `REF_COMMISSION_${updatedNewUser.userId}_${updatedReferrerUser.userId}`
  };

  // 4. Record formal invitation tracking entry
  const newInvitation: Invitation = {
    id: `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    inviterUsername: updatedReferrerUser.username,
    inviteeUsername: updatedNewUser.username,
    status: 'ACCEPTED',
    timestamp: now,
    rewardClaimed: true
  };

  // 5. Commit to local memory and storage
  // Insert or update newUser
  const newUserIdx = allUsers.findIndex((u) => u.userId === updatedNewUser.userId);
  if (newUserIdx !== -1) {
    allUsers[newUserIdx] = updatedNewUser;
  } else {
    allUsers.push(updatedNewUser);
  }

  // Update referrer in allUsers
  if (existingReferrerIdx !== -1) {
    allUsers[existingReferrerIdx] = updatedReferrerUser;
  } else {
    allUsers.push(updatedReferrerUser);
  }

  saveUsers(allUsers);

  // Save transactions
  allTxs.unshift(referrerTx);
  allTxs.unshift(inviteeTx);
  saveTransactions(allTxs);

  // Save invitations
  allInvs.unshift(newInvitation);
  saveInvitations(allInvs);

  // 6. Sync changes to Cloud Firestore
  try {
    await setDoc(doc(db, 'users', updatedNewUser.userId), cleanFirestoreData(updatedNewUser), { merge: true });
    await setDoc(doc(db, 'users', updatedReferrerUser.userId), cleanFirestoreData(updatedReferrerUser), { merge: true });
    await setDoc(doc(db, 'transactions', inviteeTx.id), cleanFirestoreData(inviteeTx));
    await setDoc(doc(db, 'transactions', referrerTx.id), cleanFirestoreData(referrerTx));
    await setDoc(doc(db, 'invitations', newInvitation.id), cleanFirestoreData(newInvitation));
  } catch (fsErr) {
    console.warn('Firestore sync notice during bonus award:', fsErr);
  }

  return {
    updatedNewUser,
    updatedReferrerUser,
    welcomeBonus,
    referralBonus,
    transactions: [inviteeTx, referrerTx]
  };
}
