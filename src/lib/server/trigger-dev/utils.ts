import { App, Octokit } from 'octokit';

import type {
  User,
  PullRequest,
  SimplePullRequest,
  Organization,
  Repository,
  PullRequestEvent,
  PullRequestReviewEvent
} from '@octokit/webhooks-types';
import type { User as UserGQL, Repository as RepoGQL, IssueComment } from '@octokit/graphql-schema';
import type { ContributorSchema, ItemSchema } from '$lib/@types';
import type { IOWithIntegrations } from '@trigger.dev/sdk';

import config from '$lib/server/config';
import { ItemType } from '$lib/constants';
import { items, submissions } from '$lib/server/mongo/collections';

import { client, type Autoinvoicing } from './client';

const githubApp = new App({
  appId: config.github.appId,
  privateKey: config.github.privateKey,
  webhooks: {
    secret: config.webhookSecret
  }
});

const excludedAccounts: string[] = [
  'coderabbitai[bot]',
  'coderabbitai',
  'github-advanced-security[bot]',
  'dependabot[bot]',
  'pr-time-tracker'
];

const getContributorInfo = (user: User): Omit<ContributorSchema, 'role' | 'rate'> => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

const submissionCheckPrefix = 'Cost Submission';
const bugCheckPrefix = 'Bug Report Info';
const submissionCheckName = (login: string) => `${submissionCheckPrefix} (${login})`;
const bugCheckName = (login: string) => `${bugCheckPrefix} (${login})`;

const getPrInfo = async (
  pr: PullRequest | SimplePullRequest,
  repository: Repository,
  organization: Organization | undefined,
  sender: User,
  contributor: ContributorSchema
): Promise<ItemSchema> => {
  const item = await items.getOne({ id: pr.id });
  const contributorIds = item
    ? await items.makeContributorIds(item, contributor)
    : [contributor.id];
  let prMerged = false;

  if (item) {
    if (pr?.closed_at && (pr as PullRequest).merged) prMerged = true;
    return {
      ...item,
      repo: repository.name,
      org: organization?.login as string,
      title: pr.title,
      number: item.number || pr.number,
      contributor_ids: contributorIds,
      updated_at: pr?.updated_at,
      closed_at: item.closed_at ? item.closed_at : pr.closed_at || undefined,
      merged: item.merged ? true : prMerged,
      submission_ids: item.submission_ids || []
    };
  } else {
    return {
      type: ItemType.PULL_REQUEST,
      id: pr.id,
      title: pr.title,
      number: pr.number,
      org: organization?.login ?? 'holdex',
      repo: repository.name,
      owner: pr.user.login || sender.login,
      contributor_ids: contributorIds,
      url: pr.url,
      created_at: pr?.created_at,
      updated_at: pr?.updated_at,
      merged: false,
      closed_at: pr.closed_at ?? undefined,
      submission_ids: []
    };
  }
};

const getSubmissionStatus = async (
  ownerId: number,
  itemId: number
): Promise<null | { hours: number; approved: any }> => {
  const submission = await submissions.getOne({ owner_id: ownerId, item_id: itemId });

  if (submission) {
    return {
      hours: submission.hours,
      approved: submission.approval
    };
  }
  return null;
};

const getInstallationId = async (orgName: string) => {
  return githubApp.octokit.rest.apps.getOrgInstallation({
    org: orgName
  });
};

const createCheckRunIfNotExists = async (
  org: { name: string; installationId: number; repo: string },
  sender: { login: string; id: number },
  pull_request: PullRequest | SimplePullRequest,
  checkName: (s: string) => string,
  runType: string
) => {
  const octokit = await githubApp.getInstallationOctokit(org.installationId);

  const { data } = await octokit.rest.checks
    .listForRef({
      owner: org.name,
      repo: org.repo,
      ref: pull_request.head.sha,
      check_name: checkName(sender.login)
    })
    .catch(() => ({
      data: {
        total_count: 0,
        check_runs: []
      }
    }));

  if (data.total_count === 0) {
    return octokit.rest.checks
      .create({
        owner: org.name,
        repo: org.repo,
        head_sha: pull_request.head.sha,
        name: checkName(sender.login),
        details_url: `https://pr-time-tracker.vercel.app/prs/${org.name}/${org.repo}/${pull_request.id}`
      })
      .catch((err) => ({ error: err }));
  } else {
    return client.sendEvent({
      name: `${org.name}_custom_event`,
      payload: {
        type: runType,
        organization: org.name,
        repo: org.repo,
        prId: pull_request.id,
        senderLogin: sender.login,
        senderId: sender.id,
        prNumber: pull_request.number,
        checkRunId: data.check_runs[data.total_count - 1].id
      }
    });
  }
};

const reRequestCheckRun = async (
  org: { name: string; installationId: number },
  repoName: string,
  senderId: number,
  senderLogin: string,
  prNumber: number
) => {
  const octokit = await githubApp.getInstallationOctokit(org.installationId);

  const prInfo = await octokit.rest.pulls.get({
    owner: org.name,
    repo: repoName,
    pull_number: prNumber
  });

  const { data } = await octokit.rest.checks
    .listForRef({
      owner: org.name,
      repo: repoName,
      ref: prInfo.data.head.sha,
      check_name: submissionCheckName(senderLogin)
    })
    .catch(() => ({
      data: {
        total_count: 0,
        check_runs: []
      }
    }));

  if (data.total_count > 0) {
    return client.sendEvent({
      name: `${org.name}_custom_event`,
      payload: {
        type: 'submission',
        organization: org.name,
        repo: repoName,
        prId: prInfo.data.id,
        senderLogin: senderLogin,
        prNumber: prNumber,
        senderId: senderId,
        checkRunId: data.check_runs[data.total_count - 1].id
      }
    });
  }
  return Promise.resolve();
};

const checkRunFromEvent = async (
  org: string,
  repoName: string,
  senderId: number,
  senderLogin: string,
  prNumber: number
) => {
  const installation = await getInstallationId(org);
  return reRequestCheckRun(
    {
      name: org,
      installationId: installation.data.id
    },
    repoName,
    senderId,
    senderLogin,
    prNumber
  );
};

async function runPrFixCheckRun<
  T extends IOWithIntegrations<{ github: Autoinvoicing }>,
  E extends PullRequestEvent | PullRequestReviewEvent = PullRequestEvent | PullRequestReviewEvent
>(payload: E, io: T) {
  const { pull_request, repository, organization } = payload;

  const { title, user } = pull_request;
  if (/^fix:/.test(title)) {
    return io.logger.log('identified pull request');

    const orgDetails = await io.runTask(
      'get org installation',
      async () => {
        const { data } = await getInstallationId(organization?.login as string);
        return data;
      },
      { name: 'Get Organization installation' }
    );

    await io.runTask(
      `create-check-run-for-fix-pr`,
      async () => {
        const result = await createCheckRunIfNotExists(
          {
            name: organization?.login as string,
            installationId: orgDetails.id,
            repo: repository.name
          },
          user,
          pull_request,
          (b) => bugCheckName(b),
          'bug_report'
        );
        await io.logger.info(`check result`, { result });
        return Promise.resolve();
      },
      { name: `check run for fix PR` }
    );
  }
}

async function deleteComment(
  orgID: number,
  orgName: string,
  repositoryName: string,
  previousComment: any,
  io: any
): Promise<void> {
  try {
    await io.runTask('delete-comment', async () => {
      const octokit = await githubApp.getInstallationOctokit(orgID);
      if (previousComment?.databaseId) {
        await octokit.rest.issues.deleteComment({
          owner: orgName,
          repo: repositoryName,
          comment_id: previousComment.databaseId
        });
      }
    });
  } catch (error) {
    await io.logger.error('delete comment', { error });
  }
}

function submissionHeaderComment(header: string): string {
  return `<!-- Sticky Issue Comment${header} -->`;
}

function bodyWithHeader(body: string, header: string): string {
  return `${body}\n${submissionHeaderComment(header)}`;
}

const queryPreviousComment = async <T extends Octokit>(
  repo: { owner: string; repo: string },
  idNumber: number,
  category: string,
  h: string,
  octokit: T
) => {
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    /* eslint-disable no-await-in-loop */
    const data = await octokit.graphql<{ repository: RepoGQL; viewer: UserGQL }>(
      `
      query($repo: String! $owner: String! $number: Int! $after: String) {
        viewer { login }
        repository(name: $repo owner: $owner) { ` +
        category +
        `(number: $number) {
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
      { ...repo, after, number: idNumber }
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const viewer = data.viewer as UserGQL;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const repository = data.repository as RepoGQL;
    const categoryObj = category === 'issue' ? repository.issue : repository.pullRequest;
    const target = categoryObj?.comments?.nodes?.find(
      (node: IssueComment | null | undefined) =>
        node?.author?.login === viewer.login.replace('[bot]', '') &&
        !node?.isMinimized &&
        node?.body?.includes(h)
    );
    if (target) {
      return target;
    }
    after = categoryObj?.comments?.pageInfo?.endCursor;
    hasNextPage = categoryObj?.comments?.pageInfo?.hasNextPage ?? false;
  }

  return undefined;
};

async function getPreviousComment(
  orgID: number,
  orgName: string,
  repositoryName: string,
  header: string,
  issueNumber: number,
  category: string,
  io: any
): Promise<IssueComment | undefined> {
  const previousComment = await io.runTask('get-previous-comment', async () => {
    try {
      const octokit = await githubApp.getInstallationOctokit(orgID);
      const previous = await queryPreviousComment<typeof octokit>(
        { owner: orgName, repo: repositoryName },
        issueNumber,
        category,
        header,
        octokit
      );
      return previous;
    } catch (error) {
      await io.logger.error('get previous comment', { error });
      return undefined;
    }
  });

  return previousComment;
}

async function createComment(
  orgID: number,
  orgName: string,
  repositoryName: string,
  comment: string,
  issueNumber: number,
  io: any
): Promise<void> {
  try {
    const octokit = await githubApp.getInstallationOctokit(orgID);
    await octokit.rest.issues.createComment({
      owner: orgName,
      repo: repositoryName,
      body: comment,
      issue_number: issueNumber
    });
  } catch (error) {
    await io.logger.error('add issue comment', { error });
  }
}

export {
  githubApp,
  runPrFixCheckRun,
  excludedAccounts,
  reRequestCheckRun,
  getInstallationId,
  createCheckRunIfNotExists,
  getContributorInfo,
  checkRunFromEvent,
  getPrInfo,
  getSubmissionStatus,
  bugCheckName,
  submissionCheckName,
  bugCheckPrefix,
  submissionCheckPrefix,
  getPreviousComment,
  deleteComment,
  createComment,
  bodyWithHeader,
  submissionHeaderComment
};
