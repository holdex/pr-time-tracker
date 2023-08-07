import type { IssuesEvent } from '$lib/server/github';
import type { ItemCollection } from '$lib/server/mongo/operations';
import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import { collections, updateCollectionInfo } from '$lib/server/mongo/operations';
import { HOUR_IN_MILISECOND, FIXED_DECIMAL_HOUR } from '$lib/constants/constants';

const parseIssuesEvents = async (event: IssuesEvent) => {
  const { action, issue, repository, organization, sender } = event;

  if (action === 'closed') {
    const mongoDB = await clientPromise;

    const requestInfo: ItemCollection = {
      type: 'issue',
      id: issue.id,
      org: organization?.login || 'holdex',
      repo: repository.name,
      owner: issue.user.login || sender.login,
      url: issue.url,
      hours: (
        (Date.parse(issue.closed_at) - Date.parse(issue.created_at)) /
        HOUR_IN_MILISECOND
      ).toFixed(FIXED_DECIMAL_HOUR),
      experience: 'positive'
    };

    const res = await updateCollectionInfo(
      mongoDB.db(config.mongoDBName),
      collections.items,
      { id: requestInfo.id },
      { $set: requestInfo },
      { upsert: true }
    );

    console.log('Successfully stored issue close in DB.');
  }
};

export default parseIssuesEvents;
