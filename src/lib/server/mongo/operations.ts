import type {
  Filter,
  Db,
  Document,
  UpdateOptions,
  UpdateFilter,
  FindOneAndUpdateOptions
} from 'mongodb';

const collections = {
  items: 'items'
};

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

async function getCollectionInfo<T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>
) {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.findOne(filter);
  } catch (error) {
    throw new Error('Failed to getCollection:\n' + error);
  }
}

async function getDocumentsInfo<T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>
) {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.find(filter);
  } catch (error) {
    throw new Error('Failed to get documents:\n' + error);
  }
}

async function getListOfField<T extends Document>(db: Db, collectionName: string, field: string) {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.distinct(field);
  } catch (error) {
    throw new Error('Failed to get list of field:\n' + error);
  }
}

async function updateCollectionInfo<T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>,
  update: UpdateFilter<T>,
  options?: UpdateOptions
) {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.updateOne(filter, update, options);
  } catch (error) {
    throw new Error('Failed to updateCollection:\n' + error);
  }
}

async function findAndupdateCollectionInfo<T extends Document>(
  db: Db,
  collectionName: string,
  filter: Filter<T>,
  update: UpdateFilter<T>,
  options: FindOneAndUpdateOptions
) {
  try {
    const collection = db.collection<T>(collectionName);
    return collection.findOneAndUpdate(filter, update, options);
  } catch (error) {
    throw new Error('Failed to findAndUpdate:\n' + error);
  }
}
export type { ItemCollection, Db };

export {
  collections,
  getCollectionInfo,
  getDocumentsInfo,
  getListOfField,
  updateCollectionInfo,
  findAndupdateCollectionInfo
};
