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
// Timeout settings: matched at 5s for fast-fail behavior
const mongoOptions: MongoClientOptions = {
  minPoolSize: 0,

  serverSelectionTimeoutMS: 5000, // How long to find a MongoDB server
  connectTimeoutMS: 5000, // How long to establish connection

  retryWrites: true,
  retryReads: true,

  maxIdleTimeMS: 5000, // Close idle connections after 5s
  waitQueueTimeoutMS: 5000, // Max wait time to get connection from pool

  compressors: ['zlib']
};

// Create client with verification + recovery
async function createMongoClient(): Promise<MongoClient> {
  const client = new MongoClient(config.mongoDBUri, mongoOptions);

  try {
    await client.connect();

    // Verify connection is actually working
    await client.db('admin').command({ ping: 1 });

    return client;
  } catch (error) {
    // Clean up the client if connection or ping fails
    // to prevent dangling connections
    try {
      await client.close();
    } catch (closeError) {
      console.error('[Mongo] Error closing failed client:', closeError);
    }
    throw error;
  }
}

/**
 * Validates if an existing client connection is still healthy.
 * Uses client-side timeout with Promise.race to protect against network hangs,
 * since maxTimeMS only controls server-side execution time.
 */
async function isConnectionHealthy(client: MongoClient): Promise<boolean> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    // Use Promise.race for hard client-side timeout protection
    // maxTimeMS would only protect against slow server queries, not network hangs
    await Promise.race([
      client.db('admin').command({ ping: 1 }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Health check timeout')), 2000);
      })
    ]);
    return true;
  } catch (error) {
    console.warn('[Mongo] Connection health check failed:', error);
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Gets or creates the MongoDB client promise.
 * This getter pattern ensures that if the connection fails, subsequent calls
 * can recover by creating a new connection attempt instead of returning a
 * poisoned rejected promise.
 *
 * For intermittent connection issues, this validates existing connections
 * before reusing them to prevent stale connection errors.
 *
 * Uses compare-and-swap pattern to prevent race conditions where concurrent
 * callers might accidentally clear a fresh connection created by another caller.
 */
export async function getClientPromise(): Promise<MongoClient> {
  const cachedPromise = global._mongoClientPromise;

  // If we have a cached promise, validate the connection is still healthy
  if (cachedPromise) {
    try {
      const client = await cachedPromise;
      const isHealthy = await isConnectionHealthy(client);

      if (isHealthy) {
        return client;
      }

      // Connection is stale, clear cache and create new one
      // Only clear if cache hasn't changed (another caller may have already fixed it)
      if (global._mongoClientPromise === cachedPromise) {
        console.log('[Mongo] Stale connection detected, recreating...');

        // Immediately set cache to a new pending connection to prevent
        // concurrent callers from creating multiple clients during cleanup
        const newClientPromise = createMongoClient().catch((err) => {
          console.error('[Mongo] Connection failed, clearing cache for retry:', err);
          // Only clear if this is still the active promise
          if (global._mongoClientPromise === newClientPromise) {
            global._mongoClientPromise = undefined;
          }
          throw err;
        });
        global._mongoClientPromise = newClientPromise;

        // Close old client asynchronously
        client.close().catch((closeError) => {
          console.error('[Mongo] Error closing stale client:', closeError);
        });
      }
    } catch (error) {
      // Promise rejected or health check failed, clear and retry
      // Only clear if cache hasn't changed
      if (global._mongoClientPromise === cachedPromise) {
        console.warn('[Mongo] Connection validation failed, clearing cache:', error);
        global._mongoClientPromise = undefined;
      }
    }
  }

  // Create new connection
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
 * Clears the cached client promise and closes the underlying connection.
 * Useful for testing or recovering from persistent connection failures.
 * Prevents connection leaks by properly closing the client before clearing the cache.
 */
export function clearClientCache(): void {
  const cachedPromise = global._mongoClientPromise;
  if (cachedPromise) {
    console.log('[Mongo] Clearing client cache');
    global._mongoClientPromise = undefined;
    // Close the underlying client to prevent connection leaks
    cachedPromise
      .then((client) => client.close())
      .catch((err) => console.error('[Mongo] Error closing cached client:', err));
  }
}
