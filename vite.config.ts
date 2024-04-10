import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'holdex-accelerator',
        project: 'pr-time-tracker'
      }
    }),
    sveltekit()
  ],
  server: {
    host: '127.0.0.1'
  }
});
