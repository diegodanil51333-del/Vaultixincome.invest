import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const bundleCode = readFileSync('/tmp/live-bundle.js', 'utf-8');

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`, {
  url: 'https://vaultixincome.vercel.app/',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});

const { window } = dom;

// Polyfills
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

window.scrollTo = function() {};

console.log('Testing live bundle execution in JSDOM...');

window.addEventListener('error', (e) => {
  console.error('Window Error:', e.error || e.message);
});

try {
  dom.runVMScript(new (await import('vm')).Script(bundleCode));
  console.log('Bundle executed without uncaught syntax or top-level runtime error.');
  console.log('Root innerHTML length:', window.document.getElementById('root').innerHTML.length);
  console.log('Root snippet:', window.document.getElementById('root').innerHTML.slice(0, 300));
} catch (err) {
  console.error('Fatal crash executing bundle:', err);
}
