import type { WithId, Filter, ObjectId } from 'mongodb';

import { DESCENDING, ItemType, MAX_DATA_CHUNK } from '$lib/constants';
import { transform } from '$lib/utils';

import {
  CollectionNames,
  type ContributorSchema,
  type GetManyParams,
  type ItemSchema
} from '../types';
import { BaseCollection } from './base.collection';

export class ItemsCollection extends BaseCollection<ItemSchema> {
  getMany = async (params?: GetManyParams<ItemSchema>) => {
    const searchParams = ItemsCollection.makeParams(params);
    const contributor_id = transform<string>(searchParams.get('contributor_id'));

    if (!contributor_id) return await super.getMany(searchParams);

    const filter = this.makeFilter(searchParams);
    const submitted = transform<boolean>(searchParams.get('submitted'));
    const definesSubmitted = typeof submitted === 'boolean';
    const { count, skip, sort_by, sort_order } = ItemsCollection.makeQuery(params);

    return await this.context
      .aggregate<WithId<ItemSchema>>([
        { $match: filter },
        {
          $lookup: {
            from: CollectionNames.SUBMISSIONS,
            localField: 'id',
            foreignField: 'item_id',
            as: 'submission'
          }
        },
        {
          $unwind: { path: '$submission', preserveNullAndEmptyArrays: true }
        },
        {
          $match: {
            submission: definesSubmitted ? { $exists: submitted } : undefined,
            'submission.owner_id': submitted ? { $eq: contributor_id } : undefined
          }
        }
      ])
      .skip(skip || 0)
      .limit(count || MAX_DATA_CHUNK)
      .sort({ [sort_by || 'updated_at']: sort_order || DESCENDING })
      .toArray();
  };

  async updateSubmissions(itemId: number, submissionId: ObjectId) {
    const submissionIds = new Set(
      ((await this.getOne({ id: itemId }))?.submission_ids || []).concat(submissionId || [])
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

  makeFilter(searchParams?: URLSearchParams) {
    const filter: Partial<Filter<ItemSchema>> = super.makeFilter(searchParams);
    const contributorId = transform<number>(searchParams?.get('contributor_id'));

    filter.merged = filter.merged ?? true;
    if (contributorId) filter.contributor_ids = { $in: [contributorId] };

    return filter;
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
    // 'submission_ids',
    // 'created_at',
    // 'updated_at',
    // 'closed_at'
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
    submission_ids: { bsonType: 'array', description: 'must be an array.' },
    title: { bsonType: 'string', description: 'must be provided.' },
    type: {
      enum: Object.values(ItemType),
      description: 'must be one of the enum values.'
    },
    url: {
      bsonType: 'string',
      description: 'must be provided.'
    },
    created_at: {
      bsonType: ['string', 'null'],
      description: 'must be provided.'
    },
    updated_at: {
      bsonType: ['string', 'null'],
      description: 'must be provided.'
    },
    closed_at: {
      bsonType: ['string', 'null'],
      description: 'must be provided.'
    }
  } as any // remove any after you've updated Front-end usage of former ItemSchema
});
