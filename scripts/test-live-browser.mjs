import { spawn } from 'child_process';

async function testLiveSite() {
  console.log('🚀 Launching Chrome Headless Shell with CDP...');
  const chromeProc = spawn('/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell', [
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    'https://vaultixincome.vercel.app/'
  ]);

  chromeProc.stderr.on('data', (d) => {
    // console.log('[Chrome Stderr]', d.toString());
  });

  // Wait 2 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await listRes.json();
    console.log('Target pages:', targets);

    const target = targets.find(t => t.type === 'page');
    if (!target) {
      throw new Error('No page target found');
    }

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
    await send('Network.enable');

    console.log('Waiting 4 seconds for page scripts and state to load...');
    await new Promise(r => setTimeout(r, 4000));

    const evalResult = await send('Runtime.evaluate', {
      expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML : "NO_ROOT"'
    });

    const rootHTML = evalResult?.result?.value || '';
    console.log('--- Page Root HTML Length ---', rootHTML.length);
    console.log('--- Page Root Snippet ---');
    console.log(rootHTML.slice(0, 500));

    console.log('--- Console Logs Captured (' + consoleLogs.length + ') ---');
    consoleLogs.slice(0, 20).forEach(l => console.log(l));

    console.log('--- JS Errors Captured (' + jsErrors.length + ') ---');
    jsErrors.forEach(e => console.error(e));

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

testLiveSite().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
