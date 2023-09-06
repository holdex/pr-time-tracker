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
  contributorIds?: (ObjectId | undefined | null)[];
  type: ItemType;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
  merged?: boolean;
  // submission?: SubmissionSchema;
  submissions?: Array<SubmissionSchema | ObjectId>;
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
