import type { PullRequestEvent } from '$lib/server/github';
import type { ContributorCollection, ItemCollection } from '$lib/server/mongo/operations';
import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { Collections, updateCollectionInfo } from '$lib/server/mongo/operations';

const upsertDataToDB = async (collection: string, data: ContributorCollection | ItemCollection) => {
  const mongoDB = await clientPromise;

  const res = await updateCollectionInfo(
    mongoDB.db(config.mongoDBName),
    collection,
    { id: data.id },
    { $set: data },
    { upsert: true }
  );

  return res;
};

const parsePullRequestEvents = async (event: PullRequestEvent) => {
  const { action, pull_request, repository, organization, sender } = event;

  switch (action) {
    case 'closed': {
      const prInfo: ItemCollection = {
        type: 'pull_request',
        id: pull_request.id,
        org: organization?.login || 'holdex',
        repo: repository.name,
        owner: pull_request.user.login || sender.login,
        url: pull_request.url,
        createdAt: pull_request.created_at,
        updatedAt: pull_request.updated_at,
        closedAt: pull_request.closed_at
      };

      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('Closed PR has been stored in DB successfully.', prRes);

      const contributorInfo: ContributorCollection = {
        id: pull_request.id,
        login: pull_request.user.login,
        url: pull_request.user.html_url,
        avatarUrl: pull_request.user.avatar_url
      };
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log('Owner of the PR has been stored in DB successfully.', contributorRes);

      break;
    }

    default: {
      console.log('current action for pull request is not in the parse candidate', event);

      break;
    }
  }
};

export default parsePullRequestEvents;
