import { MongoClient, type MongoClientOptions } from 'mongodb';

import config from '$lib/server/config';

let clientPromise: Promise<MongoClient> | undefined;

declare const global: typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
};

// to get env variables
if (!config.mongoDBUri || !config.mongoDBName) {
  throw new Error(
    `Missing env variables: \nMongodbURL: ${config.mongoDBUri}\nDB name: ${config.mongoDBName}`
  );
}

const requireTls =
  config.mongoDBUri.startsWith('mongodb+srv://') || process.env.MONGO_TLS === 'true';

// Serverless-optimized connection options
const mongoOptions: MongoClientOptions = {
  // Connection pool settings for serverless (CRITICAL for avoiding pool cleared errors)
  minPoolSize: 0, // Don't keep connections warm in serverless (prevents stale connections)
  maxPoolSize: 1, // Single connection per function instance (prevents pool exhaustion)

  // Timeout settings optimized for serverless (15s function timeout)
  serverSelectionTimeoutMS: 5000, // 5s to find a server (critical for 15s budget)
  socketTimeoutMS: 45000, // 45s socket timeout (must be > serverSelectionTimeout)
  connectTimeoutMS: 10000, // 10s connection timeout (allows time for TLS handshake)

  // Heartbeat and monitoring for stale connection detection
  heartbeatFrequencyMS: 30000, // Check every 30s (less aggressive for serverless)

  // Retry settings (let MongoDB driver handle retries internally)
  retryWrites: true,
  retryReads: true,

  // Connection management
  maxIdleTimeMS: 10000, // Close idle connections after 10s (aggressive for serverless)
  waitQueueTimeoutMS: 5000, // Don't wait long for connection from pool

  // SSL/TLS settings (configurable so local dev without TLS still works)
  tls: requireTls,
  tlsAllowInvalidCertificates: process.env.MONGO_TLS_ALLOW_INVALID === 'true',
  tlsAllowInvalidHostnames: false, // Keep hostname validation unless explicitly disabled

  // Compression (reduces network overhead, helps with TLS)
  compressors: ['zlib'],

  // Direct connection (bypasses server selection for faster connection)
  directConnection: false, // Use replica set connection (required for Atlas)

  // Important: Prevent connection pool from being completely cleared on errors
  // This is handled by minPoolSize: 0 (no persistent connections to fail)
  maxConnecting: 2 // Limit concurrent connection attempts
};

console.log('[Mongo] Initializing MongoClient with serverless-optimized settings...');

// Retry configuration
const RETRY_BASE_DELAY_MS = 500; // Increased from 100ms - TLS handshake needs more time
const RETRY_BACKOFF_MULTIPLIER = 2;
const RETRY_ATTEMPT_OFFSET = 1;
const DEFAULT_RETRY_ATTEMPTS = 3; // Increased from 2 - SSL errors can be transient

// Helper to check if error is SSL/TLS related
function isSSLError(error: unknown): boolean {
  const errorStr = String(error);
  return (
    errorStr.includes('SSL') ||
    errorStr.includes('TLS') ||
    errorStr.includes('tlsv1 alert') ||
    errorStr.includes('ETIMEDOUT') ||
    errorStr.includes('ECONNRESET')
  );
}

// Helper to check if error is a network/pool error
function isNetworkError(error: unknown): boolean {
  const errorStr = String(error);
  return (
    errorStr.includes('MongoNetworkError') ||
    errorStr.includes('MongoPoolClearedError') ||
    errorStr.includes('ECONNREFUSED') ||
    errorStr.includes('getaddrinfo')
  );
}

// Lazy connection function with error handling
// Intentionally uses await in loop for sequential retry logic with exponential backoff
/* eslint-disable no-await-in-loop */
async function connectWithRetry(retries = DEFAULT_RETRY_ATTEMPTS): Promise<MongoClient> {
  let lastError: unknown;
  let lastClient: MongoClient | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Mongo] Connection attempt ${attempt}/${retries}...`);

      // Close previous failed client if exists
      if (lastClient) {
        try {
          await lastClient.close();
        } catch (closeError) {
          console.warn('[Mongo] Failed to close previous client:', closeError);
        }
        lastClient = undefined;
      }

      const newClient = new MongoClient(config.mongoDBUri, mongoOptions);
      lastClient = newClient;

      // Attempt connection with timeout
      await newClient.connect();

      // Verify connection with ping
      await newClient.db('admin').command({ ping: 1 });

      console.log(
        `[Mongo] MongoClient connected to DB @ "${config.mongoDBUri.replace(/.*@(.*)\/.*/, '$1')}".`
      );

      return newClient;
    } catch (error) {
      lastError = error;
      const errorType = isSSLError(error)
        ? 'SSL/TLS'
        : isNetworkError(error)
        ? 'Network/Pool'
        : 'Unknown';

      console.error(
        `[Mongo] Connection attempt ${attempt}/${retries} failed (${errorType} error):`,
        error
      );

      // If not the last attempt, wait before retrying
      if (attempt < retries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms...
        // Longer delays for SSL errors (they need more time to recover)
        const SSL_DELAY_MULTIPLIER = 2;
        const baseDelay = isSSLError(error)
          ? RETRY_BASE_DELAY_MS * SSL_DELAY_MULTIPLIER
          : RETRY_BASE_DELAY_MS;
        const backoffMs =
          baseDelay * Math.pow(RETRY_BACKOFF_MULTIPLIER, attempt - RETRY_ATTEMPT_OFFSET);
        console.log(`[Mongo] Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  // Clean up failed client
  if (lastClient) {
    try {
      await lastClient.close();
    } catch (closeError) {
      console.warn('[Mongo] Failed to close last client:', closeError);
    }
  }

  throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${lastError}`);
}
/* eslint-enable no-await-in-loop */

// Initialize connection based on environment
if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectWithRetry();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production (serverless), reuse connection across invocations
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectWithRetry();
  }
  clientPromise = global._mongoClientPromise;
}

// Lazy getter function - don't block module initialization with top-level await
async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    throw new Error('[Mongo] Client promise not initialized');
  }

  try {
    return await clientPromise;
  } catch (error) {
    console.error('[Mongo] Connection health check failed, reconnecting...', error);

    // Clear failed connection
    global._mongoClientPromise = undefined;
    clientPromise = undefined;

    // Reconnect
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        global._mongoClientPromise = connectWithRetry();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      global._mongoClientPromise = connectWithRetry();
      clientPromise = global._mongoClientPromise;
    }

    return await clientPromise;
  }
}

export default clientPromise;

// Export lazy getter for advanced usage
export async function getClient(): Promise<MongoClient> {
  return getMongoClient();
}

// For backwards compatibility - exports a promise for code that expects to await a client.
// The key improvement is the connection options and retry logic above.
export const mongoClientPromise = getMongoClient();
// For legacy synchronous consumers (e.g., BaseCollection constructors)
export const mongoClient = await mongoClientPromise;
