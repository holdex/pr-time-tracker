import { MongoClient } from 'mongodb';

import config from '$lib/server/config';

export * from './types';

let client;
let clientPromise: Promise<MongoClient>;

declare const global: typeof globalThis & { _mongoClientPromise: Promise<MongoClient> };

// to get env variables
if (!config.mongoDBUri || !config.mongoDBName) {
  throw new Error(
    `Missing env variables: \nMongodbURL: ${config.mongoDBUri}\nDB name: ${config.mongoDBName}`
  );
}

console.log('[Mongo] Connecting MongoClient...');

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(config.mongoDBUri);
    global._mongoClientPromise = client.connect();
  }

  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(config.mongoDBUri);
  clientPromise = client.connect();
}

console.log(
  `[Mongo] MongoClient connected to DB @ "${config.mongoDBUri.replace(/.*@(.*)\/.*/, '$1')}".`
);

export default clientPromise;

export const mongoClient = await clientPromise;
