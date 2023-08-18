import type { PullRequestEvent } from '$lib/server/github';
import type { ContributorCollection, ItemCollection } from '$lib/server/mongo/operations';
import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { Collections, findAndupdateCollectionInfo } from '$lib/server/mongo/operations';

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

const parsePullRequestEvents = async (event: PullRequestEvent) => {
  const { action, pull_request, repository, organization, sender } = event;

  switch (action) {
    case 'opened': {
      const { user } = pull_request;
      const contributorInfo: ContributorCollection = {
        id: user.id,
        name: user.login,
        login: user.login,
        url: user.html_url,
        avatarUrl: user.avatar_url,
        pullRequest: pull_request.number
      };
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been stored in DB successfully.',
        contributorRes.value
      );

      const prInfo: ItemCollection = {
        type: 'pull_request',
        id: pull_request.id,
        org: organization?.login || 'holdex',
        repo: repository.name,
        owner: pull_request.user.login || sender.login,
        contributorIds: [contributorRes.value?._id],
        url: pull_request.url,
        createdAt: pull_request.created_at
      };

      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('Closed PR has been stored in DB successfully.', prRes.value);

      break;
    }

    case 'closed': {
      const { user } = pull_request;
      const contributorInfo: ContributorCollection = {
        id: user.id,
        name: user.login,
        login: user.login,
        url: user.html_url,
        avatarUrl: user.avatar_url,
        pullRequest: pull_request.number
      };
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo: ItemCollection = {
        type: 'pull_request',
        id: pull_request.id,
        org: organization?.login || 'holdex',
        repo: repository.name,
        owner: pull_request.user.login || sender.login,
        contributorIds: [contributorRes.value?._id],
        url: pull_request.url,
        createdAt: pull_request.created_at,
        updatedAt: pull_request.updated_at,
        closedAt: pull_request.closed_at
      };

      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('Closed PR has been updated in DB successfully.', prRes.value);

      break;
    }

    case 'edited':
    case 'synchronize': {
      const contributorInfo: ContributorCollection = {
        id: sender.id,
        name: sender.login,
        login: sender.login,
        url: sender.html_url,
        avatarUrl: sender.avatar_url,
        pullRequest: pull_request.number
      };
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo: ItemCollection = {
        type: 'pull_request',
        id: pull_request.id,
        org: organization?.login || 'holdex',
        repo: repository.name,
        owner: pull_request.user.login || sender.login,
        contributorIds: [contributorRes.value?._id],
        url: pull_request.url,
        createdAt: pull_request.created_at,
        updatedAt: pull_request.updated_at
      };

      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('Closed PR has been updated in DB successfully.', prRes.value);

      break;
    }

    default: {
      console.log('current action for pull request is not in the parse candidate', event);

      break;
    }
  }
};

export default parsePullRequestEvents;
