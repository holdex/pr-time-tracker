import type { IssuesEvent } from '$lib/server/github';

const parseIssuesEvents = async (event: IssuesEvent) => {
  console.log('parsing issue event', event);

  // const { action, issue, repository, organization, sender } = event;

  // if (action === 'closed') {
  //   const mongoDB = await clientPromise;

  //   const requestInfo: ItemCollection = {
  //     type: 'issue',
  //     id: issue.id,
  //     org: organization?.login || 'holdex',
  //     repo: repository.name,
  //     owner: issue.user.login || sender.login,
  //     url: issue.url,
  //     createdAt: issue.created_at,
  //     updatedAt: issue.updated_at,
  //     closedAt: issue.closed_at
  //   };

  //   const res = await updateCollectionInfo(
  //     mongoDB.db(config.mongoDBName),
  //     Collections.ITEMS,
  //     { id: requestInfo.id },
  //     { $set: requestInfo },
  //     { upsert: true }
  //   );

  //   console.log('Successfully stored issue close in DB.', { res });
  // }
};

export default parseIssuesEvents;
