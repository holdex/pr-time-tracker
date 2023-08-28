import type { ObjectId } from 'mongodb';

import { ItemType } from '$lib/constants';
import config from '$lib/server/config';
import type {
  PullRequest,
  User,
  SimplePullRequest,
  Repository,
  Organization
} from '$lib/server/github';
import clientPromise from '$lib/server/mongo';
import {
  findAndupdateCollectionInfo,
  type ContributorCollection,
  type ItemCollection,
  getCollectionInfo,
  Collections
} from '$lib/server/mongo/operations';

const upsertDataToDB = async (collection: string, data: ContributorCollection | ItemCollection) => {
  const mongoDB = await clientPromise;

  const res = await findAndupdateCollectionInfo(
    mongoDB.db(config.mongoDBName),
    collection,
    { id: data.id },
    { $set: data },
    { returnDocument: 'after', upsert: true }
  );

  return res;
};

const addContributorIfNotExists = async (prId: number, contributorId: ObjectId | undefined) => {
  const mongoDB = await clientPromise;

  const contributorIds = await (
    await getCollectionInfo(mongoDB.db(config.mongoDBName), Collections.ITEMS, {
      type: ItemType.PULL_REQUEST,
      id: prId
    })
  )?.contributorIds;

  if (contributorIds === undefined) {
    return [contributorId];
  }

  if (contributorId === undefined) {
    return contributorIds;
  }

  const isInArray = contributorIds.some((currentContributorId: ObjectId) =>
    currentContributorId.equals(contributorId)
  );

  if (!isInArray) {
    contributorIds.push(contributorId);
  }

  return contributorIds;
};
const getContributorInfo = (user: User): ContributorCollection => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

const getPrInfo = async (
  pr: PullRequest | SimplePullRequest,
  repository: Repository,
  organization: Organization | undefined,
  sender: User,
  contributorRes: any
): Promise<ItemCollection> => {
  const contributorIds = await addContributorIfNotExists(pr.id, contributorRes.value?._id);

  let prMerged = false;
  if (pr.closed_at && (pr as PullRequest).merged) {
    prMerged = true;
  }

  return {
    type: 'pull_request',
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
    closedAt: pr.closed_at ?? undefined
  };
};

export { getPrInfo, upsertDataToDB, getContributorInfo };
