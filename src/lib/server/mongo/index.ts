import { MongoClient, type MongoClientOptions } from 'mongodb';

import config from '$lib/server/config';

let clientPromise: Promise<MongoClient>;

declare const global: typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

// Validate env variables
if (!config.mongoDBUri || !config.mongoDBName) {
  throw new Error(
    `Missing env variables:\nMongodbURL: ${config.mongoDBUri}\nDB name: ${config.mongoDBName}`
  );
}

// Serverless-safe Mongo options
const mongoOptions: MongoClientOptions = {
  minPoolSize: 0,
  maxPoolSize: 1,

  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,

  retryWrites: true,
  retryReads: true,

  maxIdleTimeMS: 10000,
  waitQueueTimeoutMS: 5000,

  compressors: ['zlib']
};

// Create client with verification + recovery
async function createMongoClient(): Promise<MongoClient> {
  const client = new MongoClient(config.mongoDBUri, mongoOptions);

  await client.connect();

  await client.db('admin').command({ ping: 1 });

  return client;
}

console.log('[Mongo] Initializing MongoClient...');

if (!global._mongoClientPromise) {
  global._mongoClientPromise = createMongoClient().catch((err) => {
    console.error('[Mongo] Initial connection failed, clearing cache', err);

    // allow future retries instead of poisoning the process
    global._mongoClientPromise = undefined;

    throw err;
  });
}

clientPromise = global._mongoClientPromise;

export default clientPromise;
