import { Autoinvoicing, events } from '@holdex/autoinvoicing';

import type { ContributorSchema, ItemSchema } from '$lib/@types';
import type { PullRequest, User, SimplePullRequest, Repository, Organization } from './';

import config from '$lib/server/config';
import { ItemType } from '$lib/constants';
import { items, submissions } from '$lib/server/mongo/collections';

import app from './';
import { client } from '../trigger-dev';

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
  const contributorIds = item ? await items.makeContributorIds(item, contributor) : [];
  let prMerged = false;

  if (item) {
    if (pr?.closed_at && (pr as PullRequest).merged) prMerged = true;
    return {
      ...item,
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
  return app.octokit.rest.apps.getOrgInstallation({
    org: orgName
  });
};

const createCheckRun = async (
  org: { name: string; installationId: number },
  repoName: string,
  senderLogin: string,
  headSha: string
) => {
  const octokit = await app.getInstallationOctokit(org.installationId);

  await octokit.rest.checks.create({
    owner: org.name,
    repo: repoName,
    head_sha: headSha,
    name: submissionCheckName(senderLogin)
  });
};

const createCheckRunIfNotExists = async (
  org: { name: string; installationId: number },
  repoName: string,
  senderLogin: string,
  headSha: string
) => {
  const octokit = await app.getInstallationOctokit(org.installationId);

  const { data } = await octokit.rest.checks
    .listForRef({
      owner: org.name,
      repo: repoName,
      ref: headSha,
      check_name: submissionCheckName(senderLogin)
    })
    .catch(() => ({
      data: {
        total_count: 0
      }
    }));

  if (data.total_count === 0) {
    await octokit.rest.checks.create({
      owner: org.name,
      repo: repoName,
      head_sha: headSha,
      name: submissionCheckName(senderLogin)
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
  const octokit = await app.getInstallationOctokit(org.installationId);

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
      name: `${org.name}_pr_submission.created`,
      payload: {
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
};

const github = new Autoinvoicing({
  id: 'github',
  token: config.github.token
});

export {
  getContributorInfo,
  getPrInfo,
  github,
  events,
  reRequestCheckRun,
  getSubmissionStatus,
  submissionCheckPrefix,
  submissionCheckName,
  createCheckRun,
  createCheckRunIfNotExists,
  getInstallationId
};
