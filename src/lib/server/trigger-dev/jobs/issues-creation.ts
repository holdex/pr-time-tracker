import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssuesEvent } from '@octokit/webhooks-types';

import {
  getPreviousComment,
  deleteComment,
  bodyWithHeader,
  submissionHeaderComment,
  createComment,
  getInstallationId
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
        await deleteComment(orgDetails.id, orgName, repository.name, previousComment, io);
      }

      if (issue.title.length > MAX_TITLE_LENGTH) {
        await io.runTask('add-issue-title-comment', async () => {
          const commentBody = bodyWithHeader(
            `@` +
              payload.sender.login +
              ` please change the title of this issue to make sure the length doesn't exceed ` +
              MAX_TITLE_LENGTH +
              ` characters.`,
            payload.issue.id.toString()
          );

          await createComment(
            orgDetails.id,
            orgName,
            repository.name,
            commentBody,
            issue.number,
            io
          );
        });
      }
      break;
    }
    default: {
      io.logger.log('current action for issue is not in the parse candidate', payload);
    }
  }
}
