// scripts/test-referral-comprehensive.mjs
// Comprehensive Staging & Verification Test Suite for Vaultix Income Referral System

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

console.log('========================================================================');
console.log('    VAULTIX INCOME: COMPREHENSIVE REFERRAL & STAGING TEST SUITE         ');
console.log('========================================================================\n');

// Clean test environment store
const TEST_STORE_FILE = path.resolve(process.cwd(), '.authoritative_store.json');
if (fs.existsSync(TEST_STORE_FILE)) {
  fs.unlinkSync(TEST_STORE_FILE);
  console.log('Cleaned pre-existing .authoritative_store.json for pristine test isolation.\n');
}

// Dynamically import authoritative store from compiled or typescript via bun
const { AuthoritativeStore } = await import('../src/server/authoritative-store.ts').catch(async () => {
  // If importing .ts directly needs esbuild/bun support
  return await import('../api/register.js');
});

const store = new AuthoritativeStore();

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------------
// Test 1: Baseline Seed Accounts Check (Diego533 & Diego511)
// -------------------------------------------------------------
runTest('Baseline Seed Accounts - Diego533 exists with correct referralCode', () => {
  const users = store.getAllUsers();
  const diego533 = users.find(u => u.username.toLowerCase() === 'diego533');
  assert.ok(diego533, 'Diego533 must exist in authoritative store');
  assert.strictEqual(diego533.referralCode, 'VXREF-Diego533', 'Diego533 referralCode must be VXREF-Diego533');
  assert.strictEqual(diego533.balance, 10.62, 'Diego533 balance must be 10.62');
});

// -------------------------------------------------------------
// Test 2: Referral Validation for Diego533 (Case-Insensitive)
// -------------------------------------------------------------
runTest('Referral Code Validation - Exact, Lowercase, Uppercase, and Whitespace for Diego533', () => {
  // Exact
  const res1 = store.validateReferralCode('VXREF-Diego533');
  assert.ok(res1.valid, 'Exact code VXREF-Diego533 must be valid');
  assert.strictEqual(res1.referrer.username, 'Diego533');

  // Lowercase
  const res2 = store.validateReferralCode('vxref-diego533');
  assert.ok(res2.valid, 'Lowercase code vxref-diego533 must be valid');
  assert.strictEqual(res2.referrer.username, 'Diego533');

  // Uppercase
  const res3 = store.validateReferralCode('VXREF-DIEGO533');
  assert.ok(res3.valid, 'Uppercase code VXREF-DIEGO533 must be valid');
  assert.strictEqual(res3.referrer.username, 'Diego533');

  // Whitespace-padded
  const res4 = store.validateReferralCode('   VXREF-Diego533   ');
  assert.ok(res4.valid, 'Whitespace padded code must be valid');
  assert.strictEqual(res4.referrer.username, 'Diego533');

  // Bare username
  const res5 = store.validateReferralCode('diego533');
  assert.ok(res5.valid, 'Bare username diego533 must be valid as referral code');
  assert.strictEqual(res5.referrer.username, 'Diego533');
});

// -------------------------------------------------------------
// Test 3: Self-Referral Prevention
// -------------------------------------------------------------
runTest('Self-Referral Prevention - Username & Email matching', () => {
  const selfRes1 = store.validateReferralCode('VXREF-Diego533', 'Diego533', 'diegodanili51333@gmail.com');
  assert.strictEqual(selfRes1.valid, false, 'Self referral by username must fail');
  assert.strictEqual(selfRes1.isSelfReferral, true);

  const selfRes2 = store.validateReferralCode('vxref-diego533', 'other_user', 'diegodanili51333@gmail.com');
  assert.strictEqual(selfRes2.valid, false, 'Self referral by email must fail');
  assert.strictEqual(selfRes2.isSelfReferral, true);
});

// -------------------------------------------------------------
// Test 4: Invalid and Non-Existent Referral Code Rejection
// -------------------------------------------------------------
runTest('Invalid and Non-Existent Code Rejection', () => {
  const invRes = store.validateReferralCode('VXREF-nonexistent999');
  assert.strictEqual(invRes.valid, false, 'Non-existent code must be rejected');
  assert.strictEqual(invRes.error, 'Invalid referral code "VXREF-nonexistent999". Please verify the code and try again.');

  // Blank code is allowed (optional during signup)
  const blankRes = store.validateReferralCode('');
  assert.ok(blankRes.valid, 'Blank code must be valid');
  assert.strictEqual(blankRes.isBlank, true);
});

// -------------------------------------------------------------
// Test 5: Registration of 4 Primary Referrers (ben, alex123, michael, sarah2026)
// -------------------------------------------------------------
const primaryReferrers = [
  { username: 'ben', fullName: 'Ben Simmons', email: 'ben.simmons@vaultix.pro' },
  { username: 'alex123', fullName: 'Alex Turner', email: 'alex123@vaultix.pro' },
  { username: 'michael', fullName: 'Michael Chen', email: 'michael.chen@vaultix.pro' },
  { username: 'sarah2026', fullName: 'Sarah Jenkins', email: 'sarah2026@vaultix.pro' }
];

for (const refData of primaryReferrers) {
  runTest(`Register Primary Referrer: @${refData.username}`, () => {
    const newUser = {
      userId: `USR-${refData.username.toUpperCase()}`,
      accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
      username: refData.username,
      fullName: refData.fullName,
      email: refData.email,
      role: 'USER',
      accountStatus: 'ACTIVE',
      balance: 100.0,
      totalDeposits: 100.0,
      totalInvestments: 0.0,
      totalProfitLoss: 0.0,
      referralEarnings: 0.0,
      bonusBalance: 0.0,
      referralCode: `VXREF-${refData.username}`,
      createdAt: new Date().toISOString()
    };

    const regRes = store.registerUserWithReferral(newUser);
    assert.strictEqual(regRes.user.username, refData.username);
    assert.strictEqual(regRes.user.referralCode, `VXREF-${refData.username}`);

    // Verify stored on disk
    const fetched = store.getUser(newUser.userId);
    assert.ok(fetched, `User ${refData.username} must be persisted to store`);
    assert.strictEqual(fetched.referralCode, `VXREF-${refData.username}`);
  });
}

// -------------------------------------------------------------
// Test 6: Registration of Invitees using each Referrer's Code
// -------------------------------------------------------------
const inviteeTestCases = [
  {
    invitee: { username: 'clara_diego', fullName: 'Clara Oswald', email: 'clara.o@vaultix.pro' },
    referralCodeInput: 'VXREF-Diego533', // Inviting via Diego533
    expectedReferrer: 'Diego533'
  },
  {
    invitee: { username: 'david_ben', fullName: 'David Tennant', email: 'david.t@vaultix.pro' },
    referralCodeInput: 'vxref-ben', // Lowercase variation
    expectedReferrer: 'ben'
  },
  {
    invitee: { username: 'emma_alex', fullName: 'Emma Watson', email: 'emma.w@vaultix.pro' },
    referralCodeInput: 'VXREF-ALEX123', // Uppercase variation
    expectedReferrer: 'alex123'
  },
  {
    invitee: { username: 'fiona_michael', fullName: 'Fiona Gallagher', email: 'fiona.g@vaultix.pro' },
    referralCodeInput: 'VxReF-michael', // Mixed case variation
    expectedReferrer: 'michael'
  },
  {
    invitee: { username: 'george_sarah', fullName: 'George Martin', email: 'george.m@vaultix.pro' },
    referralCodeInput: 'sarah2026', // Bare username variation
    expectedReferrer: 'sarah2026'
  }
];

for (const tc of inviteeTestCases) {
  runTest(`Register Invitee @${tc.invitee.username} via code "${tc.referralCodeInput}" (Referrer: @${tc.expectedReferrer})`, () => {
    // Record initial referrer balance
    const allUsersBefore = store.getAllUsers();
    const referrerBefore = allUsersBefore.find(u => u.username.toLowerCase() === tc.expectedReferrer.toLowerCase());
    assert.ok(referrerBefore, `Referrer @${tc.expectedReferrer} must exist before invitee registration`);
    const refInitialEarnings = referrerBefore.referralEarnings || 0;
    const refInitialBalance = referrerBefore.balance || 0;

    const newInvitee = {
      userId: `USR-${tc.invitee.username.toUpperCase()}`,
      accountId: `VX-${Math.floor(100000 + Math.random() * 900000)}`,
      username: tc.invitee.username,
      fullName: tc.invitee.fullName,
      email: tc.invitee.email,
      role: 'USER',
      accountStatus: 'ACTIVE',
      balance: 0.0,
      totalDeposits: 0.0,
      totalInvestments: 0.0,
      totalProfitLoss: 0.0,
      referralEarnings: 0.0,
      bonusBalance: 0.0,
      createdAt: new Date().toISOString()
    };

    const regResult = store.registerUserWithReferral(newInvitee, tc.referralCodeInput);

    // Verify Invitee Received $2.00 Welcome Bonus
    assert.strictEqual(regResult.user.bonusBalance, 2.0, 'Invitee bonusBalance must be $2.00');
    assert.strictEqual(regResult.user.balance, 2.0, 'Invitee available balance must be $2.00');
    assert.strictEqual(regResult.user.hasReceivedSignupBonus, true, 'hasReceivedSignupBonus flag must be true');
    assert.strictEqual(regResult.user.referredByUsername, referrerBefore.username, 'referredByUsername must match referrer');
    assert.strictEqual(regResult.user.referralCode, `VXREF-${tc.invitee.username}`, 'New invitee must have generated code VXREF-[Username]');

    // Verify Referrer Received $3.00 Referral Commission
    const referrerAfter = store.getUser(referrerBefore.userId);
    assert.strictEqual(referrerAfter.referralEarnings, refInitialEarnings + 3.0, 'Referrer referralEarnings must increase by $3.00');
    assert.strictEqual(referrerAfter.balance, refInitialBalance + 3.0, 'Referrer available balance must increase by $3.00');

    // Verify Ledger Transactions were created
    assert.strictEqual(regResult.newTxs.length, 2, 'Must create 2 transaction records (1 for invitee, 1 for referrer)');
    const welcomeTx = regResult.newTxs.find(tx => tx.userId === newInvitee.userId);
    assert.ok(welcomeTx, 'Welcome transaction must exist');
    assert.strictEqual(welcomeTx.amount, 2.0);
    assert.strictEqual(welcomeTx.status, 'COMPLETED');

    const rewardTx = regResult.newTxs.find(tx => tx.userId === referrerBefore.userId);
    assert.ok(rewardTx, 'Referral reward transaction must exist');
    assert.strictEqual(rewardTx.amount, 3.0);
    assert.strictEqual(rewardTx.status, 'COMPLETED');
  });
}

// -------------------------------------------------------------
// Test 7: Duplicate Bonus Protection
// -------------------------------------------------------------
runTest('Duplicate Bonus Protection - Cannot award twice to same user', () => {
  const clara = store.getAllUsers().find(u => u.username === 'clara_diego');
  assert.ok(clara);
  const diego = store.getAllUsers().find(u => u.username === 'Diego533');
  const diegoEarningsBefore = diego.referralEarnings;
  const claraBalanceBefore = clara.balance;

  // Attempt to re-run registration for same user with referral code
  const secondAttempt = store.registerUserWithReferral(clara, 'VXREF-Diego533');
  assert.strictEqual(secondAttempt.user.balance, claraBalanceBefore, 'Balance must not change on duplicate registration');
  assert.strictEqual(secondAttempt.newTxs.length, 0, 'No new transactions should be minted');

  const diegoAfter = store.getUser(diego.userId);
  assert.strictEqual(diegoAfter.referralEarnings, diegoEarningsBefore, 'Referrer earnings must not increase on duplicate call');
});

// -------------------------------------------------------------
// Test 8: Admin Tracking & Verification of Referrer Attribution
// -------------------------------------------------------------
runTest('Admin Panel Tracking - Referrer relationships accurately logged', () => {
  const allUsers = store.getAllUsers();
  
  // Verify clara_diego was referred by Diego533
  const clara = allUsers.find(u => u.username === 'clara_diego');
  assert.strictEqual(clara.referredByUsername, 'Diego533');

  // Verify david_ben was referred by ben
  const david = allUsers.find(u => u.username === 'david_ben');
  assert.strictEqual(david.referredByUsername, 'ben');

  // Verify emma_alex was referred by alex123
  const emma = allUsers.find(u => u.username === 'emma_alex');
  assert.strictEqual(emma.referredByUsername, 'alex123');

  // Verify fiona_michael was referred by michael
  const fiona = allUsers.find(u => u.username === 'fiona_michael');
  assert.strictEqual(fiona.referredByUsername, 'michael');

  // Verify george_sarah was referred by sarah2026
  const george = allUsers.find(u => u.username === 'george_sarah');
  assert.strictEqual(george.referredByUsername, 'sarah2026');
});

console.log('\n========================================================================');
console.log(`  ALL ${testsPassed} / ${testsTotal} TESTS PASSED SUCCESSFULLY! (100% SUCCESS RATE)`);
console.log('========================================================================\n');
