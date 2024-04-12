import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { Octokit } from 'octokit';
import type {
  User,
  Repository,
  IssueComment,
  CheckRun,
  PullRequestConnection,
  PullRequest,
  UpdateCheckRunPayload,
  UpdateCheckRunInput
} from '@octokit/graphql-schema';

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
          await io.wait('wait for sync in case a similar run is available', 5);
          const prDetails = await io.github.runTask(
            'get-pr-info',
            async () => {
              const { data } = await getInstallationId(organization?.login as string);
              const octokit = await app.getInstallationOctokit(data.id);

              return getPrInfoByCheckRunNodeId(check_run.node_id as string, octokit);
            },
            { name: 'Get Pr info' }
          );

          await runJob<T>(
            {
              organization: organization?.login as string,
              repo: repository.name,
              prId:
                check_run.pull_requests && check_run.pull_requests.length > 0
                  ? check_run.pull_requests[0].id
                  : Number(prDetails.fullDatabaseId),
              prNumber:
                check_run.pull_requests && check_run.pull_requests.length > 0
                  ? check_run.pull_requests[0].number
                  : prDetails.number,
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

  const submission = await io.github.runTask(
    'get-submission',
    async () => {
      return getSubmissionStatus(payload.senderId, payload.prId);
    },
    { name: 'Get Submission' }
  );

  const repoDetails = await io.github.runTask(
    'get-repo-id',
    async () => {
      const octokit = await app.getInstallationOctokit(orgDetails.id);

      return octokit.rest.repos.get({ owner: payload.organization, repo: payload.repo });
    },
    { name: 'Get Repo Details' }
  );

  const checkDetails = await io.github.runTask(
    'get-check-id',
    async () => {
      const octokit = await app.getInstallationOctokit(orgDetails.id);

      return octokit.rest.checks.get({
        owner: payload.organization,
        repo: payload.repo,
        check_run_id: payload.checkRunId
      });
    },
    { name: 'Get Check Details' }
  );

  const result = await io.github.runTask(
    'update-check-run',
    async () => {
      const octokit = await app.getInstallationOctokit(orgDetails.id);

      return updateCheckRun(octokit, {
        repositoryId: repoDetails.data.node_id,
        checkRunId: checkDetails.data.node_id,
        status: 'COMPLETED',
        conclusion: submission ? 'SUCCESS' : 'FAILURE',
        completedAt: new Date().toISOString(),
        detailsUrl: `https://pr-time-tracker.vercel.app/prs/${payload.organization}/${payload.repo}/${payload.prId}`,
        output: {
          title: submission
            ? `✅ cost submitted: ${submission.hours} hours.`
            : '❌ cost submission missing',
          summary: submission
            ? `Pull request cost submitted. No actions required.`
            : `Submit cost by following the [link](https://pr-time-tracker.vercel.app/prs/${payload.organization}/${payload.repo}/${payload.prId}).`
        }
      }).then((r) => r.updateCheckRun);
    },
    { name: 'Update check run' }
  );
  if (result.checkRun?.conclusion === 'SUCCESS') {
    await io.github.runTask('add-submission-comment', async () => {
      const octokit = await app.getInstallationOctokit(orgDetails.id);

      const previous = await getPreviousComment<typeof octokit>(
        { owner: payload.organization, repo: payload.repo },
        payload.prNumber,
        payload.senderId.toString(),
        octokit
      );

      await io.logger.info('previous comment', { previous });

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
          Your PR ${result.checkRun?.title?.slice(2) as string}
          View submission [on](https://pr-time-tracker.vercel.app/prs/${payload.organization}/${
            payload.repo
          }/${payload.prId}).
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

async function getPrInfoByCheckRunNodeId<T extends Octokit>(check_run_node_id: string, octokit: T) {
  const data = await octokit.graphql<{ node: CheckRun }>(
    `
      query($nodeId: ID!) {
        node(id: $nodeId) {
          ...on CheckRun {
            checkSuite {
              commit {
                associatedPullRequests(first: 1) {
                  nodes {
                    ...on PullRequest {
                      number
                      id
                      fullDatabaseId
                    }
                  }
                }
              }
            }
          }
        }
      }
      `,
    { nodeId: check_run_node_id }
  );

  const { commit } = data.node.checkSuite;
  return ((commit?.associatedPullRequests as PullRequestConnection).nodes as PullRequest[])[0];
}

async function updateCheckRun<T extends Octokit>(octokit: T, input: UpdateCheckRunInput) {
  return octokit.graphql<{ updateCheckRun: UpdateCheckRunPayload }>(
    `
      mutation($input: UpdateCheckRunInput!) {
        updateCheckRun(input: $input) {
          checkRun {
            id
            conclusion
            title
            summary
          }
          clientMutationId
        }
      }
      `,
    { input }
  );
}

function headerComment(header: string): string {
  return `<!-- Sticky Pull Request Comment${header} -->`;
}

function bodyWithHeader(body: string, header: string): string {
  return `${body}\n${headerComment(header)}`;
}
