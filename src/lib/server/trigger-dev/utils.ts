import { App, Octokit } from 'octokit';

import type {
  User,
  PullRequest,
  SimplePullRequest,
  Organization,
  Repository,
  Issue
} from '@octokit/webhooks-types';
import type {
  User as UserGQL,
  Repository as RepoGQL,
  IssueComment,
  UpdateCheckRunInput,
  UpdateCheckRunPayload
} from '@octokit/graphql-schema';
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
  'pr-time-tracker',
  'pr-time-tracker[bot]'
];

const getContributorInfo = (user: User): Omit<ContributorSchema, 'role' | 'rate'> => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

const submissionCheckPrefix = 'Cost Submission';
const submissionCheckName = (login: string) => `${submissionCheckPrefix} (${login})`;

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

const deleteCheckRun = async (
  org: { name: string; installationId: number; repo: string },
  sender: { login: string; id: number },
  pull_request: PullRequest | SimplePullRequest,
  checkName: (s: string) => string,
  io: any
) => {
  return await io.runTask('delete-check-run', async () => {
    const checkRunId = await io.runTask('get-check-run-id', async () => {
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
        return null;
      }
      return data.check_runs[data.total_count - 1].id;
    });

    if (checkRunId) {
      const repoDetails = await io.runTask(
        'get-repo-id',
        async () => {
          const octokit = await githubApp.getInstallationOctokit(org.installationId);

          return octokit.rest.repos.get({ owner: org.name, repo: org.repo });
        },
        { name: 'Get Repo Details' }
      );

      const checkDetails = await io.runTask(
        'get-check-id',
        async () => {
          const octokit = await githubApp.getInstallationOctokit(org.installationId);
          return octokit.rest.checks.get({
            owner: org.name,
            repo: org.repo,
            check_run_id: checkRunId
          });
        },
        { name: 'Get Check Details' }
      );

      await io.runTask(
        'update-check-run-to-completed',
        async () => {
          const octokit = await githubApp.getInstallationOctokit(org.installationId);

          return updateCheckRun(octokit, {
            repositoryId: repoDetails.data.node_id,
            checkRunId: checkDetails.data.node_id,
            status: 'COMPLETED',
            conclusion: 'NEUTRAL',
            completedAt: new Date().toISOString(),
            detailsUrl: `https://pr-time-tracker.vercel.app/prs/${org.name}/${repoDetails.data.name}/${pull_request.id}`,
            output: {
              title: '⚪ bug info check cancelled',
              summary: 'Pull request title no longer includes `fix:`. No further actions required'
            }
          }).then((r) => r.updateCheckRun);
        },
        { name: 'Update check run' }
      );
    }
  });
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

async function deleteComment(
  orgID: number,
  orgName: string,
  repositoryName: string,
  previousComment: any,
  io: any
): Promise<boolean> {
  try {
    return await io.runTask('delete-comment', async () => {
      const octokit = await githubApp.getInstallationOctokit(orgID);
      if (previousComment?.databaseId) {
        await octokit.rest.issues.deleteComment({
          owner: orgName,
          repo: repositoryName,
          comment_id: previousComment.databaseId
        });
        return true;
      }
      return false;
    });
  } catch (error) {
    await io.logger.error('delete comment', { error });
    return (error as { location: string })?.location === 'after_complete_task';
  }
}

type SubmissionHeaderType = 'Issue' | 'Pull Request' | 'Bug Report';
function submissionHeaderComment(type: SubmissionHeaderType, header: string): string {
  return `<!-- Sticky ${type} Comment${header} -->`;
}
function bodyWithHeader(type: SubmissionHeaderType, body: string, header: string): string {
  return `${body}\n${submissionHeaderComment(type, header)}`;
}

type PreviousCommentCategory = 'pullRequest' | 'issue';
type PreviousCommentSenderFilter = 'bot' | 'others';
const queryPreviousComment = async <T extends Octokit>(
  repo: { owner: string; repo: string },
  idNumber: number,
  category: PreviousCommentCategory,
  h: string | RegExp,
  senderFilter: PreviousCommentSenderFilter,
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
    const target = categoryObj?.comments?.nodes?.find((node: IssueComment | null | undefined) => {
      const isSentByBot = node?.author?.login === viewer.login.replace('[bot]', '');
      return (
        ((senderFilter === 'bot' && isSentByBot) || (senderFilter === 'others' && !isSentByBot)) &&
        !node?.isMinimized &&
        (typeof h === 'string' ? node?.body?.includes(h) : h.test(node?.body ?? ''))
      );
    });
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
  header: string | RegExp,
  issueNumber: number,
  category: PreviousCommentCategory,
  senderFilter: PreviousCommentSenderFilter,
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
        senderFilter,
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

async function getPullRequestByIssue(
  issue: Issue,
  orgID: number,
  orgName: string,
  repositoryName: string,
  io: any
): Promise<PullRequest | undefined> {
  const previousComment = await io.runTask('get-pull-request-by-issue', async () => {
    try {
      const octokit = await githubApp.getInstallationOctokit(orgID);
      const data = await octokit.rest.pulls.get({
        owner: orgName,
        repo: repositoryName,
        pull_number: issue.number
      });
      return data.data;
    } catch (error) {
      await io.logger.error('get pull request id by issue id', { error });
      return undefined;
    }
  });

  return previousComment;
}

async function reinsertComment<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  orgID: number,
  orgName: string,
  repositoryName: string,
  header: string,
  prOrIssueNumber: number,
  io: T
) {
  const { comment, isDeleted } = await io.runTask('delete-previous-comment', async () => {
    const previousComment = await getPreviousComment(
      orgID,
      orgName,
      repositoryName,
      header,
      prOrIssueNumber,
      'pullRequest',
      'bot',
      io
    );

    let hasBeenDeleted = false;
    if (previousComment) {
      hasBeenDeleted = await deleteComment(orgID, orgName, repositoryName, previousComment, io);
    }

    return { comment: previousComment, isDeleted: hasBeenDeleted };
  });

  if (isDeleted && comment) {
    await io.runTask('reinsert-comment', async () => {
      await createComment(orgID, orgName, repositoryName, comment.body, prOrIssueNumber, io);
    });
  }
}

export {
  githubApp,
  excludedAccounts,
  reRequestCheckRun,
  getInstallationId,
  createCheckRunIfNotExists,
  getContributorInfo,
  checkRunFromEvent,
  updateCheckRun,
  deleteCheckRun,
  getPrInfo,
  getSubmissionStatus,
  submissionCheckName,
  submissionCheckPrefix,
  getPreviousComment,
  deleteComment,
  createComment,
  bodyWithHeader,
  submissionHeaderComment,
  getPullRequestByIssue,
  reinsertComment
};
