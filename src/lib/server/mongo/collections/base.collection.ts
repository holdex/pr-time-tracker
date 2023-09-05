import type { Collection, Db, Document, Filter, OptionalUnlessRequiredId } from 'mongodb';

import { CollectionNames, mongoClient, type JSONSchema } from '..';
import config from '../../config';

export abstract class BaseCollection<CollectionType extends Document> {
  context: Collection<CollectionType>;
  db: Db;

  constructor(
    private collectionName: CollectionNames,
    private validationSchema: JSONSchema<CollectionType>
  ) {
    this.db = mongoClient.db(config.mongoDBName);
    this.context = this.db.collection<CollectionType>(this.collectionName);
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
    return await this.context.insertOne(resource);
  }

  async getOne(_id: string) {
    return await this.context.findOne({ _id } as Filter<CollectionType>);
  }

  async getMany(query?: Filter<CollectionType>) {
    return await this.context.find(query ? query : {}).toArray();
  }

  async update(payload: OptionalUnlessRequiredId<Partial<CollectionType>>) {
    return await this.context.updateOne({ _id: payload._id } as Filter<CollectionType>, payload);
  }

  // async delete() {}
}
