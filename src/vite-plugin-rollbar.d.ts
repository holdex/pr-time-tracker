declare module 'vite-plugin-rollbar' {
  import type { Plugin } from 'vite';

  export interface RollbarPluginOptions {
    accessToken: string;
    version?: string;
    baseUrl?: string;
    sourceMaps?: boolean;
    silent?: boolean;
    enabled?: boolean;
    ignoreUploadErrors?: boolean;
  }

  export default function rollbar(options: RollbarPluginOptions): Plugin;
}
