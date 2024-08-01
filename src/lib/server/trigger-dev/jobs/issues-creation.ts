import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssuesEvent } from '@octokit/webhooks-types';

import {
  githubApp,
  getPreviousComment,
  deleteComment,
  bodyWithHeader,
  submissionHeaderComment,
  getOrgID
} from '../utils';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: IssuesEvent,
  io: T,
  ctx: TriggerContext,
  org: { nodeId: string; name: string }
) {
  const { action, organization, repository, issue } = payload;
  const MAX_TITLE_LENGTH = 65;
  const orgName = organization?.login || 'holdex';
  const orgID = (await getOrgID(orgName, io)) || -1;

  switch (action) {
    case 'opened':
    case 'edited': {
      const previousComment = await getPreviousComment(
        orgID,
        orgName,
        repository.name,
        submissionHeaderComment(payload.issue.id.toString()),
        issue.number,
        io
      );

      if (previousComment) {
        await deleteComment(orgID, orgName, repository, previousComment, io);
      }

      if (issue.title.length > MAX_TITLE_LENGTH) {
        await io.runTask('add-issue-title-comment', async () => {
          const octokit = await githubApp.getInstallationOctokit(orgID);
          const commentBody = bodyWithHeader(
            `<username> please change the title of this issue to make sure the length doesn't exceed ` +
              MAX_TITLE_LENGTH +
              ` characters.`,
            payload.issue.id.toString()
          );

          try {
            await octokit.rest.issues.createComment({
              owner: orgName,
              repo: repository.name,
              body: commentBody.replace('<username>', '@' + payload.sender.login),
              issue_number: issue.number
            });
          } catch (error) {
            await io.logger.error('add issue comment', { error });
          }
        });
      }
      break;
    }
    default: {
      io.logger.log('current action for issue is not in the parse candidate', payload);
    }
  }
}
