import {
  ObjectId,
  type Collection,
  type Db,
  type Filter,
  type OptionalUnlessRequiredId
} from 'mongodb';

import type {
  TimeStamps,
  QueryProps,
  CollectionNames,
  JSONSchema,
  GetManyParams
} from '$lib/@types';

import { ASCENDING, MAX_DATA_CHUNK } from '$lib/constants';
import { transform } from '$lib/utils';

import config from '../../config';
import { mongoClient } from '..';

export abstract class BaseCollection<
  CollectionType extends TimeStamps & { _id?: ObjectId; id?: string | number }
> {
  readonly context: Collection<CollectionType>;
  readonly db: Db;
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
    this.db = mongoClient.db(config.mongoDBName);
    this.context = this.db.collection<CollectionType>(this.collectionName);
    this.properties = Object.keys(this.validationSchema.properties) as Array<keyof CollectionType>;
    this.db
      .command({
        collMod: collectionName,
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            ...this.validationSchema
          }
        }
      })
      .catch((e) => {
        console.error(`[BaseCollection#constructor] ${e}`);
      });
  }

  async create(resource: OptionalUnlessRequiredId<CollectionType>) {
    resource.created_at = resource.created_at || new Date().toISOString();
    resource.updated_at = resource.created_at;

    const result = await this.context.insertOne(resource);

    if (!result?.insertedId) {
      throw Error(`Could not create ${this.constructor.name.replace('sCollection', '')}.`);
    }

    return (await this.getOne(result.insertedId.toString()))!;
  }

  async getOne(_idOrFilter: string | Filter<CollectionType>) {
    return await this.context.findOne(
      (typeof _idOrFilter === 'string'
        ? { _id: new ObjectId(_idOrFilter) }
        : _idOrFilter) as Filter<CollectionType>
    );
  }

  async getMany(params?: GetManyParams<CollectionType>) {
    const searchParams = BaseCollection.makeParams(params);
    const [filter, { count, skip, sort, sort_by, sort_order }] = [
      this.makeFilter(searchParams),
      params instanceof URLSearchParams ? BaseCollection.makeQuery(searchParams) : params || {}
    ];

    return await this.context
      .find(filter)
      .sort(sort || { [sort_by || 'created_at']: sort_order || ASCENDING })
      .skip(skip || 0)
      .limit(count || MAX_DATA_CHUNK)
      .toArray();
  }

  async update({ _id, id, ...payload }: Partial<CollectionType>) {
    payload.updated_at = new Date().toISOString();

    const result = await this.context.updateOne(
      (!id ? { id } : { _id }) as Filter<CollectionType>,
      { $set: payload as Partial<CollectionType> }
    );

    if (!result.acknowledged) {
      throw Error(
        `Could not make update for ${this.constructor.name.replace('sCollection', '')}, ${
          id || _id
        }.`
      );
    }

    return (await this.getOne(_id?.toString() || { id: id! }))!;
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
