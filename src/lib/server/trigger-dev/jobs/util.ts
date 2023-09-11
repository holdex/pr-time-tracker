import { Github, events } from '@trigger.dev/github';

import type { Document, ModifyResult } from 'mongodb';

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

const addContributorIfNotExists = async (prId: number, contributorId: number | undefined) => {
  const mongoDB = await clientPromise;

  const contributorIds = (
    await mongoDB.db(config.mongoDBName).collection<ItemSchema>(CollectionNames.ITEMS).findOne({
      type: ItemType.PULL_REQUEST,
      id: prId
    })
  )?.contributor_ids;

  if (contributorIds === undefined) {
    return [];
  }

  if (contributorId === undefined) {
    return contributorIds;
  }

  const isInArray = contributorIds.some(
    (currentContributorId) => currentContributorId === contributorId
  );

  if (!isInArray) {
    contributorIds.push(contributorId);
  }

  return contributorIds;
};

const getPrInfo = async (
  pr: PullRequest | SimplePullRequest,
  repository: Repository,
  organization: Organization | undefined,
  sender: User,
  contributorRes: ModifyResult<ContributorSchema>
): Promise<ItemSchema> => {
  const contributorIds = await addContributorIfNotExists(pr.id, contributorRes.value?.id);

  let prMerged = false;
  if (pr.closed_at && (pr as PullRequest).merged) {
    prMerged = true;
  }

  return {
    type: ItemType.PULL_REQUEST,
    id: pr.id,
    title: pr.title,
    org: organization?.login ?? 'holdex',
    repo: repository.name,
    owner: pr.user.login || sender.login,
    contributor_ids: contributorIds,
    url: pr.url,
    created_at: pr?.created_at,
    updated_at: pr?.updated_at,
    merged: prMerged,
    closed_at: pr.closed_at ?? undefined
  };
};

const github = new Github({
  id: 'github',
  token: config.github.token
});

export { getContributorInfo, getPrInfo, upsertDataToDB, github, events };
