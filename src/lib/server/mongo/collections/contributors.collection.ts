import { BaseCollection } from './base.collection';

import { CollectionNames, type ContributorSchema } from '$lib/@types';

export class ContributorsCollection extends BaseCollection<ContributorSchema> {}

export const contributors = new ContributorsCollection(CollectionNames.CONTRIBUTORS, {
  required: [
    'id',
    'login',
    'name',
    'url'
    // 'created_at'
  ],
  properties: {
    id: {
      bsonType: 'int',
      description: 'must be provided.'
    },
    avatarUrl: {
      bsonType: 'string'
    },
    login: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    name: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    url: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    created_at: {
      bsonType: 'string',
      description: 'must be provided.'
    }
  }
});
