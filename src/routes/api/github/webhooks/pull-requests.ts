import type { ObjectId } from 'mongodb';

import type {
  PullRequestEvent,
  User,
  PullRequest,
  Organization,
  Repository
} from '$lib/server/github';
import type { ContributorCollection, ItemCollection } from '$lib/server/mongo/operations';
import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import {
  Collections,
  findAndupdateCollectionInfo,
  getCollectionInfo
} from '$lib/server/mongo/operations';
import { ItemType } from '$lib/constants';

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
  pr: PullRequest,
  repository: Repository,
  organization: Organization | undefined,
  sender: User,
  contributorRes: any
): Promise<ItemCollection> => {
  const contributorIds = await addContributorIfNotExists(pr.id, contributorRes.value?._id);
  return {
    type: 'pull_request',
    id: pr.id,
    org: organization?.login ?? 'holdex',
    repo: repository.name,
    owner: pr.user.login || sender.login,
    contributorIds,
    url: pr.url,
    createdAt: pr?.created_at,
    updatedAt: pr?.updated_at,
    closedAt: pr.closed_at ?? undefined
  };
};

const parsePullRequestEvents = async (event: PullRequestEvent) => {
  const { action, pull_request, repository, organization, sender } = event;

  switch (action) {
    case 'opened':
    case 'edited':
    case 'synchronize':
    case 'closed': {
      const { user } = pull_request;
      let contributorInfo: ContributorCollection;

      if (action === 'opened' || action === 'closed') {
        contributorInfo = getContributorInfo(user);
      } else {
        contributorInfo = getContributorInfo(sender);
      }

      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo = await getPrInfo(
        pull_request,
        repository,
        organization,
        sender,
        contributorRes
      );
      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('A PR has been updated in DB successfully.', prRes.value);

      break;
    }

    default: {
      console.log('current action for pull request is not in the parse candidate', event);

      break;
    }
  }
};

export default parsePullRequestEvents;
