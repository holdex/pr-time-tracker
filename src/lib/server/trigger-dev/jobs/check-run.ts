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
import type { CheckRunEvent } from '@octokit/webhooks-types';

import { contributors } from '$lib/server/mongo/collections';

import { getInstallationId, getSubmissionStatus, submissionCheckPrefix, githubApp } from '../utils';

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
          const prDetails = await io.github.runTask(
            'get-pr-info',
            async () => {
              const { data } = await getInstallationId(organization?.login as string);
              const octokit = await githubApp.getInstallationOctokit(data.id);

              return getPrInfoByCheckRunNodeId(payload, octokit);
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
                  : (prDetails?.number as number),
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
  await io.wait('wait for sync in case a similar run is available', 6);

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
      const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

      return octokit.rest.repos.get({ owner: payload.organization, repo: payload.repo });
    },
    { name: 'Get Repo Details' }
  );

  const checkDetails = await io.github.runTask(
    'get-check-id',
    async () => {
      const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

      return octokit.rest.checks.get({
        owner: payload.organization,
        repo: repoDetails.data.name,
        check_run_id: payload.checkRunId
      });
    },
    { name: 'Get Check Details' }
  );

  const result = await io.github.runTask(
    'update-check-run',
    async () => {
      const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

      return updateCheckRun(octokit, {
        repositoryId: repoDetails.data.node_id,
        checkRunId: checkDetails.data.node_id,
        status: 'COMPLETED',
        conclusion: submission ? 'SUCCESS' : 'FAILURE',
        completedAt: new Date().toISOString(),
        detailsUrl: `https://pr-time-tracker.vercel.app/prs/${payload.organization}/${repoDetails.data.name}/${payload.prId}`,
        output: {
          title: submission
            ? `✅ cost submitted: ${submission.hours} hours.`
            : '❌ cost submission missing',
          summary: submission
            ? `Pull request cost submitted. No actions required.`
            : `Submit cost by following the [link](https://pr-time-tracker.vercel.app/prs/${payload.organization}/${repoDetails.data.name}/${payload.prId}).`
        }
      }).then((r) => r.updateCheckRun);
    },
    { name: 'Update check run' }
  );

  // if failure -> check comment -> create if not exists -> update the list
  // if success -> check comment -> create if not exits -> update the list

  const previous = await io.github.runTask('get previous comment', async () => {
    const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

    const previous = await getPreviousComment<typeof octokit>(
      { owner: payload.organization, repo: repoDetails.data.name },
      payload.prNumber,
      payload.prId.toString(),
      octokit
    );
    return previous;
  });
  let current: any = null;

  const submissionCreated = result.checkRun?.conclusion === 'SUCCESS';
  let members: string[] = [];

  const commentBody = bodyWithHeader(
    `<members>⚠️⚠️⚠️\nYou must [submit the time](https://pr-time-tracker.vercel.app/prs/${payload.organization}/${repoDetails.data.name}/${payload.prId}) spent on this PR.\n⚠️⚠️⚠️`,
    payload.prId.toString()
  );

  if (!previous) {
    members = bindMembers('', payload.senderLogin, submissionCreated);
    if (members.length > 0) {
      current = await io.github.runTask('add-submission-comment', async () => {
        const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

        const comment = await octokit.rest.issues.createComment({
          owner: payload.organization,
          repo: repoDetails.data.name,
          body: commentBody.replace('<members>', `${members.join(`\n`)}\n`),
          issue_number: payload.prNumber
        });
        return comment;
      });
    }
  } else {
    members = bindMembers(previous.body, payload.senderLogin, submissionCreated);

    if (members.length > 0) {
      await io.github.runTask('update-submission-comment', async () => {
        const octokit = await githubApp.getInstallationOctokit(orgDetails.id);
        try {
          // let's check if the comment is not already available
          const comment = await octokit.rest.issues.updateComment({
            owner: payload.organization,
            repo: repoDetails.data.name,
            comment_id: previous?.databaseId as number,
            body: commentBody.replace('<members>', `${members.join(`\n`)}\n`)
          });
          return Promise.resolve(comment);
        } catch (error) {
          await io.logger.error('update comment', { error });
          return Promise.resolve();
        }
      });
    }
  }

  // if no members remove the comment
  if (members.length === 0 && (previous || current)) {
    await io.github.runTask('delete previous comment', async () => {
      const octokit = await githubApp.getInstallationOctokit(orgDetails.id);

      try {
        // let's check if the comment is not already available
        await octokit.rest.issues.deleteComment({
          owner: payload.organization,
          repo: repoDetails.data.name,
          comment_id: previous ? (previous?.databaseId as number) : current?.data.id
        });
      } catch (error) {
        await io.logger.error('delete previous comment', { error });
      }
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

async function getPrInfoByCheckRunNodeId<T extends Octokit>(
  checkRunEvent: CheckRunEvent,
  octokit: T
) {
  const data = await octokit.graphql<{ node: CheckRun }>(
    `
      query($nodeId: ID!) {
        node(id: $nodeId) {
          ...on CheckRun {
            detailsUrl
            repository {
              pullRequests(last: 50) {
                nodes {
                  number
                  id
                  fullDatabaseId
                }
              }
            }
            checkSuite {
              commit {
                id
                associatedPullRequests(first: 1) {
                  nodes {
                    number
                    fullDatabaseId
                    id
                  }
                }
              }
            }
          }
        }
      }
      `,
    { nodeId: checkRunEvent.check_run.node_id as string }
  );

  const { commit } = data.node.checkSuite;

  if (
    !commit.associatedPullRequests ||
    (commit.associatedPullRequests &&
      commit.associatedPullRequests.nodes &&
      commit.associatedPullRequests.nodes.length === 0)
  ) {
    if (checkRunEvent.check_run.check_suite.head_branch !== null) {
      // we need diffent method
      const params = {
        owner: checkRunEvent.repository.owner.login as string,
        repo: checkRunEvent.repository.name,
        state: 'all' as any,
        head: `${checkRunEvent.organization?.login as string}:${
          checkRunEvent.check_run.check_suite.head_branch
        }`
      };
      const info = await octokit.rest.pulls.list(params);
      if (info && info.data) {
        const found = info.data.find((p) => (p.head.label = params.head));
        return { id: found?.node_id, number: found?.number, fullDatabaseId: found?.id };
      } else {
        throw new Error('failed to get pull request' + JSON.stringify(params));
      }
    } else {
      const { repository, detailsUrl } = data.node;

      const parsedDBId = parseDBId(detailsUrl);
      if (
        repository &&
        repository.pullRequests &&
        repository.pullRequests.nodes &&
        repository.pullRequests.nodes.length > 0
      ) {
        const found = repository.pullRequests.nodes.find(
          (p) => Number(p?.fullDatabaseId) === Number(parsedDBId)
        );
        if (found) {
          return { id: found.id, number: found?.number, fullDatabaseId: found.fullDatabaseId };
        }
      } else {
        throw new Error('failed to get pull request');
      }
    }
  }
  return ((commit.associatedPullRequests as PullRequestConnection).nodes as PullRequest[])[0];
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

const regex = new RegExp(/\B@([a-z0-9](?:-(?=[a-z0-9])|[a-z0-9]){0,38}(?<=[a-z0-9]))/, 'gmi');
function bindMembers(previousCommentBody: string, member: string, submissionCreated: boolean) {
  if (previousCommentBody.length === 0) {
    if (submissionCreated) return [];
    return [`@${member}`];
  } else {
    let list = (previousCommentBody.match(regex) || []) as Array<string>;

    if (list && !list.includes(`@${member}`)) {
      list.push(`@${member}`);
    }

    if (submissionCreated) {
      list = list?.filter((f) => f !== `@${member}`);
    }

    return [...new Set(list)];
  }
}

function parseDBId(url: string) {
  const arr = url.split('/');
  return arr[arr.length - 1];
}
