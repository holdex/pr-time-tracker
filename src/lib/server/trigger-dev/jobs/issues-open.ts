import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssuesOpenedEvent } from '@octokit/webhooks-types';

import { githubApp, getInstallationId } from '../utils';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: IssuesOpenedEvent,
  io: T,
  ctx: TriggerContext,
  org: { nodeId: string; name: string }
) {
  const { action, organization, repository, issue } = payload;

  function submissionHeaderComment(header: string): string {
    return `<!-- Sticky Issue Comment${header} -->`;
  }

  function bodyWithHeader(body: string, header: string): string {
    return `${body}\n${submissionHeaderComment(header)}`;
  }

  switch (action) {
    case 'opened': {
      if (issue.title.length > 65) {
        try {
          const orgName = organization?.login || 'holdex';
          const orgDetails = await io.runTask(
            'get org installation',
            async () => {
              const { data } = await getInstallationId(orgName);
              return data;
            },
            { name: 'Get Organization installation' }
          );

          await io.runTask('add-issue-comment', async () => {
            const octokit = await githubApp.getInstallationOctokit(orgDetails.id);
            const commentBody = bodyWithHeader(
              `<username> please change the title of this issue to make sure the length doesn't exceed 65 characters.`,
              payload.issue.id.toString()
            );

            const comment = await octokit.rest.issues.createComment({
              owner: orgName,
              repo: repository.name,
              body: commentBody.replace('<username>', '@' + payload.sender.login),
              issue_number: issue.number
            });

            return Promise.resolve(comment);
          });
        } catch (error) {
          await io.logger.error('add issue comment', { error });
          return Promise.resolve();
        }
      }
    }
    default: {
      io.logger.log('current action for issue is not in the parse candidate', payload);
    }
  }
}
