import type { Filter } from 'mongodb';

import { ItemType } from '$lib/constants';

import { CollectionNames, type ItemSchema } from '../types';
import { BaseCollection } from './base.collection';

export class ItemsCollection extends BaseCollection<ItemSchema> {
  generateFilter(params: URLSearchParams) {
    const filter: Partial<Filter<ItemSchema>> = super.generateFilter(params);

    filter.merged = filter.merged ?? true;

    return filter;
  }
}

export const items = new ItemsCollection(CollectionNames.ITEMS, {
  required: [
    'contributorIds',
    'id',
    'merged',
    'org',
    'owner',
    'repo',
    'type',
    'url',
    'title',
    'submissions'
  ],
  properties: {
    contributorIds: { bsonType: 'array', description: 'must be an array.' },
    id: {
      bsonType: 'int',
      description: 'must be a number'
    },
    merged: {
      bsonType: 'bool',
      description: 'must be a boolean'
    },
    org: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    owner: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    repo: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    submissions: { bsonType: 'array', description: 'must be an array.' },
    title: { bsonType: 'string', description: 'must be provided.' },
    type: {
      enum: Object.values(ItemType),
      description: 'must be one of the enum values.'
    },
    url: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    closedAt: {
      bsonType: ['date', 'null']
    }
  } as any // remove any after you've updated Front-end usage of former ItemSchema
});
