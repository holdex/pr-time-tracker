import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssuesEvent } from '@octokit/webhooks-types';

import { githubApp, getInstallationId, getPreviousComment } from '../utils';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: IssuesEvent,
  io: T,
  ctx: TriggerContext,
  org: { nodeId: string; name: string }
) {
  const { action, organization, repository, issue } = payload;
  const MAX_TITLE_LENGTH = 65;

  function submissionHeaderComment(header: string): string {
    return `<!-- Sticky Issue Comment${header} -->`;
  }

  function bodyWithHeader(body: string, header: string): string {
    return `${body}\n${submissionHeaderComment(header)}`;
  }

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
      const previousComment = await io.runTask('get-previous-comment', async () => {
        try {
          const octokit = await githubApp.getInstallationOctokit(orgDetails.id);
          const previous = await getPreviousComment<typeof octokit>(
            { owner: orgName, repo: repository.name },
            issue.number,
            submissionHeaderComment(payload.issue.id.toString()),
            octokit
          );
          return previous;
        } catch (error) {
          await io.logger.error('get previous comment', { error });
          return null;
        }
      });

      if (previousComment) {
        await deleteIssueTitleComment(
          githubApp,
          orgDetails,
          orgName,
          repository,
          previousComment,
          io
        );
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

  async function deleteIssueTitleComment(
    githubApp: any,
    orgDetails: { id: number },
    orgName: string,
    repository: { name: string },
    previousComment: any,
    io: any
  ): Promise<void> {
    try {
      await io.runTask('delete-issue-title-comment', async () => {
        const octokit = await githubApp.getInstallationOctokit(orgDetails.id);
        if (previousComment?.databaseId) {
          await octokit.rest.issues.deleteComment({
            owner: orgName,
            repo: repository.name,
            comment_id: previousComment.databaseId
          });
        }
      });
    } catch (error) {
      await io.logger.error('delete issue title comment', { error });
    }
  }
}
