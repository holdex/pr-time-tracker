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
import { getClient } from '..';

export abstract class BaseCollection<
  CollectionType extends TimeStamps & { _id?: ObjectId; id?: string | number }
> {
  private _context: Collection<CollectionType> | null = null;
  private _db: Db | null = null;
  private _client: MongoClient | null = null;
  private _initPromise: Promise<void> | null = null;

  readonly properties: Array<keyof CollectionType>;
  private static readonly queryFields: Array<keyof QueryProps> = [
    'count',
    'skip',
    'sort_by',
    'sort_order'
  ];

  constructor(
    private collectionName: CollectionNames,
    private validationSchema: JSONSchema<CollectionType>
  ) {
    this.properties = Object.keys(this.validationSchema.properties) as Array<keyof CollectionType>;
    // Initialize async resources lazily - don't block constructor
    this._initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const client = await getClient();
      this._client = client;
      this._db = client.db(config.mongoDBName);
      this._context = this._db.collection<CollectionType>(this.collectionName);

      // Set up schema validation (non-blocking)
      this._db
        .command({
          collMod: this.collectionName,
          validator: {
            $jsonSchema: {
              bsonType: 'object',
              ...this.validationSchema
            }
          }
        })
        .catch((e) => {
          console.error(`[BaseCollection#initialize] ${e}`);
        });
    } catch (error) {
      console.error(`[BaseCollection#initialize] Failed to initialize collection:`, error);
      throw error;
    }
  }

  // Lazy getters that ensure initialization is complete
  protected async ensureInitialized(): Promise<void> {
    if (this._initPromise) {
      await this._initPromise;
    }
  }

  get context(): Collection<CollectionType> {
    if (!this._context) {
      throw new Error(`[BaseCollection] Collection not initialized. Await async methods first.`);
    }
    return this._context;
  }

  get db(): Db {
    if (!this._db) {
      throw new Error(`[BaseCollection] Database not initialized. Await async methods first.`);
    }
    return this._db;
  }

  get client(): MongoClient {
    if (!this._client) {
      throw new Error(`[BaseCollection] Client not initialized. Await async methods first.`);
    }
    return this._client;
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
