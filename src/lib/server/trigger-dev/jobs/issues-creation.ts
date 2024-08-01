import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssuesEvent } from '@octokit/webhooks-types';

import {
  githubApp,
  getInstallationId,
  getPreviousComment,
  deleteComment,
  bodyWithHeader,
  submissionHeaderComment
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
  const orgDetails = await io.runTask(
    'get-org-installation',
    async () => {
      const { data } = await getInstallationId(orgName);
      return data;
    },
    { name: 'Get Organization installation' }
  );

  switch (action) {
    case 'opened':
    case 'edited': {
      const previousComment = await getPreviousComment(
        orgDetails.id,
        orgName,
        repository.name,
        submissionHeaderComment(payload.issue.id.toString()),
        issue.number,
        io
      );

      if (previousComment) {
        await deleteComment(orgDetails, orgName, repository, previousComment, io);
      }

      if (issue.title.length > MAX_TITLE_LENGTH) {
        await io.runTask('add-issue-title-comment', async () => {
          const octokit = await githubApp.getInstallationOctokit(orgDetails.id);
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