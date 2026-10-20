import { spawn } from 'child_process';

async function testUrl(testUrl, label) {
  console.log(`\n🧪 Testing ${label}: ${testUrl}`);
  const chromeProc = spawn('/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell', [
    '--no-sandbox',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    testUrl
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json/list');
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

    await new Promise(r => setTimeout(r, 3000));

    const evalResult = await send('Runtime.evaluate', {
      expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML : "NO_ROOT"'
    });

    const rootHTML = evalResult?.result?.value || '';
    console.log(`✅ Root HTML Length: ${rootHTML.length}`);
    console.log(`✅ Root Preview: ${rootHTML.slice(0, 300)}...`);
    console.log(`Errors: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
      console.error(jsErrors);
    }

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

async function runAll() {
  await testUrl('http://127.0.0.1:4173/', 'Home Landing Page');
  await testUrl('http://127.0.0.1:4173/=VXREF-3316', 'Direct Referral Link');
  await testUrl('http://127.0.0.1:4173/?ref=VXREF-9865', 'Query Param Referral Link');
}

runAll().catch(console.error);
