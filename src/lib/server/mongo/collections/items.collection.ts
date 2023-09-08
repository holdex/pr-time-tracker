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
    const contributor = transform<string>(searchParams.get('contributor'));

    if (!contributor) return await super.getMany(searchParams);

    const filter = this.makeFilter(searchParams);
    const submitted = transform<boolean>(searchParams.get('submitted'));
    const { count, skip, sort_by, sort_order } = ItemsCollection.makeQuery(params);

    return await this.context
      .aggregate<WithId<ItemSchema>>([
        { $match: filter },
        {
          $lookup: {
            from: CollectionNames.SUBMISSIONS,
            localField: 'owner',
            foreignField: 'owner',
            as: 'submission'
          }
        },
        {
          $unwind: { path: '$submission', preserveNullAndEmptyArrays: true }
        },
        {
          $match: {
            submission: typeof submitted === 'boolean' ? { $exists: submitted } : undefined
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
      new Set(
        (item?.contributor_ids || item?.contributorIds || [])!
          .map(String)
          .concat(contributor?._id?.toString() || [])
      ),
      new Set((item?.contributors || []).concat(contributor?.login || []))
    ];

    return {
      contributorIds: Array.from(contributorIds),
      contributors: Array.from(contributors)
    };
  }

  makeFilter(searchParams?: URLSearchParams) {
    const filter: Partial<Filter<ItemSchema>> = super.makeFilter(searchParams);
    const contributor = transform<string>(searchParams?.get('contributor'));

    filter.merged = filter.merged ?? true;
    if (contributor) filter.contributors = { $in: [contributor] };

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
    // 'submissions',
    // 'created_at',
    // 'updated_at',
    // 'closed_at'
  ],
  properties: {
    contributor_ids: { bsonType: 'array', description: 'must be an array.' },
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
