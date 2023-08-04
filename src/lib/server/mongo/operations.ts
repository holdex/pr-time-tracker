import type {
  Filter,
  Db,
  Document,
  UpdateOptions,
  UpdateFilter,
  FindOneAndUpdateOptions,
  ObjectId
} from 'mongodb';

const collections = {
  items: 'items'
};

type ItemCollection = {
  id: ObjectId;
  org: string;
  repo: string;
  owner: string;
  type: string;
  url: string;
  hours: string;
  experince: 'positive' | 'negative';
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

export { collections, getCollectionInfo, updateCollectionInfo, findAndupdateCollectionInfo };
