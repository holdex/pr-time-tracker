export const ONE_MONTH = 1;
export const HOUR_IN_MILISECOND = 3600000;
export const FIXED_DECIMAL_HOUR = 2;

export const REDIRECT_TEMP = 307;
export const SUCCESS_OK = 200;
export const BAD_REQUEST = 400;

export enum GitHubEventName {
  INSTALATION = 'installation',
  PULL_REQUEST = 'pull_request',
  PULL_REQUEST_REVIEW = 'pull_request_review',
  ISSUES = 'issues'
}

export enum ItemType {
  PULL_REQUEST = 'pull_request',
  ISSUES = 'issue'
}

export enum ItemState {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum SubmitState {
  SUBMITTED = 'true',
  UNSUBMITTED = 'false'
}

export enum ArchiveState {
  ARCHIVED = 'true',
  RETRIEVED = 'false'
}