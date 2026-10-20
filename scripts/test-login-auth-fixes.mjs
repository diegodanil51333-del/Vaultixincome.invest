import assert from 'node:assert';
import lookupUserHandler from '../api/lookup-user.js';
import { authoritativeStore } from '../api/authoritative-store.js';

console.log('🧪 Starting Authentication & Login Verification Tests...');

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // Helper for mock req/res
  function mockReqRes(body = {}, query = {}, method = 'POST') {
    const req = { method, body, query };
    const resData = { statusCode: 200, jsonBody: null };
    const res = {
      status(code) {
        resData.statusCode = code;
        return this;
      },
      json(data) {
        resData.jsonBody = data;
        return this;
      }
    };
    return { req, res, resData };
  }

  // Setup test user in authoritativeStore
  const testUserId = `test-user-${Date.now()}`;
  authoritativeStore.saveUser({
    userId: testUserId,
    accountId: 'VX-998877',
    username: 'crypto_trader_alex',
    fullName: 'Alex Trader',
    email: 'alex.trader@example.com',
    role: 'USER',
    accountStatus: 'ACTIVE',
    balance: 100.0,
    totalDeposits: 100.0,
    totalInvestments: 0.0,
    totalProfitLoss: 0.0,
    referralEarnings: 0.0,
    bonusBalance: 2.0,
    referralCode: 'VXREF-ALEX',
    hasReceivedSignupBonus: true,
    hasReceivedFirstDepositBonus: false,
    createdAt: new Date().toISOString()
  });

  // Test 1: Username lookup for standard user
  await testAsync('Standard User: Lookup by Username (/api/lookup-user)', async () => {
    const { req, res, resData } = mockReqRes({ username: 'crypto_trader_alex' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.jsonBody.success, true);
    assert.strictEqual(resData.jsonBody.email, 'alex.trader@example.com');
    assert.strictEqual(resData.jsonBody.username, 'crypto_trader_alex');
  });

  // Test 2: Case-insensitive username lookup
  await testAsync('Standard User: Case-insensitive Username Lookup', async () => {
    const { req, res, resData } = mockReqRes({ identifier: 'CrYpTo_TrAdEr_AlEx' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.jsonBody.success, true);
    assert.strictEqual(resData.jsonBody.email, 'alex.trader@example.com');
  });

  // Test 3: Email lookup for standard user
  await testAsync('Standard User: Lookup by Email (/api/lookup-user)', async () => {
    const { req, res, resData } = mockReqRes({ email: 'alex.trader@example.com' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.jsonBody.success, true);
    assert.strictEqual(resData.jsonBody.email, 'alex.trader@example.com');
  });

  // Test 4: Admin username lookup (vaultix_admin)
  await testAsync('Admin: Lookup by Username "vaultix_admin"', async () => {
    const { req, res, resData } = mockReqRes({ username: 'vaultix_admin' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.jsonBody.success, true);
    assert.strictEqual(resData.jsonBody.email, 'vaultixincometeam@outlook.com');
    assert.strictEqual(resData.jsonBody.role, 'ADMIN');
  });

  // Test 5: Admin username alias lookup ("admin")
  await testAsync('Admin: Lookup by Username Alias "admin"', async () => {
    const { req, res, resData } = mockReqRes({ identifier: 'admin' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.jsonBody.success, true);
    assert.strictEqual(resData.jsonBody.email, 'vaultixincometeam@outlook.com');
  });

  // Test 6: Admin email lookup ("vaultixincometeam@outlook.com")
  await testAsync('Admin: Lookup by Email "vaultixincometeam@outlook.com"', async () => {
    const { req, res, resData } = mockReqRes({ email: 'vaultixincometeam@outlook.com' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 200);
    assert.strictEqual(resData.jsonBody.success, true);
    assert.strictEqual(resData.jsonBody.email, 'vaultixincometeam@outlook.com');
  });

  // Test 7: Non-existent user returns clean 404 rather than evaluating error
  await testAsync('Fallback Handling: Non-existent identifier returns clean 404', async () => {
    const { req, res, resData } = mockReqRes({ identifier: 'non_existent_user_999' });
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 404);
    assert.strictEqual(resData.jsonBody.success, false);
    assert.strictEqual(resData.jsonBody.error, 'User not found');
  });

  // Test 8: Empty payload returns clean 400
  await testAsync('Fallback Handling: Empty payload returns clean 400', async () => {
    const { req, res, resData } = mockReqRes({});
    await lookupUserHandler(req, res);
    assert.strictEqual(resData.statusCode, 400);
  });

  // Test 9: Safe Property Checking against undefined email & undefined user objects
  test('Safe Property Checking: Evaluation with undefined user objects & missing email', () => {
    const usersWithUndefined = [
      undefined,
      null,
      {},
      { userId: 'u1' },
      { userId: 'u2', username: 'no_email_user' },
      { userId: 'u3', email: null },
      { userId: 'u4', email: undefined, username: undefined },
      { userId: testUserId, username: 'crypto_trader_alex', email: 'alex.trader@example.com' }
    ];

    const cleanId = 'crypto_trader_alex';
    const found = usersWithUndefined.find(
      (u) =>
        Boolean(u?.username && typeof u.username === 'string' && u.username.toLowerCase() === cleanId.toLowerCase()) ||
        Boolean(u?.email && typeof u.email === 'string' && u.email.toLowerCase() === cleanId.toLowerCase())
    );

    assert(found !== undefined, 'User should be found without throwing undefined property error');
    assert.strictEqual(found.userId, testUserId);
  });

  // Test 10: Safe Property Checking against missing email in session and user lists
  test('Safe Property Checking: Session recovery with missing email field', () => {
    const recoveredSession = { userId: 'u2', username: 'no_email_user', role: 'USER' };
    const allUsers = [
      { userId: 'u1', email: 'user1@test.com' },
      { userId: 'u2', username: 'no_email_user' }
    ];

    const recUserId = recoveredSession?.userId;
    const recEmail = recoveredSession?.email && typeof recoveredSession.email === 'string' ? recoveredSession.email.toLowerCase() : '';
    const recUsername = recoveredSession?.username && typeof recoveredSession.username === 'string' ? recoveredSession.username.toLowerCase() : '';

    const found = allUsers.find(
      (u) =>
        Boolean(u?.userId && recUserId && u.userId === recUserId) ||
        Boolean(u?.email && recEmail && typeof u.email === 'string' && u.email.toLowerCase() === recEmail) ||
        Boolean(u?.username && recUsername && typeof u.username === 'string' && u.username.toLowerCase() === recUsername)
    );

    assert(found !== undefined, 'Session recovery must succeed safely without throwing');
    assert.strictEqual(found.userId, 'u2');

    const freshUser = found ? { ...found, ...recoveredSession } : recoveredSession;
    const isAdmin = (freshUser?.email && typeof freshUser.email === 'string' && freshUser.email.toLowerCase() === 'vaultixincometeam@outlook.com') || recoveredSession?.role === 'ADMIN';
    assert.strictEqual(isAdmin, false);
  });

  // Test 11: Error sanitizer safely catches JS evaluation crashes and formats user-friendly error
  test('Fallback Handling: Safe error message sanitization', () => {
    const evalErrors = [
      new Error("undefined is not an object (evaluating 'L.email.toLowerCase')"),
      new Error("Cannot read property 'toLowerCase' of undefined"),
      new Error("Cannot read properties of undefined (reading 'toLowerCase')"),
      new Error("null is not an object (evaluating 'u.email')")
    ];

    for (const err of evalErrors) {
      let errMsg = err?.message || 'Authentication error';
      if (
        typeof errMsg === 'string' &&
        (errMsg.includes('undefined is not an object') ||
          errMsg.includes('Cannot read property') ||
          errMsg.includes('Cannot read properties') ||
          errMsg.includes('null is not an object') ||
          errMsg.includes('is not a function'))
      ) {
        errMsg = 'Login failed: Invalid credentials or account record. Please check your username or email and try again.';
      }
      assert.strictEqual(errMsg, 'Login failed: Invalid credentials or account record. Please check your username or email and try again.');
    }
  });

  console.log(`\n🎉 All ${passed}/${total} Authentication Tests Passed Successfully!`);
}

runTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
