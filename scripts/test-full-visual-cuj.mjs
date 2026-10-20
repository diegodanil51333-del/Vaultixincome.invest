import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// 1. Start local static server serving dist/
const server = http.createServer((req, res) => {
  let filePath = path.join('/app/applet/dist', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = '/app/applet/dist/index.html';
  }
  const ext = path.extname(filePath);
  const contentType = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'text/html';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(4180, async () => {
  console.log('🚀 Verification test server started on http://127.0.0.1:4180');
  try {
    await runVerification();
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

async function runVerification() {
  console.log('🖥️ Launching Chrome for Desktop & Mobile CUJ Tests...');
  const chromeProc = spawn('/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell', [
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9224',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json/list');
    const targets = await listRes.json();
    const target = targets.find(t => t.type === 'page');
    if (!target) throw new Error('No page target found');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const consoleLogs = [];
    const jsErrors = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data.result);
        callbacks.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
        consoleLogs.push(`[Console ${data.params.type}] ${text}`);
      }
      if (data.method === 'Runtime.exceptionThrown') {
        jsErrors.push(`[JS Exception] ${data.params.exceptionDetails.text} ${JSON.stringify(data.params.exceptionDetails.exception || {})}`);
      }
    };

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');

    async function takeScreenshot(filename, width = 1280, height = 800, isMobile = false) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: isMobile ? 2 : 1,
        mobile: isMobile
      });
      await new Promise(r => setTimeout(r, 1000));
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res && res.data) {
        fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(res.data, 'base64'));
        console.log(`📸 Screenshot saved: ${filename} (${Math.round(res.data.length * 0.75 / 1024)} KB)`);
      }
    }

    // TEST 1: Homepage Desktop
    console.log('\n--- 1. Testing Homepage Desktop (1280x800) ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:4180/' });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('1_homepage_desktop.png', 1280, 800, false);

    // TEST 2: Homepage Mobile (iPhone 14)
    console.log('\n--- 2. Testing Homepage Mobile (390x844) ---');
    await takeScreenshot('2_homepage_mobile.png', 390, 844, true);

    // TEST 3: Direct Referral Link
    console.log('\n--- 3. Testing Referral Link (/=VXREF-3316) ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:4180/=VXREF-3316' });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('3_referral_link_register.png', 1280, 800, false);

    // Verify referral input value in DOM
    const refCodeVal = await send('Runtime.evaluate', {
      expression: 'document.querySelector("input[placeholder*=\'Referral\']") ? document.querySelector("input[placeholder*=\'Referral\']").value : "NOT_FOUND"'
    });
    console.log('Prefilled referral code value in DOM:', refCodeVal?.result?.value);

    // TEST 4: Query Referral Link (?ref=VXREF-9865)
    console.log('\n--- 4. Testing Query Referral Link (/?ref=VXREF-9865) ---');
    await send('Page.navigate', { url: 'http://127.0.0.1:4180/?ref=VXREF-9865' });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('4_query_referral_register.png', 1280, 800, false);

    // TEST 5: User Dashboard & Navigation Tabs
    console.log('\n--- 5. Testing User Dashboard with Logged-in Session ---');
    // Inject session for demo user into localStorage
    await send('Runtime.evaluate', {
      expression: `
        const demoUser = {
          userId: 'USR-003316',
          accountId: 'VX-331601',
          username: 'alex_trader',
          fullName: 'Alex Morgan',
          email: 'alex.m@vaultix.pro',
          role: 'USER',
          accountStatus: 'ACTIVE',
          balance: 5200.0,
          totalDeposits: 8000.0,
          totalInvestments: 3000.0,
          totalProfitLoss: 450.0,
          referralEarnings: 20.0,
          bonusBalance: 0.0,
          referralCode: 'VXREF-3316',
          createdAt: '2026-02-01T12:00:00.000Z'
        };
        localStorage.setItem('vaultix_session_v13', JSON.stringify(demoUser));
        localStorage.setItem('vaultix_current_tab_v10', 'dashboard');
        window.location.href = 'http://127.0.0.1:4180/';
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('5_user_dashboard.png', 1280, 800, false);

    // TEST 6: Vaults / Investments Screen
    console.log('\n--- 6. Testing Vaults Screen ---');
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('vaultix_current_tab_v10', 'vaults');
        window.dispatchEvent(new CustomEvent('vaultix_plans_updated'));
        window.location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('6_vaults_screen.png', 1280, 800, false);

    // TEST 7: Invite & Referral Dashboard Screen
    console.log('\n--- 7. Testing Invite & Referral Dashboard Screen ---');
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('vaultix_current_tab_v10', 'invite');
        window.location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('7_invite_referrals_screen.png', 1280, 800, false);

    // TEST 8: Wallet Screen (Deposit & Withdrawal)
    console.log('\n--- 8. Testing Wallet Screen ---');
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('vaultix_current_tab_v10', 'wallet');
        window.location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('8_wallet_screen.png', 1280, 800, false);

    // TEST 9: Admin Panel
    console.log('\n--- 9. Testing Administrator Management Panel ---');
    await send('Runtime.evaluate', {
      expression: `
        const adminUser = {
          userId: 'USR-000001',
          accountId: 'VX-100001',
          username: 'vaultix_admin',
          fullName: 'Vaultix Administrator',
          email: 'vaultixincometeam@outlook.com',
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          balance: 0.0,
          totalDeposits: 0.0,
          totalInvestments: 0.0,
          totalProfitLoss: 0.0,
          referralEarnings: 0.0,
          bonusBalance: 0.0,
          referralCode: 'VXREF-ADMIN',
          createdAt: '2026-01-01T00:00:00.000Z'
        };
        localStorage.setItem('vaultix_session_v13', JSON.stringify(adminUser));
        localStorage.setItem('vaultix_current_tab_v10', 'admin');
        window.location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('9_admin_dashboard.png', 1280, 800, false);

    console.log('\n📊 Summary of JavaScript Exceptions during entire user flow:');
    console.log(`Total exceptions: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      jsErrors.forEach(e => console.error(e));
    } else {
      console.log('✅ ZERO JavaScript runtime errors across all tested CUJs!');
    }

    ws.close();
  } finally {
    chromeProc.kill();
  }
}
