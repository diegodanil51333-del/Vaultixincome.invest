// scripts/test-incognito-referral-flow.mjs
// End-to-end test simulating dynamic registration of TestUserA followed by incognito registration of TestUserB

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

console.log('========================================================================');
console.log('   END-TO-END DYNAMIC REFERRAL TEST: TestUserA -> Incognito TestUserB   ');
console.log('========================================================================\n');

// Clean test environment store
const TEST_STORE_FILE = path.resolve(process.cwd(), '.authoritative_store.json');
if (fs.existsSync(TEST_STORE_FILE)) {
  fs.unlinkSync(TEST_STORE_FILE);
}

const { AuthoritativeStore } = await import('../src/server/authoritative-store.ts');
const store = new AuthoritativeStore();

// -------------------------------------------------------------
// STEP 1: Register TestUserA (e.g. James513322)
// -------------------------------------------------------------
console.log('>>> [STEP 1] Registering TestUserA (James513322)...');
const userA = {
  userId: 'USR-JAMES-513322',
  accountId: 'VX-513322',
  username: 'James513322',
  fullName: 'James Miller',
  email: 'james513322@vaultix.pro',
  role: 'USER',
  accountStatus: 'ACTIVE',
  balance: 0.0,
  totalDeposits: 0.0,
  totalInvestments: 0.0,
  totalProfitLoss: 0.0,
  referralEarnings: 0.0,
  bonusBalance: 0.0,
  referralCode: 'VXREF-James513322',
  createdAt: new Date().toISOString()
};

const regA = store.registerUserWithReferral(userA);
assert.strictEqual(regA.user.username, 'James513322');
assert.strictEqual(regA.user.referralCode, 'VXREF-James513322');
console.log(`  ✓ TestUserA registered successfully. Referral code: ${regA.user.referralCode}`);

// -------------------------------------------------------------
// STEP 2: Validate referral code with casing variations
// -------------------------------------------------------------
console.log('\n>>> [STEP 2] Validating referral codes with casing variations...');
const testCasingInputs = [
  'VXREF-JAMES513322', // All uppercase (from user screenshot)
  'vxref-james513322', // All lowercase
  'VXREF-James513322', // Mixed original
  '  VXREF-JAMES513322  ', // Whitespace padded
  'james513322',       // Bare username
  'James513322'        // Bare username mixed case
];

for (const input of testCasingInputs) {
  const val = store.validateReferralCode(input, 'NewUserCandidate', 'newcandidate@vaultix.pro');
  assert.ok(val.valid, `Code "${input}" MUST be valid for registered user James513322`);
  assert.strictEqual(val.referrer.username, 'James513322');
  console.log(`  ✓ Input "${input}" -> Valid! Resolved referrer: @${val.referrer.username}`);
}

// -------------------------------------------------------------
// STEP 3: Self-Referral Prevention
// -------------------------------------------------------------
console.log('\n>>> [STEP 3] Testing Self-Referral Prevention...');
const selfVal1 = store.validateReferralCode('VXREF-JAMES513322', 'James513322', 'other@mail.com');
assert.strictEqual(selfVal1.valid, false);
assert.strictEqual(selfVal1.isSelfReferral, true);
console.log('  ✓ Self-referral attempt by username blocked.');

const selfVal2 = store.validateReferralCode('VXREF-JAMES513322', 'someone_else', 'james513322@vaultix.pro');
assert.strictEqual(selfVal2.valid, false);
assert.strictEqual(selfVal2.isSelfReferral, true);
console.log('  ✓ Self-referral attempt by email blocked.');

// -------------------------------------------------------------
// STEP 4: Register TestUserB using uppercase "VXREF-JAMES513322"
// -------------------------------------------------------------
console.log('\n>>> [STEP 4] Registering TestUserB using "VXREF-JAMES513322"...');
const userB = {
  userId: 'USR-TEST-USER-B',
  accountId: 'VX-888999',
  username: 'TestUserB',
  fullName: 'Bob Johnson',
  email: 'bob.j@vaultix.pro',
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

const regB = store.registerUserWithReferral(userB, 'VXREF-JAMES513322');

// Verify Invitee received $2.00 Welcome Bonus
assert.strictEqual(regB.user.balance, 2.0, 'TestUserB balance must be $2.00');
assert.strictEqual(regB.user.bonusBalance, 2.0, 'TestUserB bonusBalance must be $2.00');
assert.strictEqual(regB.user.hasReceivedSignupBonus, true);
assert.strictEqual(regB.user.referredByUsername, 'James513322');
assert.strictEqual(regB.user.referralCode, 'VXREF-TestUserB');
console.log('  ✓ TestUserB received $2.00 Welcome Bonus in available balance & bonusBalance');
console.log(`  ✓ TestUserB generated referral code: ${regB.user.referralCode}`);

// Verify Referrer (James513322) received $3.00 Referral Reward
const updatedJames = store.getUser('USR-JAMES-513322');
assert.strictEqual(updatedJames.balance, 3.0, 'James513322 balance must be $3.00');
assert.strictEqual(updatedJames.referralEarnings, 3.0, 'James513322 referralEarnings must be $3.00');
console.log('  ✓ Referrer James513322 received $3.00 Referral Commission in available balance & referralEarnings');

// -------------------------------------------------------------
// STEP 5: Register TestUserC using lowercase "vxref-james513322"
// -------------------------------------------------------------
console.log('\n>>> [STEP 5] Registering TestUserC using lowercase "vxref-james513322"...');
const userC = {
  userId: 'USR-TEST-USER-C',
  accountId: 'VX-777888',
  username: 'TestUserC',
  fullName: 'Charlie Davis',
  email: 'charlie.d@vaultix.pro',
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

const regC = store.registerUserWithReferral(userC, 'vxref-james513322');
assert.strictEqual(regC.user.balance, 2.0);
assert.strictEqual(regC.user.referredByUsername, 'James513322');

const finalJames = store.getUser('USR-JAMES-513322');
assert.strictEqual(finalJames.balance, 6.0, 'James513322 balance must now be $6.00 (2 x $3)');
assert.strictEqual(finalJames.referralEarnings, 6.0, 'James513322 referralEarnings must now be $6.00');
console.log('  ✓ Referrer James513322 updated to $6.00 total referral rewards (2 referrals)');

// -------------------------------------------------------------
// STEP 6: Non-Existent Code Rejection
// -------------------------------------------------------------
console.log('\n>>> [STEP 6] Testing Non-Existent Referral Code Rejection...');
const badRes = store.validateReferralCode('VXREF-nonexistent_ghost_999');
assert.strictEqual(badRes.valid, false);
assert.strictEqual(badRes.error, 'Invalid referral code "VXREF-nonexistent_ghost_999". Please verify the code and try again.');
console.log('  ✓ Non-existent referral code rejected cleanly with exact error message.');

console.log('\n========================================================================');
console.log('   ALL DYNAMIC REFERRAL & INCOGNITO TESTS PASSED 100% SUCCESSFULLY!     ');
console.log('========================================================================\n');
