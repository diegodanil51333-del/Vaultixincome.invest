import fs from 'fs';
import vm from 'vm';

const bundleCode = fs.readFileSync('live-bundle.js', 'utf8');

// Build minimal DOM globals
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.innerHTML = '';
    this.innerText = '';
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    return child;
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  addEventListener() {}
  removeEventListener() {}
}

const rootDiv = new MockElement('div');
rootDiv.id = 'root';

const mockDocument = {
  getElementById: (id) => (id === 'root' ? rootDiv : null),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement(tag),
  createTextNode: (text) => ({ text }),
  documentElement: new MockElement('html'),
  body: new MockElement('body'),
  head: new MockElement('head'),
  addEventListener: () => {},
  removeEventListener: () => {}
};
mockDocument.body.appendChild(rootDiv);

const mockWindow = {
  document: mockDocument,
  location: {
    href: 'https://vaultixincome.vercel.app/',
    pathname: '/',
    search: '',
    hash: '',
    host: 'vaultixincome.vercel.app',
    hostname: 'vaultixincome.vercel.app',
    protocol: 'https:',
    origin: 'https://vaultixincome.vercel.app',
    replace: () => {},
    assign: () => {}
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  scrollTo: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  MutationObserver: class { observe() {} disconnect() {} },
  Event: class { constructor(type) { this.type = type; } },
  CustomEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init); } },
  fetch: async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' }),
  WebSocket: class { addEventListener() {} send() {} close() {} },
  console
};

mockWindow.window = mockWindow;
mockWindow.self = mockWindow;
mockWindow.globalThis = mockWindow;

const context = vm.createContext(mockWindow);

try {
  console.log('Running bundle in mock browser context...');
  vm.runInContext(bundleCode, context);
  console.log('✅ Bundle evaluated successfully without crash!');
  console.log('rootDiv children:', rootDiv.children.length);
} catch (e) {
  console.error('❌ CRASH evaluating bundle:', e);
}
