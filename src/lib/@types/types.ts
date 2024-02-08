/* eslint-disable no-shadow */
import type { BSONTypeAlias, ObjectId, Sort, SortDirection } from 'mongodb';

import type { ItemType } from '$lib/constants';

type SchemaProperty = {
  bsonType?: BSONTypeAlias | BSONTypeAlias[];
  description?: string;
  enum?: string[];
};

export interface TimeStamps {
  /** Best to be in ISO format. */
  created_at?: string | number;
  /** Best to be in ISO format. */
  updated_at?: string | null | number;
}

export interface JSONSchema<CollectionType> {
  required?: Array<keyof Omit<CollectionType, '_id'>>;
  properties: Record<
    keyof Omit<
      CollectionType,
      '_id' | 'updated_at' | 'prs' | 'contributors' | 'submissions' | 'submission'
    >,
    SchemaProperty
  > & {
    updated_at?: SchemaProperty;
  };
}

export type GetManyParams<CollectionType> =
  | URLSearchParams
  | Partial<QueryProps & Record<keyof CollectionType, string | number | undefined | null>>;

export type QueryProps<CollectionType = ItemSchema> = {
  sort?: Sort | null;
  sort_by?: keyof CollectionType | null;
  sort_order?: SortDirection | null;
  skip?: number | null;
  count?: number | null;
};

export enum CollectionNames {
  ITEMS = 'items',
  EVENTS = 'events',
  CONTRIBUTORS = 'contributors',
  SUBMISSIONS = 'submissions'
}

export interface EventsSchema extends TimeStamps {
  id: number;
  organization: string;
  repository: string;
  action: EventType;
  title: string;
  owner: string;
  sender: string;
  label?: string;
  payload?: number;
  index: number;
}

export interface ItemSchema extends TimeStamps {
  _id?: ObjectId;
  id: number;
  org: string;
  repo: string;
  owner: string;
  title: string;
  contributor_ids?: number[];
  /** `contributors` here is just for type safety. It may be populated on `Item` retrieval. */
  contributors?: ContributorSchema[];
  type: ItemType;
  url: string;
  total_cost?: number;
  merged?: boolean;
  created_at?: string | number;
  updated_at?: string | number;
  closed_at?: string | null;
  /** Submission here (is just for type safety and) is the `submission` pertaining to the current user. It may be populated during `Item` retrieval. */
  submission?: SubmissionSchema;
  submission_ids?: ObjectId[];
  /** `submissions` here is just for type safety. It may be populated on `Item` retrieval. */
  submissions?: SubmissionSchema[];
}

export interface ContributorSchema extends TimeStamps {
  _id?: ObjectId;
  id: number;
  name: string;
  login: string;
  url: string;
  avatarUrl: string;
  role: UserRole;
  /** Hourly rate (in $/hr) */
  rate: number;
  /** `prs` here is just for type safety. It may be populated on contributor retrieval. */
  prs?: ItemSchema[];
}

export interface SubmissionSchema extends TimeStamps {
  _id?: ObjectId;
  hours: number;
  experience: Experience;
  approval: Approval;
  /** Note that this is equivalent to `contributor_id`(s) in `ItemSchema`. */
  owner_id: number;
  item_id: number;
  /** This is used to calculate the PR `cost` at the time of submission relative to the `contributor`'s rate at the time. It will be stored once (on item submission) */
  rate: number;
}

export enum Approval {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}

export enum Experience {
  POSITIVE = 'positive',
  NEGATIVE = 'negative'
}

export enum UserRole {
  MANAGER = 'Manager',
  CONTRIBUTOR = 'Contributor'
}

export enum EventType {
  PR_OPENED = 'PR_OPENED',
  PR_MERGED = 'PR_MERGED',
  PR_EDITED = 'PR_EDITED',
  PR_CLOSED = 'PR_CLOSED',
  PR_ASSIGNED = 'PR_ASSIGNED',
  PR_UNASSIGNED = 'PR_UNASSIGNED',
  PR_LABELED = 'PR_LABELED',
  PR_UNLABELED = 'PR_UNLABELED',
  PR_APPROVED = 'PR_APPROVED',
  PR_REJECTED = 'PR_REJECTED',
  PR_REVIEW_REQUESTED = 'PR_REVIEW_REQUESTED',
  PR_CONVERTED_TO_DRAFT = 'PR_CONVERTED_TO_DRAFT',
  PR_READY_TO_REVIEW = 'PR_READY_TO_REVIEW',
  PR_REOPENED = 'PR_REOPENED',
  ISSUE_OPENED = 'ISSUE_OPENED',
  ISSUE_LABELED = 'ISSUE_LABELED',
  ISSUE_UNLABELED = 'ISSUE_UNLABELED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_UNASSIGNED = 'ISSUE_UNSIGNED',
  ISSSUE_CLOSED = 'ISSSUE_CLOSED',
  ISSUED_REOPENED = 'ISSUED_REOPENED',
  PR_REVIEW_REQUEST_REMOVED = 'PR_REVIEW_REQUEST_REMOVED',
  PR_REVIEW_DISMISSED = 'PR_REVIEW_DISMISSED',
  PR_REVIEW_SUBMITTED = 'PR_REVIEW_SUBMITTED',
  PR_SUBMISSION_CREATED = 'PR_SUBMISSION_CREATED',
  PR_SUBMISSION_UPDATED = 'PR_SUBMISSION_UPDATED',
  PR_SUBMISSION_APPROVED = 'PR_SUBMISSION_APPROVED',
  PR_SUBMISSION_REJECTED = 'PR_SUBMISSION_REJECTED'
}
