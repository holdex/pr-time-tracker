import {
  ObjectId,
  type Collection,
  type Db,
  type Filter,
  type OptionalUnlessRequiredId,
  MongoClient,
  type InsertOneOptions
} from 'mongodb';

import type {
  TimeStamps,
  QueryProps,
  CollectionNames,
  JSONSchema,
  GetManyParams,
  ContributorSchema
} from '$lib/@types';

import { DESCENDING, MAX_DATA_CHUNK } from '$lib/constants';
import { transform } from '$lib/utils';

import config from '../../config';
import { getClientPromise } from '..';

export abstract class BaseCollection<
  CollectionType extends TimeStamps & { _id?: ObjectId; id?: string | number }
> {
  readonly context!: Collection<CollectionType>;
  readonly db!: Db;
  readonly client!: MongoClient;
  readonly properties!: Array<keyof CollectionType>;
  private static readonly queryFields: Array<keyof QueryProps> = [
    'count',
    'skip',
    'sort_by',
    'sort_order'
  ];
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    private collectionName: CollectionNames,
    private validationSchema: JSONSchema<CollectionType>
  ) {}

  /**
   * Initialize the collection asynchronously. Must be called before using the collection.
   * Uses getClientPromise() to ensure recovery from connection failures.
   * Prevents concurrent initialization by caching the initialization promise.
   * @returns Promise that resolves when initialization is complete
   */
  protected async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  /**
   * Performs the actual initialization logic.
   * Should not be called directly - use initialize() instead.
   */
  private async _doInitialize(): Promise<void> {
    try {
      // Use getClientPromise() to get a fresh promise if previous connection failed
      const client = await getClientPromise();
      (this as { client: MongoClient }).client = client;
      (this as { db: Db }).db = client.db(config.mongoDBName);
      (this as { context: Collection<CollectionType> }).context =
        this.db.collection<CollectionType>(this.collectionName);
      (this as { properties: Array<keyof CollectionType> }).properties = Object.keys(
        this.validationSchema.properties
      ) as Array<keyof CollectionType>;

      // Apply validation schema
      // Note: collMod will fail if collection doesn't exist yet - that's okay, it will be
      // created on first insert. We only log the error for other cases but don't fail initialization.
      try {
        await this.db.command({
          collMod: this.collectionName,
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              ...this.validationSchema
            }
          }
        });
      } catch (schemaError: any) {
        // Log but don't fail if collection doesn't exist (code 26)
        // or namespace not found (code 11600/11602)
        const code = schemaError?.code;
        if (code === 26 || code === 11600 || code === 11602) {
          console.log(
            `[BaseCollection#initialize] Collection ${this.collectionName} does not exist yet, will create on first insert`
          );
        } else {
          // For other errors, log and continue (validation will apply on next restart after collection exists)
          console.warn(
            `[BaseCollection#initialize] Failed to apply validation schema for ${this.collectionName}:`,
            schemaError
          );
        }
      }

      this.initialized = true;
    } catch (error) {
      // Clear initialization promise on failure to allow retry on next call
      this.initializationPromise = null;
      console.error(
        `[BaseCollection#initialize] Failed to initialize collection ${this.collectionName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Ensures the collection is initialized before performing operations
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async create(
    resource: OptionalUnlessRequiredId<CollectionType>,
    options?: InsertOneOptions | undefined
  ) {
    await this.ensureInitialized();

    resource.created_at = resource.created_at || new Date().toISOString();
    resource.updated_at = resource.created_at;

    const result = await this.context.insertOne(resource, options);

    if (!result?.insertedId) {
      throw Error(`Could not create ${this.constructor.name.replace('sCollection', '')}.`);
    }

    return (await this.getOne(result.insertedId.toString()))!;
  }

  async getOne(_idOrFilter: string | Filter<CollectionType>) {
    await this.ensureInitialized();

    return await this.context.findOne(
      (typeof _idOrFilter === 'string'
        ? { _id: new ObjectId(_idOrFilter) }
        : _idOrFilter) as Filter<CollectionType>
    );
  }

  async getOneOrCreate(options: any) {
    await this.ensureInitialized();

    return await this.context.findOne({ id: options.id } as Filter<CollectionType>).then((res) => {
      if (!res) {
        return this.create(options as OptionalUnlessRequiredId<CollectionType>, {
          bypassDocumentValidation: true
        });
      }
      return res;
    });
  }

  async getMany(params?: GetManyParams<CollectionType>) {
    await this.ensureInitialized();

    const searchParams = BaseCollection.makeParams(params);
    const [filter, { count, skip, sort, sort_by, sort_order }] = [
      this.makeFilter(searchParams),
      params instanceof URLSearchParams ? BaseCollection.makeQuery(searchParams) : params || {}
    ];

    return await this.context
      .find(filter)
      .sort(
        sort || {
          [sort_by ||
          ('updated_at' in this.validationSchema.properties ? 'updated_at' : 'created_at')]:
            sort_order || DESCENDING
        }
      )
      .skip(skip || 0)
      .limit(count || MAX_DATA_CHUNK)
      .toArray();
  }

  async update(
    { _id, id, ...payload }: Partial<CollectionType>,
    extra?: {
      onCreateIfNotExist?:
        | boolean
        | ((_payload: Omit<CollectionType, '_id'>) => OptionalUnlessRequiredId<CollectionType>);
      existing?: CollectionType | null;
      user?: ContributorSchema;
    }
  ) {
    await this.ensureInitialized();

    const { onCreateIfNotExist, existing: _existing } = extra || {};

    payload.updated_at = new Date().toISOString();

    const existing = onCreateIfNotExist && (_existing || (await this.getOne(_id || { id: id! })));
    const result =
      existing || !onCreateIfNotExist
        ? await this.context.updateOne(
            (_id ? { _id: new ObjectId(_id) } : { id }) as Filter<CollectionType>,
            { $set: payload as Partial<CollectionType> }
          )
        : null;

    if (!result && onCreateIfNotExist) {
      return this.create(
        (typeof onCreateIfNotExist === 'boolean'
          ? { id, ...payload }
          : onCreateIfNotExist({
              id,
              ...payload
            } as CollectionType)) as OptionalUnlessRequiredId<CollectionType>
      );
    }

    if (!result?.modifiedCount) {
      throw Error(
        `Could not make update for ${this.constructor.name.replace('sCollection', '')}, ${
          id || _id
        }.`
      );
    }

    return (await this.getOne(_id || { id: id! }))!;
  }

  makeFilter(searchParams?: URLSearchParams) {
    const filter: Partial<Filter<CollectionType>> = {};

    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (key in this.validationSchema.properties) {
          filter[key as keyof typeof filter] = transform(value);
        }
      });
    }

    return filter;
  }

  static makeQuery<Type>(params?: GetManyParams<Type>) {
    const query: Partial<QueryProps> = {};

    if (params) {
      this.queryFields.forEach((field) => {
        const value = params instanceof URLSearchParams ? params.get(field) : params[field];

        if (value) query[field] = transform(value);
      });
    }

    return query;
  }

  static makeParams<Type>(params?: GetManyParams<Type>) {
    return params instanceof URLSearchParams
      ? params
      : new URLSearchParams(params as Record<string, string>);
  }

  // async delete() {}
}
