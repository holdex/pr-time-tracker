import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { Octokit } from 'octokit';
import type { User, Repository, IssueComment } from '@octokit/graphql-schema';

import type { CheckRunEvent } from '$lib/server/github';
import app from '$lib/server/github';
import { contributors } from '$lib/server/mongo/collections';

import { getInstallationId, getSubmissionStatus, submissionCheckPrefix } from '../../github/util';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: CheckRunEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, repository, check_run, organization } = payload;

  switch (action) {
    case 'created':
    case 'rerequested': {
      if (check_run.name.startsWith(submissionCheckPrefix)) {
        const match = check_run.name.match(/\((.*?)\)/);
        const contributor = await contributors.getOne({ login: (match as string[])[1] });
        if (contributor) {
          await runJob<T>(
            {
              organization: organization?.login as string,
              repo: repository.name,
              prId: check_run.pull_requests[0].id,
              prNumber: check_run.pull_requests[0].number,
              checkRunId: check_run.id,
              senderId: contributor.id,
              senderLogin: contributor.login
            },
            io
          );
        }
      }
      break;
    }
    default: {
      io.logger.log('current action for check run is not in the parse candidate', payload);
    }
  }
}

export type EventSchema = {
  organization: string;
  senderId: number;
  senderLogin: string;
  prId: number;
  prNumber: number;
  repo: string;
  checkRunId: number;
};

export async function createEventJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: EventSchema,
  io: T,
  ctx: TriggerContext
) {
  const { organization, repo, senderId, checkRunId, prId, prNumber, senderLogin } = payload;

  await runJob<T>(
    {
      organization: organization,
      repo,
      prId,
      prNumber,
      checkRunId,
      senderId,
      senderLogin
    },
    io
  );
}

async function runJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: EventSchema,
  io: T
) {
  const orgDetails = await io.github.runTask(
    'get org installation',
    async () => {
      const { data } = await getInstallationId(payload.organization);
      return data;
    },
    { name: 'Get Organization installation' }
  );

  const result = await io.github.runTask(
    'update-check-run',
    async () => {
      const submission = await getSubmissionStatus(payload.senderId, payload.prId);
      const octokit = await app.getInstallationOctokit(orgDetails.id);

      return octokit.rest.checks.update({
        owner: payload.organization,
        repo: payload.repo,
        check_run_id: payload.checkRunId,
        status: 'completed',
        conclusion: submission ? 'success' : 'failure',
        completed_at: new Date().toISOString(),
        output: {
          title: submission
            ? `✅ cost submitted: ${submission.hours} hours.`
            : '❌ cost submission missing',
          summary: submission
            ? `Pull request cost submitted. No actions required.`
            : `Submit cost by following the [link](https://invoice.holdex.io).`
        }
      });
    },
    { name: 'Update check run' }
  );

  if (result.data.conclusion === 'success') {
    await io.github.runTask('add-submission-comment', async () => {
      const octokit = await app.getInstallationOctokit(orgDetails.id);

      const previous = await getPreviousComment<typeof octokit>(
        { owner: payload.organization, repo: payload.repo },
        payload.prNumber,
        payload.senderId.toString(),
        octokit
      );

      if (previous) {
        // let's check if the comment is not already available
        await octokit.rest.issues.deleteComment({
          owner: payload.organization,
          repo: payload.repo,
          comment_id: previous?.databaseId as number
        });
      }

      // let's check if the comment is not already available
      return octokit.rest.issues.createComment({
        owner: payload.organization,
        repo: payload.repo,
        body: bodyWithHeader(
          `Hi  @${payload.senderLogin}
          Your PR ${result.data.output.title?.slice(2) as string}
          View submission [on](https://invoice.holdex.io/contributors/${payload.senderId}).
        `,
          payload.senderId.toString()
        ),
        issue_number: payload.prNumber
      });
    });
  }
}

async function getPreviousComment<T extends Octokit>(
  repo: { owner: string; repo: string },
  prNumber: number,
  header: string,
  octokit: T
) {
  let after = null;
  let hasNextPage = true;
  const h = headerComment(header);

  while (hasNextPage) {
    /* eslint-disable no-await-in-loop */
    const data = await octokit.graphql<{ repository: Repository; viewer: User }>(
      `
      query($repo: String! $owner: String! $number: Int! $after: String) {
        viewer { login }
        repository(name: $repo owner: $owner) {
          pullRequest(number: $number) {
            comments(first: 100 after: $after) {
              nodes {
                id
                databaseId
                author {
                  login
                }
                isMinimized
                body
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }
      `,
      { ...repo, after, number: prNumber }
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const viewer = data.viewer as User;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const repository = data.repository as Repository;
    const target = repository.pullRequest?.comments?.nodes?.find(
      (node: IssueComment | null | undefined) =>
        node?.author?.login === viewer.login.replace('[bot]', '') &&
        !node?.isMinimized &&
        node?.body?.includes(h)
    );
    if (target) {
      return target;
    }
    after = repository.pullRequest?.comments?.pageInfo?.endCursor;
    hasNextPage = repository.pullRequest?.comments?.pageInfo?.hasNextPage ?? false;
  }
  return undefined;
}

function headerComment(header: string): string {
  return `<!-- Sticky Pull Request Comment${header} -->`;
}

function bodyWithHeader(body: string, header: string): string {
  return `${body}\n${headerComment(header)}`;
}
