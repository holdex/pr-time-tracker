import type { Filter, ObjectId } from 'mongodb';

import { ItemType } from '$lib/constants';
import { transform } from '$lib/utils';

import { CollectionNames, type ContributorSchema, type ItemSchema } from '../types';
import { BaseCollection } from './base.collection';

export class ItemsCollection extends BaseCollection<ItemSchema> {
  generateFilter(searchParams?: URLSearchParams) {
    const filter: Partial<Filter<ItemSchema>> = super.generateFilter(searchParams);
    const contributor = transform<string>(searchParams?.get('contributor'));

    filter.merged = filter.merged ?? true;
    if (contributor) filter.contributors = { $in: [contributor] };

    return filter;
  }

  async updateSubmissions(itemId: number, submissionId: ObjectId) {
    const submissionIds = new Set(
      (
        (
          await this.getOne({
            type: ItemType.PULL_REQUEST,
            id: itemId
          })
        )?.submissions || []
      ).concat(submissionId || [])
    );

    await this.update({ id: itemId, submissions: Array.from(submissionIds) });
  }

  async makeContributors(itemId: number, contributor: ContributorSchema | null) {
    const item = await items.getOne({
      type: ItemType.PULL_REQUEST,
      id: itemId
    });
    const [contributorIds, contributors] = [
      new Set((item?.contributorIds || []).concat(contributor?._id || [])),
      new Set((item?.contributors || []).concat(contributor?.login || []))
    ];

    return { contributorIds: Array.from(contributorIds), contributors: Array.from(contributors) };
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
    'title'
    // 'submissions'
  ],
  properties: {
    contributorIds: { bsonType: 'array', description: 'must be an array.' },
    contributors: { bsonType: 'array', description: 'must be an array.' },
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
      bsonType: ['string', 'null']
    }
  } as any // remove any after you've updated Front-end usage of former ItemSchema
});
