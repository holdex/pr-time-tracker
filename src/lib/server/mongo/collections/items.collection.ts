import type { Filter, ObjectId } from 'mongodb';

import { ItemType } from '$lib/constants';
import { transform } from '$lib/utils';

import { CollectionNames, type ContributorSchema, type ItemSchema } from '../types';
import { BaseCollection } from './base.collection';

export class ItemsCollection extends BaseCollection<ItemSchema> {
  generateFilter(searchParams?: URLSearchParams) {
    const filter: Partial<Filter<ItemSchema>> = super.generateFilter(searchParams);
    const contributorId = transform<number>(searchParams?.get('contributor_id'));

    filter.merged = filter.merged ?? true;
    if (contributorId) filter.contributor_ids = { $in: [contributorId] };

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
        )?.submission_ids || []
      ).concat(submissionId || [])
    );

    await this.update({ id: itemId, submission_ids: Array.from(submissionIds) });
  }

  async makeContributorIds(itemId: number, contributor: ContributorSchema | null) {
    const item = await items.getOne({
      type: ItemType.PULL_REQUEST,
      id: itemId
    });
    const contributorIds = new Set((item?.contributor_ids || []).concat(contributor?.id || []));

    return Array.from(contributorIds);
  }
}

export const items = new ItemsCollection(CollectionNames.ITEMS, {
  required: [
    // 'contributor_ids',
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
    contributor_ids: { bsonType: 'array', description: 'must be an array.' },
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
    closed_at: {
      bsonType: ['string', 'null']
    }
  } as any // remove any after you've updated Front-end usage of former ItemSchema
});
