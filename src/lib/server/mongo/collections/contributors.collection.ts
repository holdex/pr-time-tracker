import { CollectionNames, type ContributorSchema } from '../types';
import { BaseCollection } from './base.collection';

export class ContributorsCollection extends BaseCollection<ContributorSchema> {}

export const contributors = new ContributorsCollection(CollectionNames.CONTRIBUTORS, {
  required: ['id', 'login', 'name', 'url'],
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
    }
  }
});
