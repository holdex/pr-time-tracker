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

const getContributorInfo = (user: User): ContributorCollection => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

const getPrInfo = (
  pr: PullRequest,
  repository: Repository,
  organization: Organization | undefined,
  sender: User,
  contributorRes: any
): ItemCollection => ({
  type: 'pull_request',
  id: pr.id,
  org: organization?.login ?? 'holdex',
  repo: repository.name,
  owner: pr.user.login || sender.login,
  contributorIds: [contributorRes.value?._id],
  url: pr.url,
  createdAt: pr?.created_at,
  updatedAt: pr?.updated_at,
  closedAt: pr.closed_at ?? undefined
});

const parsePullRequestEvents = async (event: PullRequestEvent) => {
  const { action, pull_request, repository, organization, sender } = event;

  switch (action) {
    case 'opened': {
      const { user } = pull_request;
      const contributorInfo = getContributorInfo(user);
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been stored in DB successfully.',
        contributorRes.value
      );

      const prInfo = getPrInfo(pull_request, repository, organization, sender, contributorRes);
      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('A new PR has been stored in DB successfully.', prRes.value);

      break;
    }

    case 'closed': {
      const { user } = pull_request;
      const contributorInfo = getContributorInfo(user);
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo = getPrInfo(pull_request, repository, organization, sender, contributorRes);
      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('Closed PR has been updated in DB successfully.', prRes.value);

      break;
    }

    case 'edited':
    case 'synchronize': {
      const contributorInfo = getContributorInfo(sender);
      const contributorRes = await upsertDataToDB(Collections.CONTRIBUTORS, contributorInfo);
      console.log(
        'Contributor of the PR has been updated in DB successfully.',
        contributorRes.value
      );

      const prInfo = getPrInfo(pull_request, repository, organization, sender, contributorRes);
      const prRes = await upsertDataToDB(Collections.ITEMS, prInfo);
      console.log('Existing PR has been updated in DB successfully.', prRes.value);

      break;
    }

    default: {
      console.log('current action for pull request is not in the parse candidate', event);

      break;
    }
  }
};

export default parsePullRequestEvents;
