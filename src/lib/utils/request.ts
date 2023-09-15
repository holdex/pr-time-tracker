import ax, { type InternalAxiosRequestConfig } from 'axios';
import { json } from '@sveltejs/kit';

import type { MongoServerError } from 'mongodb';
import type { ItemSchema } from '$lib/@types';

import { snackbar } from '$lib/components/Snackbar';
import { BAD_REQUEST, ItemState, ItemType } from '$lib/constants';

export const jsonError = (e: unknown, path: string, method?: string | null, status = 500) => {
  const message = (e as MongoServerError).errInfo
    ? JSON.stringify((e as MongoServerError).errInfo).replaceAll('"', "'")
    : (e as Error).message || (e as string);
  const isBadRequest = /validation|json/i.test(message);

  console.error(`['${path}' ${method || 'GET'} error]: ${message}`);
  return json({ message, error: true }, { status: isBadRequest ? BAD_REQUEST : status });
};

export const transform = <Result = unknown>(
  value: unknown,
  options?: {
    preserveNumber?: boolean;
    /** For objects. Whether to exclude certain fields. */
    omit?: Array<keyof Result>;
    /** For objects. Whether to include certain fields only. */
    pick?: Array<keyof Result>;
  }
): Result | null | undefined => {
  const { preserveNumber, omit, pick } = options || {};
  const isString = typeof value === 'string';
  const isArray = value && !isString && Array.isArray(value);
  const isObject = !isArray && typeof value === 'object';

  if (value === 'undefined') return undefined;
  if (value === 'null') return null;
  if (value === 'true') return true as Result;
  if (value === 'false') return false as Result;
  if (!value) return value as Result;

  if ((isString && /\{|\[/.test(value)) || isArray || isObject) {
    const picked = {} as Result;
    let parseds = (isString ? JSON.parse(value) : value) as Result;
    let key: keyof Result;

    if (Array.isArray(parseds)) {
      parseds = parseds.map((parsed) => transform(parsed, options)) as Result;
    } else if (parseds && typeof parseds === 'object') {
      if (pick) {
        for (key of (omit || pick)!) {
          picked[key] = transform(parseds[key], options) as Result[keyof Result];
        }
      } else {
        if (omit) for (key of omit) delete parseds[key];

        // eslint-disable-next-line guard-for-in
        for (key in parseds) {
          (parseds as Result)[key] = transform(parseds[key], options) as Result[keyof Result];
        }
      }
    }

    return pick ? picked : parseds;
  }

  return (!preserveNumber ? (isNaN(Number(value)) ? value : Number(value)) : value) as Result;
};

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
  contributor_id: number;
  type?: ItemType;
  state?: ItemState;
  submitted?: boolean;
  archived?: boolean;
}

export const getPRs = async (query: PRsQuery, noCache = false) => {
  try {
    const { contributor_id, type, submitted, state, archived } = query;
    const response = await axios.get<{ data: ItemSchema[] }>(
      `/items?type=${
        type || ItemType.PULL_REQUEST
      }&contributor_id=${contributor_id}&submitted=${submitted}&state=${state}&archived=${archived}${
        noCache ? `&cache_bust=${String(Math.random()).slice(2, 10)}` : ''
      }`
    );

    return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    snackbar.set({ text: e.message || e, type: 'error' });
    return [];
  }
};
