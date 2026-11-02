// scripts/test-live-user-journey-chain.mjs
// Exact simulation of Account A (pul513322) -> Incognito Account B (man1222) -> Incognito Account C

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

console.log('========================================================================');
console.log('   LIVE BROWSER CUJ CHAIN: Account A -> Account B -> Account C          ');
console.log('========================================================================\n');

// Clean test environment store
const TEST_STORE_FILE = path.resolve(process.cwd(), '.authoritative_store.json');
if (fs.existsSync(TEST_STORE_FILE)) {
  fs.unlinkSync(TEST_STORE_FILE);
}

const { AuthoritativeStore } = await import('../src/server/authoritative-store.ts');
const store = new AuthoritativeStore();

// -------------------------------------------------------------
// STEP 1: Register Account A (pul513322)
// -------------------------------------------------------------
console.log('>>> [STEP 1] Registering Account A: pul513322...');
const accountA = {
  userId: 'USR-PUL-513322',
  accountId: 'VX-513322',
  username: 'pul513322',
  fullName: 'Paul Hudson',
  email: 'pul513322@vaultix-live.com',
  role: 'USER',
  accountStatus: 'ACTIVE',
  balance: 0.0,
  totalDeposits: 0.0,
  totalInvestments: 0.0,
  totalProfitLoss: 0.0,
  referralEarnings: 0.0,
  bonusBalance: 0.0,
  referralCode: 'VXREF-pul513322',
  createdAt: new Date().toISOString()
};

const resA = store.registerUserWithReferral(accountA);
assert.strictEqual(resA.user.username, 'pul513322');
assert.strictEqual(resA.user.referralCode, 'VXREF-pul513322');
console.log(`  ✓ Account A registered. Generated invitation code: ${resA.user.referralCode}`);

// -------------------------------------------------------------
// STEP 2: Incognito Window Registration for Account B (man1222)
// -------------------------------------------------------------
console.log('\n>>> [STEP 2] Simulating Clean Incognito Window for Account B (man1222)...');
console.log('  Testing referral code input: "VXREF-pul513322"');

// Validate code in isolated session
const valB = store.validateReferralCode('VXREF-pul513322', 'man1222', 'man1222@vaultix-live.com');
assert.ok(valB.valid, 'Referral code VXREF-pul513322 must be accepted');
assert.strictEqual(valB.referrer.username, 'pul513322');
console.log(`  ✓ Referral code validated. Resolved inviter: @${valB.referrer.username}`);

const accountB = {
  userId: 'USR-MAN-1222',
  accountId: 'VX-122201',
  username: 'man1222',
  fullName: 'Manuel Santos',
  email: 'man1222@vaultix-live.com',
  role: 'USER',
  accountStatus: 'ACTIVE',
  balance: 0.0,
  totalDeposits: 0.0,
  totalInvestments: 0.0,
  totalProfitLoss: 0.0,
  referralEarnings: 0.0,
  bonusBalance: 0.0,
  referralCode: 'VXREF-man1222',
  createdAt: new Date().toISOString()
};

const resB = store.registerUserWithReferral(accountB, 'VXREF-pul513322');

// Assert Account B received $2 welcome bonus & links to pul513322
assert.strictEqual(resB.user.balance, 2.0, 'Account B balance must be $2.00');
assert.strictEqual(resB.user.bonusBalance, 2.0, 'Account B bonusBalance must be $2.00');
assert.strictEqual(resB.user.hasReceivedSignupBonus, true);
assert.strictEqual(resB.user.referredByUsername, 'pul513322');
assert.strictEqual(resB.user.referralCode, 'VXREF-man1222');
console.log(`  ✓ Account B registered successfully.`);
console.log(`    - Assigned code: ${resB.user.referralCode}`);
console.log(`    - Inviter attached: @${resB.user.referredByUsername}`);
console.log(`    - Welcome bonus: $${resB.user.balance.toFixed(2)} USD in available balance`);

// Assert Account A received $3 commission
const updatedA = store.getUser('USR-PUL-513322');
assert.strictEqual(updatedA.balance, 3.0, 'Account A balance must be $3.00');
assert.strictEqual(updatedA.referralEarnings, 3.0, 'Account A referralEarnings must be $3.00');
console.log(`  ✓ Referrer pul513322 balance updated: $${updatedA.balance.toFixed(2)} USD ($3.00 commission)`);

// -------------------------------------------------------------
// STEP 3: Incognito Window Registration for Account C (userC)
// -------------------------------------------------------------
console.log('\n>>> [STEP 3] Simulating Clean Incognito Window for Account C using Account B code...');
console.log('  Testing referral code input: "VXREF-man1222"');

const valC = store.validateReferralCode('VXREF-man1222', 'userC99', 'userC99@vaultix-live.com');
assert.ok(valC.valid, 'Referral code VXREF-man1222 must be accepted');
assert.strictEqual(valC.referrer.username, 'man1222');
console.log(`  ✓ Referral code validated. Resolved inviter: @${valC.referrer.username}`);

const accountC = {
  userId: 'USR-C-999',
  accountId: 'VX-999001',
  username: 'userC99',
  fullName: 'Carla Gomez',
  email: 'userC99@vaultix-live.com',
  role: 'USER',
  accountStatus: 'ACTIVE',
  balance: 0.0,
  totalDeposits: 0.0,
  totalInvestments: 0.0,
  totalProfitLoss: 0.0,
  referralEarnings: 0.0,
  bonusBalance: 0.0,
  referralCode: 'VXREF-userC99',
  createdAt: new Date().toISOString()
};

const resC = store.registerUserWithReferral(accountC, 'VXREF-man1222');

// Assert Account C received $2 welcome bonus & links to man1222
assert.strictEqual(resC.user.balance, 2.0);
assert.strictEqual(resC.user.bonusBalance, 2.0);
assert.strictEqual(resC.user.referredByUsername, 'man1222');
assert.strictEqual(resC.user.referralCode, 'VXREF-userC99');
console.log(`  ✓ Account C registered successfully.`);
console.log(`    - Assigned code: ${resC.user.referralCode}`);
console.log(`    - Inviter attached: @${resC.user.referredByUsername}`);
console.log(`    - Welcome bonus: $${resC.user.balance.toFixed(2)} USD`);

// Assert Account B now has $5.00 ($2 welcome + $3 commission)
const updatedB = store.getUser('USR-MAN-1222');
assert.strictEqual(updatedB.balance, 5.0, 'Account B balance must be $5.00 ($2 welcome + $3 commission)');
assert.strictEqual(updatedB.referralEarnings, 3.0, 'Account B referralEarnings must be $3.00');
console.log(`  ✓ Referrer man1222 balance updated: $${updatedB.balance.toFixed(2)} USD ($2 welcome + $3 referral reward)`);

console.log('\n========================================================================');
console.log('   FULL CHAIN VERIFICATION PASSED 100%: A -> B -> C SUCCESSFUL!        ');
console.log('========================================================================\n');
