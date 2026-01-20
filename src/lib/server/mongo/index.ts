import { MongoClient, type MongoClientOptions } from 'mongodb';

import config from '$lib/server/config';

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

/**
 * Gets or creates the MongoDB client promise.
 * This getter pattern ensures that if the connection fails, subsequent calls
 * can recover by creating a new connection attempt instead of returning a
 * poisoned rejected promise.
 */
export function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    console.log('[Mongo] Initializing MongoClient...');
    global._mongoClientPromise = createMongoClient().catch((err) => {
      console.error('[Mongo] Connection failed, clearing cache for retry:', err);

      // Allow future retries instead of poisoning the process
      global._mongoClientPromise = undefined;

      throw err;
    });
  }

  return global._mongoClientPromise;
}

/**
 * Clears the cached client promise, allowing for a fresh connection attempt.
 * Useful for testing or recovering from persistent connection failures.
 */
export function clearClientCache(): void {
  if (global._mongoClientPromise) {
    console.log('[Mongo] Clearing client cache');
    global._mongoClientPromise = undefined;
  }
}

// Export default as getter result for backward compatibility
// Note: This still captures the promise at module load time.
// For full recovery, use getClientPromise() directly.
export default getClientPromise();
