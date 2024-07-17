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

export const millisecondsToStr = (milliseconds: number) => {
  // TIP: to find current time in milliseconds, use:
  // var  current_time_milliseconds = new Date().getTime();

  function numberEnding(number: number) {
    return number > 1 ? 's' : '';
  }

  let temp = Math.floor(milliseconds / 1000);
  const years = Math.floor(temp / 31536000);
  if (years) {
    return years + ' year' + numberEnding(years);
  }
  //TODO: Months! Maybe weeks?
  const days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    return days + ' day' + numberEnding(days);
  }
  const hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    return hours + ' hour' + numberEnding(hours);
  }
  const minutes = Math.floor((temp %= 3600) / 60);
  if (minutes) {
    return minutes + ' minute' + numberEnding(minutes);
  }
  const seconds = temp % 60;
  if (seconds) {
    return seconds + ' second' + numberEnding(seconds);
  }
  return 'less than a second'; //'just now' //or other string you like;
};
