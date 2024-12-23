import { logger } from '@trigger.dev/sdk/v3';

import type { IssuesEvent } from '@octokit/webhooks-types';

import {
  getPreviousComment,
  deleteComment,
  bodyWithHeader,
  submissionHeaderComment,
  createComment,
  getInstallationId
} from '../utils';

export async function createJob(payload: IssuesEvent) {
  const { action, organization, repository, issue } = payload;
  const MAX_TITLE_LENGTH = 65;
  const orgName = organization?.login || 'holdex';
  const orgDetails = await logger.trace('get-org-installation', async () => {
    const { data } = await getInstallationId(orgName);
    return data;
  });

  switch (action) {
    case 'opened':
    case 'edited': {
      await logger.trace('delete-previous-comment', async () => {
        const previousComment = await getPreviousComment(
          orgDetails.id,
          orgName,
          repository.name,
          submissionHeaderComment('Issue', payload.issue.id.toString()),
          issue.number,
          'issue',
          'bot'
        );

        if (previousComment) {
          await deleteComment(orgDetails.id, orgName, repository.name, previousComment);
        }
      });

      if (issue.title.length > MAX_TITLE_LENGTH) {
        await logger.trace('add-issue-title-comment', async () => {
          const commentBody = bodyWithHeader(
            'Issue',
            `@` +
              payload.sender.login +
              ` please change the title of this issue to make sure the length doesn't exceed ` +
              MAX_TITLE_LENGTH +
              ` characters.`,
            payload.issue.id.toString()
          );

          await createComment(orgDetails.id, orgName, repository.name, commentBody, issue.number);
        });
      }
      break;
    }
    default: {
      logger.log('current action for issue is not in the parse candidate', payload as any);
    }
  }
}
