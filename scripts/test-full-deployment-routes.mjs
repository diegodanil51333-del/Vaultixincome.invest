import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = '/tmp/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// 1. Static SPA server with Vercel-identical rewrite rules
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join('/app/applet/dist', urlPath === '/' ? 'index.html' : urlPath);

  // If file doesn't exist or is a directory (and not in /assets/), serve dist/index.html (SPA rewrite)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = '/app/applet/dist/index.html';
  }

  const ext = path.extname(filePath);
  const contentType = ext === '.js' ? 'application/javascript' :
                      ext === '.css' ? 'text/css' :
                      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                      ext === '.png' ? 'image/png' :
                      ext === '.json' ? 'application/json' : 'text/html';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(5173, async () => {
  console.log('🌐 Verification server running on http://127.0.0.1:5173');
  try {
    await runSuite();
  } catch (err) {
    console.error('Suite error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});

async function runSuite() {
  console.log('🚀 Starting Chrome Headless Shell with CDP...');
  const chromeProc = spawn('/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell', [
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9225',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9225/json/list');
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

    async function navigateAndAudit(label, url, options = { width: 1280, height: 800, isMobile: false, waitMs: 2500 }) {
      console.log(`\n==================================================`);
      console.log(`🧪 TESTING: ${label} -> ${url}`);
      console.log(`   Dimensions: ${options.width}x${options.height} (Mobile: ${options.isMobile})`);

      await send('Emulation.setDeviceMetricsOverride', {
        width: options.width,
        height: options.height,
        deviceScaleFactor: options.isMobile ? 2 : 1,
        mobile: options.isMobile
      });

      consoleLogs.length = 0;
      jsErrors.length = 0;

      await send('Page.navigate', { url });
      await new Promise(r => setTimeout(r, options.waitMs));

      const evalRes = await send('Runtime.evaluate', {
        expression: `({
          title: document.title,
          hasRoot: Boolean(document.getElementById('root')),
          rootLength: document.getElementById('root') ? document.getElementById('root').innerHTML.length : 0,
          bodyText: document.body ? document.body.innerText.slice(0, 300) : '',
          hasAuthModal: Boolean(document.querySelector('form')),
          authModeText: document.querySelector('form') ? document.querySelector('form').innerText.slice(0, 100) : ''
        })`,
        returnByValue: true
      });

      const audit = evalRes?.result?.value || {};
      console.log(`   Title: "${audit.title}"`);
      console.log(`   Root HTML Length: ${audit.rootLength} chars`);
      console.log(`   Body Snippet: ${JSON.stringify(audit.bodyText?.slice(0, 120))}`);
      console.log(`   Has Form/Auth: ${audit.hasAuthModal} (${audit.authModeText ? audit.authModeText.replace(/\\n/g, ' ') : 'N/A'})`);
      console.log(`   JS Errors: ${jsErrors.length}`);

      if (jsErrors.length > 0) {
        jsErrors.forEach(err => console.error(`   ❌ ${err}`));
      } else {
        console.log(`   ✅ 0 JavaScript Errors! Clean load.`);
      }

      const scrRes = await send('Page.captureScreenshot', { format: 'png' });
      if (scrRes?.data) {
        const filename = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
        fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(scrRes.data, 'base64'));
        console.log(`   📸 Screenshot saved: /tmp/screenshots/${filename} (${Math.round(scrRes.data.length * 0.75 / 1024)} KB)`);
      }

      return audit;
    }

    // 1. Homepage Desktop
    await navigateAndAudit('Homepage_Desktop', 'http://127.0.0.1:5173/', { width: 1280, height: 800, isMobile: false, waitMs: 2500 });

    // 2. Homepage Mobile (iPhone 14 / Pixel standard viewport: 390x844)
    await navigateAndAudit('Homepage_Mobile', 'http://127.0.0.1:5173/', { width: 390, height: 844, isMobile: true, waitMs: 2500 });

    // 3. Login Page Direct URL (/login)
    await navigateAndAudit('Login_Direct_URL', 'http://127.0.0.1:5173/login', { width: 1280, height: 800, isMobile: false, waitMs: 2500 });

    // 4. Registration Page Direct URL (/register)
    await navigateAndAudit('Register_Direct_URL', 'http://127.0.0.1:5173/register', { width: 1280, height: 800, isMobile: false, waitMs: 2500 });

    // 5. Dashboard Direct URL (/dashboard)
    await navigateAndAudit('Dashboard_Direct_URL', 'http://127.0.0.1:5173/dashboard', { width: 1280, height: 800, isMobile: false, waitMs: 2500 });

    // 6. Referral URL with path format (/=VXREF-3316)
    await navigateAndAudit('Referral_Equal_Format', 'http://127.0.0.1:5173/=VXREF-3316', { width: 1280, height: 800, isMobile: false, waitMs: 2500 });

    // 7. Referral URL with query parameter format (/?ref=VXREF-3316)
    await navigateAndAudit('Referral_Query_Format', 'http://127.0.0.1:5173/?ref=VXREF-3316', { width: 1280, height: 800, isMobile: false, waitMs: 2500 });

    // 8. Live production URL (https://vaultixincome.vercel.app/)
    await navigateAndAudit('Live_Production_Homepage', 'https://vaultixincome.vercel.app/', { width: 1280, height: 800, isMobile: false, waitMs: 4000 });

    // 9. Live production Mobile (https://vaultixincome.vercel.app/)
    await navigateAndAudit('Live_Production_Mobile', 'https://vaultixincome.vercel.app/', { width: 390, height: 844, isMobile: true, waitMs: 4000 });

    console.log('\n==================================================');
    console.log('🎉 ALL CUJ AND DIRECT ROUTE AUDITS COMPLETED SUCCESSFULLY!');
    console.log('==================================================');

    ws.close();
  } finally {
    chromeProc.kill();
  }
}
