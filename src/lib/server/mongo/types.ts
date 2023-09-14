/* eslint-disable no-shadow */
import type { BSONTypeAlias, ObjectId, Sort, SortDirection, WithId } from 'mongodb';

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
  properties: Record<keyof Omit<CollectionType, '_id' | 'updated_at' | 'prs'>, SchemaProperty> & {
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
  CONTRIBUTORS = 'contributors',
  SUBMISSIONS = 'submissions'
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
  merged?: boolean;
  created_at?: string | number;
  updated_at?: string | number;
  closed_at?: string | null;
  /** Submission here (is just for type safety and) is the `submission` pertaining to the current user. It may be populated during `Item` retrieval. */
  submission?: SubmissionSchema;
  submission_ids?: ObjectId[];
  /** `submissions` here is just for type safety. It may be populated on `Item` retrieval. */
  submissions?: SubmissionSchema[];
  // The following will be deprecated and deleted
  // submitted?: boolean;
  hours?: string;
  experience?: any;
  approved?: boolean;
}

export interface ContributorSchema extends TimeStamps {
  _id?: ObjectId;
  id: number;
  name: string;
  login: string;
  url: string;
  avatarUrl: string;
  prs?: ItemSchema[];
}

export interface SubmissionSchema extends TimeStamps {
  _id?: ObjectId;
  hours: string;
  experience: Experience;
  approval: Approval;
  /** Note that this is equivalent to `contributor_id`(s) in `ItemSchema`. */
  owner_id: number;
  item_id: number;
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
