import { defineConfig } from 'vite';
import fs from 'fs';
import os from 'os';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/release/**', '**/dist/**']
    }
  },
  plugins: [
    {
      name: 'electra-auth-dev-api',
      configureServer(server) {
        server.middlewares.use('/api/electra-auth', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          try {
            const authPath = path.join(os.homedir(), '.config', 'ai_terminal', 'electra_auth.json');
            if (fs.existsSync(authPath)) {
              const data = JSON.parse(fs.readFileSync(authPath, 'utf8'));
              if (data && data.api_key) {
                return res.end(JSON.stringify({
                  apiKey: data.api_key,
                  username: data.username || 'MakuluUser',
                  tier: data.tier || 'Free',
                  dailyLimit: data.daily_limit || 0,
                  usedToday: data.used_today || 0
                }));
              }
            }
          } catch (e) {
            console.warn('Vite dev server failed reading electra_auth.json:', e);
          }
          res.end(JSON.stringify(null));
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
