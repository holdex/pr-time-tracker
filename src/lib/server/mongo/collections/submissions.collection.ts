import type { OptionalId, InsertOneResult } from 'mongodb';

import { Approval, CollectionNames, Experience, type SubmissionSchema } from '../types';
import { BaseCollection } from './base.collection';
import { items } from './items.collection';

export class SubmissionsCollection extends BaseCollection<SubmissionSchema> {
  async create({
    item_id,
    owner_id,
    ...resource
  }: OptionalId<SubmissionSchema>): Promise<InsertOneResult<SubmissionSchema>> {
    const item = await items.getOne({ id: item_id });

    if (!item) throw Error(`Item with ID, ${item_id}, not found. Submission declined.`);

    if (await this.getOne({ item_id, owner_id })) {
      throw Error(`Submission with item ID, ${item_id}, already exists for ${owner_id}.`);
    }

    const created_at = new Date().toISOString();
    const result = await super.create({
      item_id,
      owner_id,
      ...resource,
      created_at,
      updated_at: created_at
    });

    await items.updateSubmissions(item_id, result.insertedId);

    return result;
  }
}

export const submissions = new SubmissionsCollection(CollectionNames.SUBMISSIONS, {
  required: ['experience', 'hours', 'owner_id', 'item_id', 'created_at', 'updated_at'],
  properties: {
    approval: {
      bsonType: ['string', 'null'],
      enum: Object.values(Approval),
      description: 'must be one of the enum values.'
    },
    experience: {
      bsonType: 'string',
      enum: Object.values(Experience),
      description: 'must be one of the enum values.'
    },
    hours: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    item_id: {
      bsonType: 'int',
      description: 'must be provided.'
    },
    owner_id: {
      bsonType: 'int',
      description: 'must be provided.'
    },
    created_at: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    updated_at: {
      bsonType: 'string',
      description: 'must be provided.'
    }
  }
});
