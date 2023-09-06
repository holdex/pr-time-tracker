import {
  ObjectId,
  type Collection,
  type Db,
  type Document,
  type Filter,
  type OptionalUnlessRequiredId
} from 'mongodb';

import { MAX_DATA_CHUNK } from '$lib/constants';
import { transform } from '$lib/utils';

import { CollectionNames, mongoClient, type JSONSchema, type QueryProps } from '..';
import config from '../../config';

export abstract class BaseCollection<CollectionType extends Document> {
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
    this.properties = Object.keys(this.validationSchema.properties);
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

  async create(
    resource: OptionalUnlessRequiredId<CollectionType>,
    onAfterCreate?: (result: Awaited<ReturnType<typeof this.create>>) => Promise<void>
  ) {
    const result = await this.context.insertOne(resource);

    if (onAfterCreate) await onAfterCreate(result);

    return result;
  }

  async getOne(_idOrFilter: string | Filter<CollectionType>) {
    return await this.context.findOne(
      (typeof _idOrFilter === 'string'
        ? { _id: new ObjectId(_idOrFilter) }
        : _idOrFilter) as Filter<CollectionType>
    );
  }

  async getMany(searchParams?: URLSearchParams) {
    const [filter, { count, skip, sort, sort_by, sort_order }] = [
      this.generateFilter(searchParams),
      BaseCollection.getQuery(searchParams)
    ];

    return await this.context
      .find(filter)
      .sort(sort || { [sort_by || 'created_at']: sort_order || 'descending' })
      .skip(skip || 0)
      .limit(count || MAX_DATA_CHUNK)
      .toArray();
  }

  async update(payload: OptionalUnlessRequiredId<Partial<CollectionType>>) {
    return await this.context.updateOne({ _id: payload._id } as Filter<CollectionType>, {
      $set: payload as Partial<CollectionType>
    });
  }

  generateFilter(searchParams?: URLSearchParams) {
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

  private static getQuery(searchParams?: URLSearchParams) {
    const query: Partial<QueryProps> = {};

    if (searchParams) {
      this.queryFields.forEach((field) => {
        const value = searchParams.get(field);

        if (value) query[field] = transform<any>(value);
      });
    }

    return query;
  }

  // async delete() {}
}
