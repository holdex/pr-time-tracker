import { Github, events } from '@trigger.dev/github';

import type { ObjectId, Document, ModifyResult } from 'mongodb';

import clientPromise, { CollectionNames } from '$lib/server/mongo';
import config from '$lib/server/config';
import type { ContributorSchema, ItemSchema } from '$lib/server/mongo/operations';
import type {
  PullRequest,
  User,
  SimplePullRequest,
  Repository,
  Organization
} from '$lib/server/github';
import { ItemType } from '$lib/constants';
import { items } from '$lib/server/mongo/collections';

const upsertDataToDB = async <T extends Document>(collection: CollectionNames, data: T) => {
  const mongoDB = await clientPromise;

  const res = await mongoDB
    .db(config.mongoDBName)
    .collection<T>(collection)
    .findOneAndUpdate({ id: data.id }, { $set: data }, { returnDocument: 'after', upsert: true });
  return res;
};

const getContributorInfo = (user: User) => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

const addContributorIfNotExists = async (prId: number, contributorId: ObjectId | undefined) => {
  const contributorIds = new Set(
    (
      (
        await items.getOne({
          type: ItemType.PULL_REQUEST,
          id: prId
        })
      )?.contributorIds || []
    ).concat(contributorId || [])
  );

  return Array.from(contributorIds);
};

const getPrInfo = async (
  pr: PullRequest | SimplePullRequest,
  repository: Repository,
  organization: Organization | undefined,
  sender: User,
  contributorRes: ModifyResult<ContributorSchema>
): Promise<ItemSchema> => {
  const contributorIds = await addContributorIfNotExists(pr.id, contributorRes.value?._id);
  let prMerged = false;

  if (pr.closed_at && (pr as PullRequest).merged) prMerged = true;

  return {
    type: ItemType.PULL_REQUEST,
    id: pr.id,
    title: pr.title,
    org: organization?.login ?? 'holdex',
    repo: repository.name,
    owner: pr.user.login || sender.login,
    contributorIds,
    url: pr.url,
    createdAt: pr?.created_at,
    updatedAt: pr?.updated_at,
    merged: prMerged,
    closedAt: pr.closed_at ?? undefined,
    submissions: []
  };
};

const github = new Github({
  id: 'github',
  token: config.github.token
});

export { getContributorInfo, getPrInfo, upsertDataToDB, github, events };
