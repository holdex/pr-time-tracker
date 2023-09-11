/* eslint-disable no-shadow */
import type { BSONTypeAlias, Filter, ObjectId, WithId } from 'mongodb';

import type { ItemType } from '$lib/constants';

export interface JSONSchema<CollectionType> {
  required?: Array<keyof Omit<CollectionType, '_id'>>;
  properties?: Record<
    keyof Omit<CollectionType, '_id'>,
    { bsonType: BSONTypeAlias | BSONTypeAlias[]; description?: string; enum?: string[] }
  >;
}

export interface FilterProps<CollectionType = ItemSchema> {
  $and: Filter<WithId<CollectionType>>[];
  $or: FilterProps['$and'];
  [key: string]: any;
}

export enum CollectionNames {
  ITEMS = 'items',
  CONTRIBUTORS = 'contributors',
  SUBMISSIONS = 'submissions'
}

export type ItemSchema = {
  _id?: ObjectId;
  id: number;
  org: string;
  repo: string;
  owner: string;
  title: string;
  /** @deprecated - Will use `contributor_ids` instead. */
  contributorIds?: (ObjectId | undefined | null)[];
  contributor_ids?: number[];
  /** `contributors` here is just for type safety. It may be populated on `Item` retrieval. */
  contributors?: ContributorSchema[];
  type: ItemType;
  url: string;
  /** @deprecated - Use `created_at` instead. */
  createdAt?: string;
  /** @deprecated - Use `updated_at` instead. */
  updatedAt?: string;
  /** @deprecated - Use `closed_at` instead. */
  closedAt?: string;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  merged?: boolean;
  /** Submission here (is just for type safety and) is the `submission` pertaining to the current user. It may be populated during `Item` retrieval. */
  submission?: SubmissionSchema;
  submission_ids?: ObjectId[];
  /** `submissions` here is just for type safety. It may be populated on `Item` retrieval. */
  submissions?: SubmissionSchema[];
  // The following will be deprecated and deleted
  submitted?: boolean;
  hours?: string;
  experience?: any;
  approved?: boolean;
};

export type ContributorSchema = {
  _id?: ObjectId;
  id: number;
  name: string;
  login: string;
  url: string;
  avatarUrl: string;
};

export type SubmissionSchema = {
  _id?: ObjectId;
  hours: string;
  experience: Experience;
  approval?: Approval;
  owner: string;
  item_id: ObjectId;
};

export enum Approval {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}

export enum Experience {
  POSITIVE = 'positive',
  NEGATIVE = 'negative'
}
