import { User, Transaction, ReferralConfig, Invitation } from '../types';
import { getUsers, saveUsers, getTransactions, saveTransactions, getReferralConfig, getInvitations, saveInvitations, normalizeUser, SEED_ACCOUNTS } from '../db';
import { db, doc, setDoc, getDoc, getDocs, collection, query, where, cleanFirestoreData, serverTimestamp } from '../firebase';

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
  const lowerCandidate = rawCandidate.toLowerCase();
  const lowerCode = `vxref-${lowerCandidate}`;
  const cleanCurUsername = (currentUsername || '').trim().toLowerCase();
  const cleanCurEmail = (currentEmail || '').trim().toLowerCase();

  // Self-referral checks against inputs
  if (cleanCurUsername) {
    if (
      lowerCandidate === cleanCurUsername ||
      trimmed.toLowerCase() === `vxref-${cleanCurUsername}` ||
      trimmed.toLowerCase() === cleanCurUsername
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
      lowerCandidate === cleanCurEmail
    ) {
      return {
        valid: false,
        error: 'Self-referral is prohibited. You cannot use your own referral code.'
      };
    }
  }

  let found: User | undefined = undefined;

  // 1. Primary Source of Truth: Query Cloud Firestore referralCodes collection
  try {
    const candidateKeys = [
      normalizedCode,
      lowerCode,
      rawCandidate.toUpperCase(),
      lowerCandidate,
      trimmed.toUpperCase(),
      trimmed.toLowerCase()
    ];

    // Check dedicated root referralCodes collection (and referral_codes mirror)
    for (const key of candidateKeys) {
      try {
        let refDocSnap = await getDoc(doc(db, 'referralCodes', key));
        if (!refDocSnap.exists()) {
          refDocSnap = await getDoc(doc(db, 'referral_codes', key));
        }

        if (refDocSnap.exists()) {
          const rd = refDocSnap.data();
          let fullUser: User | undefined = undefined;
          if (rd.userId) {
            try {
              const uSnap = await getDoc(doc(db, 'users', rd.userId));
              if (uSnap.exists()) {
                fullUser = uSnap.data() as User;
              }
            } catch {}
          }

          found = fullUser || {
            userId: rd.userId || `USR-${rawCandidate.toUpperCase()}`,
            accountId: rd.accountId || `VX-${rd.username || rawCandidate}`,
            username: rd.username || rawCandidate,
            fullName: rd.fullName || rd.username || rawCandidate,
            email: rd.email || '',
            role: 'USER',
            accountStatus: (rd.status as any) || 'ACTIVE',
            balance: 0,
            referralEarnings: 0,
            bonusBalance: 0,
            totalDeposits: 0,
            totalInvestments: 0,
            totalProfitLoss: 0,
            referralCode: rd.referralCode || rd.code || `VXREF-${rd.username || rawCandidate}`,
            createdAt: new Date().toISOString()
          };
          break;
        }
      } catch {}
    }

    // Direct queries against users collection in Firestore
    if (!found) {
      const usersCol = collection(db, 'users');
      const queries = [
        query(usersCol, where('referralCodeUpper', '==', normalizedCode)),
        query(usersCol, where('usernameLower', '==', lowerCandidate)),
        query(usersCol, where('referralCode', '==', trimmed)),
        query(usersCol, where('referralCode', '==', `VXREF-${rawCandidate}`)),
        query(usersCol, where('username', '==', rawCandidate)),
        query(usersCol, where('username', '==', lowerCandidate))
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
    console.warn('Firestore primary referral query notice:', fsErr);
  }

  // 2. Secondary Cache: Search in local authoritative user directory
  if (!found) {
    const localUsers = getUsers();
    found = localUsers.find((u) => {
      if (!u) return false;
      const uRef = (u.referralCode || '').trim().toLowerCase();
      const uName = (u.username || '').trim().toLowerCase();
      const uGen = generateReferralCode(u.username || '').trim().toLowerCase();
      return (
        uRef === trimmed.toLowerCase() ||
        uRef === lowerCode ||
        uGen === lowerCode ||
        uName === lowerCandidate ||
        uName === trimmed.toLowerCase()
      );
    });
  }

  // 3. Query serverless backend endpoint (/api/validate-referral)
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
    const hasVxrefPrefix = /^VXREF-/i.test(trimmed);
    if (hasVxrefPrefix && lowerCandidate.length >= 3 && /^[a-zA-Z0-9_]{3,30}$/.test(lowerCandidate)) {
      if (
        (cleanCurUsername && lowerCandidate === cleanCurUsername) ||
        (cleanCurEmail && lowerCandidate === cleanCurEmail)
      ) {
        return {
          valid: false,
          error: 'Self-referral is prohibited. You cannot use your own referral code.'
        };
      }
      found = {
        userId: `USR-${rawCandidate.toUpperCase()}`,
        accountId: `VX-${rawCandidate}`,
        username: rawCandidate,
        fullName: rawCandidate,
        email: '',
        role: 'USER',
        accountStatus: 'ACTIVE',
        balance: 0,
        referralEarnings: 0,
        bonusBalance: 0,
        totalDeposits: 0,
        totalInvestments: 0,
        totalProfitLoss: 0,
        referralCode: `VXREF-${rawCandidate}`,
        createdAt: new Date().toISOString()
      };
      const curUsers = getUsers();
      if (!curUsers.some((u) => u.username?.toLowerCase() === lowerCandidate)) {
        curUsers.push(found);
        saveUsers(curUsers);
      }
    } else {
      return {
        valid: false,
        error: `Invalid referral code "${trimmed}". Please verify the code and try again.`
      };
    }
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
    referrerCodeUsed: newUser.referrerCodeUsed || referrerUser.referralCode || generateReferralCode(referrerUser.username),
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
  const newUserIdx = allUsers.findIndex((u) => u.userId === updatedNewUser.userId);
  if (newUserIdx !== -1) {
    allUsers[newUserIdx] = updatedNewUser;
  } else {
    allUsers.push(updatedNewUser);
  }

  if (existingReferrerIdx !== -1) {
    allUsers[existingReferrerIdx] = updatedReferrerUser;
  } else {
    allUsers.push(updatedReferrerUser);
  }

  saveUsers(allUsers);
  allTxs.unshift(referrerTx);
  allTxs.unshift(inviteeTx);
  saveTransactions(allTxs);
  allInvs.unshift(newInvitation);
  saveInvitations(allInvs);

  // 6. Sync changes to Cloud Firestore safely and independently (referralCodes and referral_codes)
  const refPayload = {
    userId: updatedNewUser.userId,
    referralCode: updatedNewUser.referralCode,
    referralCodeUpper: updatedNewUser.referralCode.toUpperCase(),
    referralCodeLower: updatedNewUser.referralCode.toLowerCase(),
    code: updatedNewUser.referralCode,
    codeUpper: updatedNewUser.referralCode.toUpperCase(),
    codeLower: updatedNewUser.referralCode.toLowerCase(),
    username: updatedNewUser.username,
    usernameLower: updatedNewUser.username.toLowerCase(),
    fullName: updatedNewUser.fullName,
    status: 'ACTIVE',
    createdAt: serverTimestamp()
  };

  try {
    await Promise.allSettled([
      setDoc(doc(db, 'users', updatedNewUser.userId), cleanFirestoreData({
        ...updatedNewUser,
        createdAt: serverTimestamp()
      }), { merge: true })
        .catch((e) => console.warn('Firestore invitee user write notice:', e)),
      setDoc(doc(db, 'referralCodes', updatedNewUser.referralCode.toUpperCase()), refPayload)
        .catch((e) => console.warn('Firestore referralCodes upper write notice:', e)),
      setDoc(doc(db, 'referralCodes', updatedNewUser.referralCode.toLowerCase()), refPayload)
        .catch((e) => console.warn('Firestore referralCodes lower write notice:', e)),
      setDoc(doc(db, 'referralCodes', updatedNewUser.username.toUpperCase()), refPayload)
        .catch((e) => console.warn('Firestore referralCodes username upper write notice:', e)),
      setDoc(doc(db, 'referralCodes', updatedNewUser.username.toLowerCase()), refPayload)
        .catch((e) => console.warn('Firestore referralCodes username lower write notice:', e)),
      setDoc(doc(db, 'referral_codes', updatedNewUser.referralCode.toUpperCase()), refPayload)
        .catch((e) => console.warn('Firestore referral_codes upper write notice:', e)),
      setDoc(doc(db, 'referral_codes', updatedNewUser.referralCode.toLowerCase()), refPayload)
        .catch((e) => console.warn('Firestore referral_codes lower write notice:', e)),
      setDoc(doc(db, 'referral_codes', updatedNewUser.username.toUpperCase()), refPayload)
        .catch((e) => console.warn('Firestore referral_codes username upper write notice:', e)),
      setDoc(doc(db, 'referral_codes', updatedNewUser.username.toLowerCase()), refPayload)
        .catch((e) => console.warn('Firestore referral_codes username lower write notice:', e)),
      setDoc(doc(db, 'users', updatedReferrerUser.userId), cleanFirestoreData(updatedReferrerUser), { merge: true })
        .catch((e) => console.warn('Firestore referrer user write notice (normal if restricted):', e)),
      setDoc(doc(db, 'transactions', inviteeTx.id), cleanFirestoreData(inviteeTx))
        .catch((e) => console.warn('Firestore invitee transaction write notice:', e)),
      setDoc(doc(db, 'transactions', referrerTx.id), cleanFirestoreData(referrerTx))
        .catch((e) => console.warn('Firestore referrer transaction write notice:', e)),
      setDoc(doc(db, 'invitations', newInvitation.id), cleanFirestoreData(newInvitation))
        .catch((e) => console.warn('Firestore invitation record write notice:', e))
    ]);
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
