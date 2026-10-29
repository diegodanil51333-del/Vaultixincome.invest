// scripts/test-10-account-staging.mjs
// Authoritative 10-Account Referral Staging Test Suite for Vaultix Income

import assert from 'assert';

console.log('===============================================================');
console.log('   VAULTIX INCOME: 10-ACCOUNT STAGING & REFERRAL AUDIT TEST   ');
console.log('===============================================================\n');

// Mock in-memory database store
const mockUsers = new Map();
const mockTransactions = [];
const mockInvitations = [];

const DEFAULT_CONFIG = {
  bonusAmount: 3.0,
  signupBonusAmount: 2.0,
  withdrawalThreshold: 50.0,
  isActive: true
};

function generateReferralCode(username) {
  if (!username) return 'VXREF-MEMBER';
  return `VXREF-${username.trim()}`;
}

function normalizeUser(rawUser) {
  const username = rawUser.username || 'investor';
  const formattedRefCode = (rawUser.referralCode && !rawUser.referralCode.match(/^VXREF-\d{4}$/))
    ? rawUser.referralCode
    : generateReferralCode(username);

  return {
    userId: rawUser.userId,
    accountId: rawUser.accountId,
    username,
    fullName: rawUser.fullName || username,
    email: (rawUser.email || '').toLowerCase(),
    role: rawUser.role || 'USER',
    accountStatus: rawUser.accountStatus || 'ACTIVE',
    balance: Number(rawUser.balance) || 0,
    referralEarnings: Number(rawUser.referralEarnings) || 0,
    bonusBalance: Number(rawUser.bonusBalance) || 0,
    totalDeposits: Number(rawUser.totalDeposits) || 0,
    totalInvestments: Number(rawUser.totalInvestments) || 0,
    totalProfitLoss: Number(rawUser.totalProfitLoss) || 0,
    referralCode: formattedRefCode,
    referredBy: rawUser.referredBy || null,
    referredByUsername: rawUser.referredByUsername || null,
    referredByDisplayName: rawUser.referredByDisplayName || null,
    hasReceivedSignupBonus: Boolean(rawUser.hasReceivedSignupBonus),
    createdAt: rawUser.createdAt || new Date().toISOString()
  };
}

function validateReferralCode(code, currentUsername, currentEmail) {
  if (!code || !code.trim()) return { valid: false, error: 'Referral code cannot be blank' };
  const cleanCode = code.trim().toUpperCase();

  // Self-referral check
  if (currentUsername) {
    const ownCode = generateReferralCode(currentUsername).toUpperCase();
    if (cleanCode === ownCode || cleanCode === `VXREF-${currentUsername.trim().toUpperCase()}`) {
      return { valid: false, isSelfReferral: true, error: 'Self-referral is prohibited. You cannot use your own referral code.' };
    }
  }

  // Look up in store
  for (const u of mockUsers.values()) {
    const uCode = (u.referralCode || '').toUpperCase();
    const uDerived = generateReferralCode(u.username || '').toUpperCase();
    if (uCode === cleanCode || uDerived === cleanCode) {
      if (currentEmail && u.email && u.email.toLowerCase() === currentEmail.toLowerCase()) {
        return { valid: false, isSelfReferral: true, error: 'Self-referral is prohibited.' };
      }
      return { valid: true, referrer: u };
    }
  }

  // Derived check for VXREF-Username pattern
  if (cleanCode.startsWith('VXREF-')) {
    const rawName = cleanCode.replace('VXREF-', '').trim();
    for (const u of mockUsers.values()) {
      if (u.username.toUpperCase() === rawName.toUpperCase()) {
        return { valid: true, referrer: u };
      }
    }
  }

  return { valid: false, error: `Invalid referral code "${code}" provided.` };
}

function registerAccount({ username, fullName, email, password, referralCodeInput }) {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Strict Uniqueness Checks
  for (const u of mockUsers.values()) {
    if (u.username.toLowerCase() === cleanUsername.toLowerCase()) {
      return { success: false, error: 'This username is already taken. Please choose another username.' };
    }
    if (u.email.toLowerCase() === cleanEmail) {
      return { success: false, error: 'An account with this email already exists. Please sign in or use a different email.' };
    }
  }

  // 2. Validate Referral Code if provided
  let referrer = null;
  if (referralCodeInput && referralCodeInput.trim()) {
    const valRes = validateReferralCode(referralCodeInput.trim(), cleanUsername, cleanEmail);
    if (!valRes.valid) {
      return { success: false, error: valRes.error };
    }
    referrer = valRes.referrer;
  }

  // 3. Create User Document
  const uid = `USR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const accId = `VX-${Math.floor(100000 + Math.random() * 900000)}`;
  const rawUser = {
    userId: uid,
    accountId: accId,
    username: cleanUsername,
    fullName,
    email: cleanEmail,
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 0.0,
    referralEarnings: 0.0,
    bonusBalance: 0.0,
    totalDeposits: 0.0,
    totalInvestments: 0.0,
    totalProfitLoss: 0.0,
    referralCode: generateReferralCode(cleanUsername),
    referredBy: referrer ? referrer.userId : null,
    referredByUsername: referrer ? referrer.username : null,
    referredByDisplayName: referrer ? (referrer.fullName || referrer.username) : null,
    hasReceivedSignupBonus: false,
    createdAt: new Date().toISOString()
  };

  const user = normalizeUser(rawUser);
  mockUsers.set(user.userId, user);

  // 4. Award Bonuses Atomically
  if (referrer) {
    const welcomeAmt = DEFAULT_CONFIG.signupBonusAmount; // $2.00
    const referralAmt = DEFAULT_CONFIG.bonusAmount;      // $3.00

    // Credit Invitee
    user.balance += welcomeAmt;
    user.bonusBalance += welcomeAmt;
    user.hasReceivedSignupBonus = true;

    // Credit Referrer
    referrer.balance += referralAmt;
    referrer.referralEarnings += referralAmt;

    // Record Ledger Transactions
    const now = new Date().toISOString();
    const inviteeTx = {
      id: `TX-BONUS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: user.userId,
      type: 'ADMIN_CREDIT',
      amount: welcomeAmt,
      currency: 'USD',
      status: 'COMPLETED',
      timestamp: now,
      note: `Welcome Bonus ($${welcomeAmt.toFixed(2)}) for joining via referral @${referrer.username}`,
      idempotencyKey: `REG_BONUS_${user.userId}`
    };

    const referrerTx = {
      id: `TX-REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: referrer.userId,
      type: 'REFERRAL_REWARD',
      amount: referralAmt,
      currency: 'USD',
      status: 'COMPLETED',
      timestamp: now,
      note: `Referral Commission ($${referralAmt.toFixed(2)}) for inviting @${user.username}`,
      idempotencyKey: `REF_COMMISSION_${user.userId}_${referrer.userId}`
    };

    mockTransactions.push(inviteeTx, referrerTx);
    mockInvitations.push({
      id: `INV-${Date.now()}`,
      inviterUsername: referrer.username,
      inviteeUsername: user.username,
      status: 'ACCEPTED',
      timestamp: now,
      rewardClaimed: true
    });
  }

  return { success: true, user, referrer };
}

// -------------------------------------------------------------
// STEP 1: Register Account 1 (Diego511)
// -------------------------------------------------------------
console.log('>>> [STEP 1] Registering Account 1: Diego511...');
const res1 = registerAccount({
  username: 'Diego511',
  fullName: 'Diego Danili',
  email: 'diego511@vaultix.test',
  password: 'Password123!',
  referralCodeInput: ''
});

assert.strictEqual(res1.success, true);
assert.strictEqual(res1.user.username, 'Diego511');
assert.strictEqual(res1.user.referralCode, 'VXREF-Diego511');
assert.strictEqual(res1.user.balance, 0.0);
assert.strictEqual(res1.user.referralEarnings, 0.0);
console.log('   ✓ Account 1 (Diego511) created successfully.');
console.log(`   ✓ Referral Code strictly generated as: ${res1.user.referralCode}`);

// -------------------------------------------------------------
// STEP 2: Edge Case & Security Validation Tests
// -------------------------------------------------------------
console.log('\n>>> [STEP 2] Running Security & Edge Case Tests...');

// 2A: Self-referral attempt
console.log('   Testing self-referral prevention for Diego511...');
const selfRefTest = registerAccount({
  username: 'TestClone',
  fullName: 'Test Clone',
  email: 'clone@vaultix.test',
  password: 'Password123!',
  referralCodeInput: 'VXREF-TestClone'
});
assert.strictEqual(selfRefTest.success, false);
assert.strictEqual(selfRefTest.error, 'Self-referral is prohibited. You cannot use your own referral code.');
console.log('   ✓ Self-referral attempt blocked with exact security error message.');

// 2B: Duplicate username attempt
console.log('   Testing duplicate username prevention...');
const dupUserTest = registerAccount({
  username: 'Diego511',
  fullName: 'Diego Imposter',
  email: 'imposter@vaultix.test',
  password: 'Password123!',
  referralCodeInput: ''
});
assert.strictEqual(dupUserTest.success, false);
assert.strictEqual(dupUserTest.error, 'This username is already taken. Please choose another username.');
console.log('   ✓ Duplicate username blocked with exact required error message.');

// 2C: Duplicate email attempt
console.log('   Testing duplicate email prevention...');
const dupEmailTest = registerAccount({
  username: 'DifferentName',
  fullName: 'Diego Imposter 2',
  email: 'diego511@vaultix.test',
  password: 'Password123!',
  referralCodeInput: ''
});
assert.strictEqual(dupEmailTest.success, false);
assert.strictEqual(dupEmailTest.error, 'An account with this email already exists. Please sign in or use a different email.');
console.log('   ✓ Duplicate email blocked with exact required error message.');

// 2D: Invalid referral code attempt
console.log('   Testing invalid referral code rejection...');
const invalidCodeTest = registerAccount({
  username: 'UserInvalidCode',
  fullName: 'User Invalid',
  email: 'invalid@vaultix.test',
  password: 'Password123!',
  referralCodeInput: 'VXREF-FAKESTRING999'
});
assert.strictEqual(invalidCodeTest.success, false);
assert.ok(invalidCodeTest.error.includes('Invalid referral code'));
console.log('   ✓ Invalid referral code rejected cleanly.');

// -------------------------------------------------------------
// STEP 3: Register Accounts 2 to 8 (Referred by Diego511)
// -------------------------------------------------------------
console.log('\n>>> [STEP 3] Registering Accounts 2 through 8 via Diego511\'s code (VXREF-Diego511)...');

const directInvitees = [
  { username: 'James121', fullName: 'James Carter', email: 'james121@vaultix.test' },
  { username: 'Sarah88', fullName: 'Sarah Jenkins', email: 'sarah88@vaultix.test' },
  { username: 'Marcus99', fullName: 'Marcus Vance', email: 'marcus99@vaultix.test' },
  { username: 'Elena77', fullName: 'Elena Rostova', email: 'elena77@vaultix.test' },
  { username: 'Lucas44', fullName: 'Lucas Bennett', email: 'lucas44@vaultix.test' },
  { username: 'Maya22', fullName: 'Maya Lin', email: 'maya22@vaultix.test' },
  { username: 'Victor55', fullName: 'Victor Hugo', email: 'victor55@vaultix.test' },
];

for (let i = 0; i < directInvitees.length; i++) {
  const inv = directInvitees[i];
  const accNum = i + 2;
  const res = registerAccount({
    username: inv.username,
    fullName: inv.fullName,
    email: inv.email,
    password: 'Password123!',
    referralCodeInput: 'VXREF-Diego511'
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.user.referralCode, `VXREF-${inv.username}`);
  assert.strictEqual(res.user.referredByUsername, 'Diego511');
  assert.strictEqual(res.user.balance, 2.0); // Exactly $2.00 welcome bonus
  assert.strictEqual(res.user.hasReceivedSignupBonus, true);

  console.log(`   ✓ Account ${accNum} (${inv.username}): Code ${res.user.referralCode} | Balance: $${res.user.balance.toFixed(2)} (+$2.00 Welcome) | Referrer: @Diego511`);
}

// Verify Diego511's accumulated balance after 7 direct referrals
const diegoUser = mockUsers.get(res1.user.userId);
assert.strictEqual(diegoUser.referralEarnings, 21.0); // 7 * $3.00
assert.strictEqual(diegoUser.balance, 21.0);
console.log(`\n   ✓ Referrer Diego511 balance verified: $${diegoUser.balance.toFixed(2)} USD (7 x $3.00 referral commission).`);

// -------------------------------------------------------------
// STEP 4: Chained Referrals (Accounts 9 & 10)
// -------------------------------------------------------------
console.log('\n>>> [STEP 4] Registering Accounts 9 & 10 via Secondary Referrers (Chained Tree)...');

// Account 9 referred by James121 (VXREF-James121)
const res9 = registerAccount({
  username: 'Aria33',
  fullName: 'Aria Montgomery',
  email: 'aria33@vaultix.test',
  password: 'Password123!',
  referralCodeInput: 'VXREF-James121'
});
assert.strictEqual(res9.success, true);
assert.strictEqual(res9.user.referralCode, 'VXREF-Aria33');
assert.strictEqual(res9.user.referredByUsername, 'James121');
assert.strictEqual(res9.user.balance, 2.0); // $2.00 Welcome bonus

// James121 should now have $2.00 welcome bonus + $3.00 referral commission = $5.00
const jamesUser = Array.from(mockUsers.values()).find(u => u.username === 'James121');
assert.strictEqual(jamesUser.balance, 5.0);
assert.strictEqual(jamesUser.referralEarnings, 3.0);
console.log(`   ✓ Account 9 (Aria33): Code VXREF-Aria33 | Balance: $2.00 | Referrer: @James121`);
console.log(`   ✓ Referrer James121 updated: Balance $${jamesUser.balance.toFixed(2)} ($2 welcome + $3 commission)`);

// Account 10 referred by Sarah88 (VXREF-Sarah88)
const res10 = registerAccount({
  username: 'Noah66',
  fullName: 'Noah Williams',
  email: 'noah66@vaultix.test',
  password: 'Password123!',
  referralCodeInput: 'VXREF-Sarah88'
});
assert.strictEqual(res10.success, true);
assert.strictEqual(res10.user.referralCode, 'VXREF-Noah66');
assert.strictEqual(res10.user.referredByUsername, 'Sarah88');
assert.strictEqual(res10.user.balance, 2.0); // $2.00 Welcome bonus

// Sarah88 should now have $2.00 welcome bonus + $3.00 referral commission = $5.00
const sarahUser = Array.from(mockUsers.values()).find(u => u.username === 'Sarah88');
assert.strictEqual(sarahUser.balance, 5.0);
assert.strictEqual(sarahUser.referralEarnings, 3.0);
console.log(`   ✓ Account 10 (Noah66): Code VXREF-Noah66 | Balance: $2.00 | Referrer: @Sarah88`);
console.log(`   ✓ Referrer Sarah88 updated: Balance $${sarahUser.balance.toFixed(2)} ($2 welcome + $3 commission)`);

// -------------------------------------------------------------
// STEP 5: Full Directory & Financial Audit
// -------------------------------------------------------------
console.log('\n===============================================================');
console.log('             10-ACCOUNT STAGING VERIFICATION REPORT            ');
console.log('===============================================================');
console.log('ID | Username     | Referral Code   | Invited By  | Bal ($) | Ref Earn ($) | Status');
console.log('---|--------------|-----------------|-------------|---------|--------------|-------');

const allAccounts = Array.from(mockUsers.values());
assert.strictEqual(allAccounts.length, 10);

allAccounts.forEach((u, idx) => {
  const padNum = String(idx + 1).padStart(2, ' ');
  const padUser = u.username.padEnd(12, ' ');
  const padCode = u.referralCode.padEnd(15, ' ');
  const padRef = (u.referredByUsername ? `@${u.referredByUsername}` : 'Direct').padEnd(11, ' ');
  const padBal = `$${u.balance.toFixed(2)}`.padStart(7, ' ');
  const padEarn = `$${u.referralEarnings.toFixed(2)}`.padStart(12, ' ');
  console.log(`${padNum} | ${padUser} | ${padCode} | ${padRef} | ${padBal} | ${padEarn} | ACTIVE`);
});

console.log('---------------------------------------------------------------');
const totalDisbursedWelcome = allAccounts.filter(u => u.hasReceivedSignupBonus).length * 2.0;
const totalDisbursedReferral = allAccounts.reduce((sum, u) => sum + u.referralEarnings, 0);
console.log(`Total Accounts Registered:         ${allAccounts.length}`);
console.log(`Total Direct/Chained Referrals:    ${allAccounts.filter(u => u.referredByUsername).length}`);
console.log(`Total Welcome Bonuses Disbursed:   $${totalDisbursedWelcome.toFixed(2)} USD (9 x $2.00)`);
console.log(`Total Referral Rewards Disbursed:  $${totalDisbursedReferral.toFixed(2)} USD (9 x $3.00)`);
console.log(`Total Ledger Transactions Logged:  ${mockTransactions.length} immutable records`);
console.log(`Total Invitations Logged:          ${mockInvitations.length} records`);

assert.strictEqual(totalDisbursedWelcome, 18.0); // 9 invitees * $2.00
assert.strictEqual(totalDisbursedReferral, 27.0); // 9 referrals * $3.00
assert.strictEqual(mockTransactions.length, 18); // 9 invitee txs + 9 referrer txs
assert.strictEqual(mockInvitations.length, 9);

console.log('\n>>> ALL 10-ACCOUNT STAGING & REFERRAL VERIFICATIONS PASSED 100%! <<<');
