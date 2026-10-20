import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import investHandler from './api/invest';
import validateReferralHandler from './api/validate-referral';
import registerHandler from './api/register';
import lookupUserHandler from './api/lookup-user';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        if (url.pathname === '/api/lookup-user') {
          let body: any = {};
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            try {
              body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            } catch {}
          }
          const query = Object.fromEntries(url.searchParams.entries());
          const customReq = {
            method: req.method,
            body,
            query,
            headers: req.headers
          };
          const customRes = {
            statusCode: 200,
            status(code: number) {
              this.statusCode = code;
              return this;
            },
            json(data: any) {
              res.statusCode = this.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          };
          try {
            await lookupUserHandler(customReq, customRes);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message || 'Server error' }));
          }
          return;
        }
        if (url.pathname === '/api/register') {
          let body: any = {};
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            try {
              body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            } catch {}
          }
          const query = Object.fromEntries(url.searchParams.entries());
          const customReq = {
            method: req.method,
            body,
            query,
            headers: req.headers
          };
          const customRes = {
            statusCode: 200,
            status(code: number) {
              this.statusCode = code;
              return this;
            },
            json(data: any) {
              res.statusCode = this.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          };
          try {
            await registerHandler(customReq, customRes);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message || 'Server error' }));
          }
          return;
        }
        if (url.pathname === '/api/validate-referral') {
          let body: any = {};
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            try {
              body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            } catch {}
          }
          const query = Object.fromEntries(url.searchParams.entries());
          const customReq = {
            method: req.method,
            body,
            query,
            headers: req.headers
          };
          const customRes = {
            statusCode: 200,
            status(code: number) {
              this.statusCode = code;
              return this;
            },
            json(data: any) {
              res.statusCode = this.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          };
          try {
            await validateReferralHandler(customReq, customRes);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message || 'Server error' }));
          }
          return;
        }

        if (url.pathname === '/api/invest') {
          let body: any = {};
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            try {
              body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            } catch {}
          }
          const query = Object.fromEntries(url.searchParams.entries());
          const customReq = {
            method: req.method,
            body,
            query,
            headers: req.headers
          };
          const customRes = {
            statusCode: 200,
            status(code: number) {
              this.statusCode = code;
              return this;
            },
            json(data: any) {
              res.statusCode = this.statusCode;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            }
          };
          try {
            await investHandler(customReq, customRes);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message || 'Server error' }));
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
