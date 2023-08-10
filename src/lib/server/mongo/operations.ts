import type {
  Filter,
  Db,
  Document,
  UpdateOptions,
  UpdateFilter,
  FindOneAndUpdateOptions
} from 'mongodb';

type ItemCollection = {
  id: number;
  org: string;
  repo: string;
  owner: string;
  type: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
  closedAt?: string;
  hours?: string;
  experience?: 'positive' | 'negative';
  approved?: boolean;
  rejected?: boolean;
  submitted?: boolean;
};

type ContributorCollection = {
  id: number;
  login: string;
  url: string;
  avatarUrl: string;
};

export enum Collections {
  ITEMS = 'items',
  CONTRIBUTORS = 'contributors'
}

export const getCollectionInfo = async <T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.findOne(filter);
  } catch (error) {
    throw new Error('Failed to getCollection:\n' + error);
  }
};

export const getDocumentsInfo = async <T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.find(filter);
  } catch (error) {
    throw new Error('Failed to get documents:\n' + error);
  }
};

export const getListOfField = async <T extends Document>(
  db: Db,
  collectionName: string,
  field: string
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.distinct(field);
  } catch (error) {
    throw new Error('Failed to get list of field:\n' + error);
  }
};

export const updateCollectionInfo = async <T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>,
  update: UpdateFilter<T>,
  options?: UpdateOptions
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.updateOne(filter, update, options);
  } catch (error) {
    throw new Error('Failed to updateCollection:\n' + error);
  }
};

export const findAndupdateCollectionInfo = async <T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>,
  update: UpdateFilter<T>,
  options: FindOneAndUpdateOptions
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.findOneAndUpdate(filter, update, options);
  } catch (error) {
    throw new Error('Failed to findAndUpdate:\n' + error);
  }
};

export type { ContributorCollection, ItemCollection, Db };
