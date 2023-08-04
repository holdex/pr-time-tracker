import { MongoClient } from 'mongodb';
import config from '$lib/server/config';

let client;
let clientPromise: Promise<MongoClient>;

// to get env variables
if (!config.mongoDBUri || !config.mongoDBName) {
  throw new Error(
    `Missing env variables: \nMongodbURL: ${config.mongoDBUri}\nDB name: ${config.mongoDBName}`
  );
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  // @ts-ignore
  if (!global._mongoClientPromise) {
    client = new MongoClient(config.mongoDBUri);
    // @ts-ignore
    global._mongoClientPromise = client.connect();
  }
  // @ts-ignore
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(config.mongoDBUri);
  clientPromise = client.connect();
}
export default clientPromise;
