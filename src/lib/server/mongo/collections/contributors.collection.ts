import type { WithId } from 'mongodb';

import { Vadims_ID } from '$lib/constants';

import { BaseCollection } from './base.collection';

import { CollectionNames, UserRole, type ContributorSchema } from '$lib/@types';

export class ContributorsCollection extends BaseCollection<ContributorSchema> {
  async update({ id, ...payload }: Partial<ContributorSchema>): Promise<WithId<ContributorSchema>> {
    const contributor = await this.getOne({ id, ...payload });

    if (contributor?.role) return super.update(payload);
    if (!payload.role) payload.role = id === Vadims_ID ? UserRole.MANAGER : UserRole.CONTRIBUTOR;

    return await super.create(payload as ContributorSchema);
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
