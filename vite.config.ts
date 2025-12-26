import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import viteRollbar from 'vite-plugin-rollbar';

export default defineConfig({
  plugins: [
    sveltekit(),
    viteRollbar({
      accessToken: process.env.PUB_ROLLBAR_POST_CLIENT_ITEM_ACCESS_TOKEN || '',
      version: '1.0',
      baseUrl: 'pr-time-tracker.vercel.app',
      ignoreUploadErrors: true
    })
  ],
  build: {
    sourcemap: true
  },
  server: {
    host: '127.0.0.1'
  }
});
