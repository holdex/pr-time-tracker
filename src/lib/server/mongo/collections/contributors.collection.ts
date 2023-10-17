import type { WithId } from 'mongodb';

import { BaseCollection } from './base.collection';

import { CollectionNames, UserRole, type ContributorSchema } from '$lib/@types';

export class ContributorsCollection extends BaseCollection<ContributorSchema> {
  async update(_payload: Partial<ContributorSchema>): Promise<WithId<ContributorSchema>> {
    return await super.update(_payload, (payload) => {
      if (!payload.role) payload.role = UserRole.CONTRIBUTOR;
      if (!payload.rate) payload.rate = 1;

      return payload;
    });
  }
}

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
    rate: {
      bsonType: ['int', 'double'],
      description: 'must be provided.'
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
    role: { enum: Object.values(UserRole), description: 'must be one of the enum values.' },
    created_at: {
      bsonType: 'string',
      description: 'must be provided.'
    }
  }
});
