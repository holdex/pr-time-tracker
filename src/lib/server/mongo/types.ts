/* eslint-disable no-shadow */
import type { BSONTypeAlias, ObjectId, Sort, SortDirection } from 'mongodb';

import type { ItemType } from '$lib/constants';

export interface JSONSchema<CollectionType> {
  required?: Array<keyof Omit<CollectionType, '_id'>>;
  properties: Record<
    keyof Omit<CollectionType, '_id' | 'createdAt' | 'updatedAt' | 'created_at' | 'updated_at'>,
    { bsonType?: BSONTypeAlias | BSONTypeAlias[]; description?: string; enum?: string[] }
  >;
}

export type QueryProps<CollectionType = ItemSchema> = {
  sort?: Sort;
  sort_by?: keyof CollectionType;
  sort_order?: SortDirection;
  skip?: number;
  count?: number;
};

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
  contributor_ids?: number[];
  /** `contributors` here is just for type safety. It may be populated on `Item` retrieval. */
  contributors?: ContributorSchema[];
  type: ItemType;
  url: string;
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
  /** Note that this is equivalent to `contributor_id`(s) in `ItemSchema`. */
  owner_id: number;
  item_id: number;
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
