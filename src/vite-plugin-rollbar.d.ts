declare module 'vite-plugin-rollbar' {
  import type { Plugin } from 'vite';

  export interface RollbarPluginOptions {
    accessToken: string;
    version?: string;
    baseUrl?: string;
    silent?: boolean;
    ignoreUploadErrors?: boolean;
  }

  export default function rollbar(options: RollbarPluginOptions): Plugin;
}
