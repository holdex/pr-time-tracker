import ax, { type InternalAxiosRequestConfig } from 'axios';

import { snackbar } from '$lib/components/Snackbar';
import { ItemState, ItemType } from '$lib/constants';
import type { ItemCollection } from '$lib/server/mongo/operations';

export const axios = ax.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Add caching to requests
  config.headers['Cache-Control'] = 'max-age=300'; // duration is in seconds

  return config;
});

export interface PRsQuery {
  owner: string;
  type?: ItemType;
  state?: ItemState;
  submitted?: boolean;
  archived?: boolean;
}

export const getPRs = async (query: PRsQuery, noCache = false) => {
  try {
    const { owner, type, submitted, state, archived } = query;
    const response = await axios.get<{ result: ItemCollection[] }>(
      `/items?type=${
        type || ItemType.PULL_REQUEST
      }&owner=${owner}&submitted=${submitted}&state=${state}&archived=${archived}${
        noCache ? `&cache_bust=${String(Math.random()).slice(2, 10)}` : ''
      }`
    );

    return response.data.result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    snackbar.set({ text: e.message || e, type: 'error' });
    return [];
  }
};
