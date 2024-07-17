/* eslint-disable no-shadow */
export const ONE_MONTH = 1;
export const HOUR_IN_MILISECOND = 3600000;
export const SECOND_IN_MILISECOND = 1000;
export const FIXED_DECIMAL_HOUR = 2;
export const MAX_DATA_CHUNK = 200; //10;
export const DESCENDING = -1;
export const ASCENDING = 1;

export const REDIRECT_TEMP = 307;
export const SUCCESS_OK = 200;
export const BAD_REQUEST = 400;

export enum GitHubEventName {
  INSTALATION = 'installation',
  PULL_REQUEST = 'pull_request',
  PULL_REQUEST_REVIEW = 'pull_request_review',
  PULL_REQUEST_REVIEW_COMMENT = 'pull_request_review_comment',
  ISSUES = 'issues'
}

export enum ItemType {
  PULL_REQUEST = 'pull_request',
  ISSUES = 'issue'
}
