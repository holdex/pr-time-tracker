import type { PullRequestEvent } from '$lib/server/github';
import type { ItemCollection } from '$lib/server/mongo/operations';
import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { collections, updateCollectionInfo } from '$lib/server/mongo/operations';

const parsePullRequestEvents = async (event: PullRequestEvent) => {
  const { action, pull_request, repository, organization, sender } = event;

  if (action === 'closed') {
    const mongoDB = await clientPromise;

    const requestInfo: ItemCollection = {
      type: 'pull_request',
      id: pull_request.id,
      org: organization?.login || 'holdex',
      repo: repository.name,
      owner: pull_request.user.login || sender.login,
      url: pull_request.url
    };

    const res = await updateCollectionInfo(
      mongoDB.db(config.mongoDBName),
      collections.items,
      { id: requestInfo.id },
      { $set: requestInfo },
      { upsert: true }
    );

    console.log('Successfully stored pr close in DB.', res);
  }
};

export default parsePullRequestEvents;
