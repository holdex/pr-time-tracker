// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  interface Global {
    _mongoClientPromise: any;
  }
}

declare namespace NodeJS {
  interface Global {
    _mongoClientPromise: any;
  }
}

interface Global {
  _mongoClientPromise: any;
}

export {};
