import { User, Transaction, ReferralConfig, Invitation } from '../types';
import { getUsers, saveUsers, getTransactions, saveTransactions, getReferralConfig, getInvitations, saveInvitations, normalizeUser, SEED_ACCOUNTS } from '../db';
import { db, doc, setDoc, getDoc, getDocs, collection, query, where, cleanFirestoreData } from '../firebase';

/**
 * Generates an authoritative, username-based referral code.
 * Format: VXREF-[Username] (e.g. Diego511 -> VXREF-Diego511, ben -> VXREF-ben)
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
    if (equalMatch && equalMatch[1]) return equalMatch[1];

    // Pattern 2: URL search params
    const parsed = new URL(targetUrl, 'https://vaultixincome.com');
    const refParam = parsed.searchParams.get('ref') || parsed.searchParams.get('referral');
    if (refParam) return refParam.trim();

    // Pattern 3: Path segment /ref/VXREF-...
    const pathMatch = targetUrl.match(/\/ref\/(VXREF-[A-Za-z0-9_-]+)/i);
    if (pathMatch && pathMatch[1]) return pathMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Authoritatively validates a referral code against local database, backend API, and Cloud Firestore.
 * Requirements:
 * 1. Support existing VXREF-[Username] format in any casing.
 * 2. Validate against actual registered users and referral records.
 * 3. Case-insensitive matching while preserving registered username/ownership.
 * 4. Usernames containing numbers and special characters supported.
 * 5. Confirm code belongs to an existing eligible user before accepting.
 * 6. Reject genuinely invalid codes with exact clear error message.
 * 7. Prevent self-referrals completely.
 */
export async function validateReferralCodeAsync(
  code: string,
  currentUsername?: string,
  currentEmail?: string
): Promise<{ valid: boolean; referrer?: User; error?: string }> {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a referral code.' };
  }

  const rawCandidate = trimmed.replace(/^VXREF-/i, '').trim();
  const normalizedCode = `VXREF-${rawCandidate.toUpperCase()}`;
  const cleanCurUsername = (currentUsername || '').trim().toLowerCase();
  const cleanCurEmail = (currentEmail || '').trim().toLowerCase();

  // Self-referral checks against inputs
  if (cleanCurUsername) {
    if (
      rawCandidate.toLowerCase() === cleanCurUsername ||
      trimmed.toUpperCase() === `VXREF-${cleanCurUsername.toUpperCase()}` ||
      trimmed.toUpperCase() === cleanCurUsername.toUpperCase()
    ) {
      return {
        valid: false,
        error: 'Self-referral is prohibited. You cannot use your own referral code.'
      };
    }
  }

  if (cleanCurEmail) {
    if (
      trimmed.toLowerCase() === cleanCurEmail ||
      rawCandidate.toLowerCase() === cleanCurEmail
    ) {
      return {
        valid: false,
        error: 'Self-referral is prohibited. You cannot use your own referral code.'
      };
    }
  }

  let found: User | undefined = undefined;

  // 1. Search in local authoritative user directory (case-insensitive)
  const localUsers = getUsers();
  found = localUsers.find((u) => {
    if (!u) return false;
    const uRef = (u.referralCode || '').trim().toUpperCase();
    const uName = (u.username || '').trim().toUpperCase();
    const uGen = generateReferralCode(u.username || '').trim().toUpperCase();
    return (
      uRef === trimmed.toUpperCase() ||
      uRef === normalizedCode ||
      uGen === normalizedCode ||
      uName === rawCandidate.toUpperCase() ||
      uName === trimmed.toUpperCase()
    );
  });

  // 2. Query serverless backend endpoint (/api/validate-referral) if running in web/hybrid mode
  if (!found && typeof fetch !== 'undefined') {
    try {
      const resp = await fetch('/api/validate-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: trimmed,
          currentUsername: cleanCurUsername,
          currentEmail: cleanCurEmail
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.valid && data.referrer) {
          found = data.referrer as User;
        } else if (data?.isSelfReferral) {
          return {
            valid: false,
            error: data.error || 'Self-referral is prohibited. You cannot use your own referral code.'
          };
        }
      }
    } catch {
      // Offline or network fallback
    }
  }

  // 3. Query Cloud Firestore (with case variations and public referral directory)
  if (!found) {
    try {
      // 3A. Public referral_codes collection
      try {
        const refDocSnap = await getDoc(doc(db, 'referral_codes', normalizedCode));
        if (refDocSnap.exists()) {
          const rd = refDocSnap.data();
          found = {
            userId: rd.userId,
            accountId: rd.accountId || `VX-${rd.username}`,
            username: rd.username,
            fullName: rd.fullName || rd.username,
            email: rd.email || '',
            role: 'USER',
            accountStatus: (rd.status as any) || 'ACTIVE',
            balance: 0,
            referralEarnings: 0,
            bonusBalance: 0,
            totalDeposits: 0,
            totalInvestments: 0,
            totalProfitLoss: 0,
            referralCode: rd.code || trimmed,
            createdAt: new Date().toISOString()
          };
        }
      } catch {}

      // 3B. Direct queries against users collection
      if (!found) {
        const usersCol = collection(db, 'users');
        const queries = [
          query(usersCol, where('referralCode', '==', trimmed)),
          query(usersCol, where('referralCode', '==', `VXREF-${rawCandidate}`)),
          query(usersCol, where('referralCode', '==', normalizedCode)),
          query(usersCol, where('username', '==', rawCandidate)),
          query(usersCol, where('username', '==', rawCandidate.toLowerCase()))
        ];

        for (const q of queries) {
          try {
            const snap = await getDocs(q);
            if (!snap.empty) {
              found = snap.docs[0].data() as User;
              break;
            }
          } catch {}
        }
      }
    } catch (fsErr) {
      console.warn('Firestore referral query notice:', fsErr);
    }
  }

  // 4. Fallback check for verified platform / seed accounts
  if (!found) {
    const cleanUpper = trimmed.toUpperCase();
    const extUpper = rawCandidate.toUpperCase();

    const seedFound = SEED_ACCOUNTS.find((s) => {
      const sRef = (s.referralCode || '').trim().toUpperCase();
      const sName = (s.username || '').trim().toUpperCase();
      return (
        sRef === cleanUpper ||
        sRef === normalizedCode ||
        sName === extUpper ||
        `VXREF-${sName}` === normalizedCode
      );
    });

    if (seedFound) {
      found = seedFound;
    }
  }

  if (!found) {
    return {
      valid: false,
      error: `Invalid referral code "${trimmed}". Please verify the code and try again.`
    };
  }

  // Prevent self-referral against resolved referrer user
  if (
    (cleanCurUsername && found.username?.toLowerCase() === cleanCurUsername) ||
    (cleanCurEmail && found.email?.toLowerCase() === cleanCurEmail)
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
    await setDoc(doc(db, 'referral_codes', updatedNewUser.referralCode.toUpperCase()), {
      code: updatedNewUser.referralCode,
      codeUpper: updatedNewUser.referralCode.toUpperCase(),
      username: updatedNewUser.username,
      usernameLower: updatedNewUser.username.toLowerCase(),
      userId: updatedNewUser.userId,
      fullName: updatedNewUser.fullName,
      status: 'ACTIVE'
    });
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
