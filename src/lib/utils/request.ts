import ax, { type InternalAxiosRequestConfig } from 'axios';
import { json } from '@sveltejs/kit';

import type { MongoServerError } from 'mongodb';

import { snackbar } from '$lib/components/Snackbar';
import { BAD_REQUEST, ItemState, ItemType } from '$lib/constants';
import type { ItemSchema } from '$lib/server/mongo';

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
  preserveNumber = false
): Result | null | undefined => {
  const isString = typeof value === 'string';
  const isArray = value && !isString && Array.isArray(value);
  const isObject = !isArray && typeof value === 'object';

  if (value === 'undefined') return undefined;
  if (value === 'null') return null;
  if (value === 'true') return true as Result;
  if (value === 'false') return false as Result;
  if (!value) return value as Result;

  if ((isString && /\{|\[/.test(value)) || isArray || isObject) {
    let parseds = (isString ? JSON.parse(value) : value) as Result;

    if (Array.isArray(parseds)) {
      parseds = parseds.map((parsed) => transform(parsed, preserveNumber)) as Result;
    } else if (typeof parseds === 'object') {
      // eslint-disable-next-line guard-for-in
      for (const key in parseds) {
        parseds[key] = transform(parseds[key], preserveNumber)!;
      }
    }

    return parseds;
  }

  return (!preserveNumber ? Number(value) || value : value) as Result;
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
  owner: string;
  type?: ItemType;
  state?: ItemState;
  submitted?: boolean;
  archived?: boolean;
}

export const getPRs = async (query: PRsQuery, noCache = false) => {
  try {
    const { owner, type, submitted, state, archived } = query;
    const response = await axios.get<{ data: ItemSchema[] }>(
      `/items?type=${
        type || ItemType.PULL_REQUEST
      }&owner=${owner}&submitted=${submitted}&state=${state}&archived=${archived}${
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
