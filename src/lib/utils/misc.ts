import { writable } from 'svelte/store';

export const appIsReady = writable(false);

export const computeCycleTime = (
  _openedAt: string | number | undefined,
  closedAt?: string | null
) => {
  const time = (
    ((closedAt ? new Date(closedAt) : new Date()).getTime() - new Date(_openedAt!).getTime()) /
    /** ms in 1 sec */ 1000 /
    /** s in 1 min */ 60 /
    /** min in 1 hr */ 60
  ).toFixed(2);
  const [hours, floatPart] = time.split('.').map(Number);
  const minutes = Math.ceil(Number(`0.${floatPart}`) * 60);

  return `${floatPart > 98 ? hours + 1 : hours}${
    floatPart && floatPart < 99 ? `:${minutes < 10 ? 0 : ''}${minutes}` : ''
  }`;
};
