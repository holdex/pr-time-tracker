import type {
  Filter,
  Db,
  Document,
  UpdateOptions,
  UpdateFilter,
  FindOneAndUpdateOptions
} from 'mongodb';
import type { ContributorSchema, ItemSchema } from './types';

import { MAX_DATA_CHUNK } from '$lib/constants';

export const getCollectionInfo = async <T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.findOne(filter);
  } catch (error) {
    throw new Error('failed to getCollection:\n' + error);
  }
};

export const getDocumentsInfo = async <T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>,
  count?: number | null
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.find(filter).limit(count || MAX_DATA_CHUNK);
  } catch (error) {
    throw new Error('Failed to get documents:\n' + error);
  }
};

export const getAggregation = async <T extends Document>(
  db: Db,
  collectionName: string,
  pipeline: Document[]
) => {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.aggregate(pipeline);
  } catch (error) {
    throw new Error('Failed to get aggregated documents:\n' + error);
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

export type { ContributorSchema, ItemSchema, Db };
