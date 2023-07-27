import type { InternalAxiosRequestConfig } from 'axios'

export function makeReqInterceptor() {
    return async function (cfg: InternalAxiosRequestConfig<any>) {
        const result = await fetch('/api/github/auth/tokens').then(r => r.json());
        cfg.headers.Authorization = `Bearer ${result.accessToken}`;

        return cfg;
    }
}