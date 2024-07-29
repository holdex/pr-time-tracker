import type { WithId, Filter, Document } from 'mongodb';

import { DESCENDING, ItemType, MAX_DATA_CHUNK } from '$lib/constants';
import { transform } from '$lib/utils';

import { BaseCollection } from './base.collection';

import {
  Approval,
  CollectionNames,
  type ContributorSchema,
  type GetManyParams,
  type ItemSchema
} from '$lib/@types';

export class ItemsCollection extends BaseCollection<ItemSchema> {
  getMany = async (params?: GetManyParams<ItemSchema>) => {
    const searchParams = ItemsCollection.makeParams(params);
    const contributor_id = transform<string>(searchParams.get('contributor_id'));

    const filter = this.makeFilter(searchParams);
    const approvals = transform<Approval[]>(searchParams.get('approvals'));
    const withContributors = transform<boolean>(searchParams.get('contributors'));
    const withSubmissions = transform<boolean>(searchParams.get('submissions'));
    const submitted = searchParams.get('submitted');
    const { count, skip, sort_by, sort_order } = ItemsCollection.makeQuery(params);

    if (filter.merged === undefined) delete filter.merged;

    return await this.context
      .aggregate<WithId<ItemSchema>>(
        [
          { $match: filter } as Document,
          {
            $lookup: {
              from: CollectionNames.SUBMISSIONS,
              localField: 'id',
              foreignField: 'item_id',
              pipeline: [
                { $match: { owner_id: contributor_id ? { $eq: contributor_id } : { $ne: '' } } }
              ],
              as: 'submission'
            }
          },
          {
            $lookup: {
              from: CollectionNames.CONTRIBUTORS,
              localField: 'contributor_ids',
              foreignField: 'id',
              pipeline: [
                { $match: { id: contributor_id ? { $eq: contributor_id } : { $ne: '' } } }
              ],
              as: 'contributor'
            }
          },
          {
            $match: {
              submission: submitted ? { $exists: true } : { $size: 0 },
              'submission.approval': approvals
                ? { $in: approvals.concat(!submitted ? (null as any) : []) }
                : { $ne: '' }
            }
          },
          {
            $set: {
              submission: { $arrayElemAt: ['$submission', 0] },
              contributor: { $arrayElemAt: ['$contributor', 0] }
            }
          }
        ]
          .concat(
            withContributors
              ? [
                  {
                    $lookup: {
                      from: CollectionNames.CONTRIBUTORS,
                      localField: 'contributor_ids',
                      foreignField: 'id',
                      as: 'contributors'
                    }
                  }
                ]
              : []
          )
          .concat(
            withSubmissions
              ? [
                  {
                    $lookup: {
                      from: CollectionNames.SUBMISSIONS,
                      localField: 'submission_ids',
                      foreignField: '_id',
                      as: 'submissions'
                    }
                  }
                ]
              : []
          )
      )
      .sort({ [sort_by || 'updated_at']: sort_order || DESCENDING })
      .skip(skip || 0)
      .limit(count || MAX_DATA_CHUNK)
      .map((r) => ({ ...r, url: replaceUrl(r.url) }))
      .toArray();
  };

  async makeContributorIds(item: ItemSchema, contributor: ContributorSchema | null) {
    return Array.from(new Set((item?.contributor_ids || []).concat(contributor?.id || [])));
  }

  getOneWithSubmission = async (params: Filter<ItemSchema>, contributorId: number | undefined) => {
    return this.context
      .aggregate<WithId<ItemSchema>>([
        { $match: params } as Document,
        {
          $lookup: {
            from: CollectionNames.SUBMISSIONS,
            localField: 'id',
            foreignField: 'item_id',
            pipeline: [
              { $match: { owner_id: contributorId ? { $eq: contributorId } : { $ne: '' } } },
              { $match: { item_id: params?.id } }
            ],
            as: 'submission'
          }
        },
        {
          $lookup: {
            from: CollectionNames.CONTRIBUTORS,
            localField: 'contributor_ids',
            foreignField: 'id',
            pipeline: [{ $match: { id: contributorId ? { $eq: contributorId } : { $ne: '' } } }],
            as: 'contributor'
          }
        },
        {
          $set: {
            submission: { $arrayElemAt: ['$submission', 0] },
            contributor: { $arrayElemAt: ['$contributor', 0] }
          }
        }
      ])
      .map((r) => ({ ...r, url: replaceUrl(r.url) }))
      .toArray();
  };

  makeFilter(searchParams?: URLSearchParams) {
    const filter: Partial<Filter<ItemSchema>> = super.makeFilter(searchParams);
    const contributorId = transform<number>(searchParams?.get('contributor_id'));
    const lastItems = transform<number>(searchParams?.get('last'));

    if (contributorId) filter.contributor_ids = { $in: [contributorId] };

    const now = new Date();
    const priorDate = new Date(new Date().setDate(now.getDate() - 30));
    if (lastItems) filter.created_at = { $lte: now.toISOString(), $gte: priorDate.toISOString() };

    return filter;
  }
}

const replaceUrl = (url: string) => {
  return url.replace(
    /https:\/\/api\.github\.com\/repos\/([^\/]+)\/([^\/]+)\/pulls\/(\d+)/,
    'https://github.com/$1/$2/pull/$3'
  );
};

export const items = new ItemsCollection(CollectionNames.ITEMS, {
  required: [
    'contributor_ids',
    'id',
    'merged',
    'org',
    'owner',
    'repo',
    'type',
    'url',
    'title',
    'submission_ids',
    // 'created_at',
    'updated_at'
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
    number: {
      bsonType: ['int'],
      description: 'must be provided.'
    },
    total_cost: {
      bsonType: ['int', 'double'],
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
  }
});
