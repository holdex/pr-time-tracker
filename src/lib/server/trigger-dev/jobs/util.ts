import { Autoinvoicing, events } from '@holdex/autoinvoicing';

import type { ContributorSchema, ItemSchema } from '$lib/@types';

import config from '$lib/server/config';
import type {
  PullRequest,
  User,
  SimplePullRequest,
  Repository,
  Organization
} from '$lib/server/github';
import { ItemType } from '$lib/constants';
import { items, submissions } from '$lib/server/mongo/collections';
import app from '$lib/server/github';

const getContributorInfo = (user: User): Omit<ContributorSchema, 'role' | 'rate'> => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

const submissionCheckName = 'Cost Submission';

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

  if (pr.closed_at && (pr as PullRequest).merged) prMerged = true;

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
    merged: prMerged,
    closed_at: pr.closed_at ?? undefined,
    submission_ids: item?.submission_ids || []
  };
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

const createCheckRun = async (
  org: { name: string; installationId: number },
  repoName: string,
  headSha: string
) => {
  const octokit = await app.getInstallationOctokit(org.installationId);

  await octokit.rest.checks.create({
    owner: org.name,
    repo: repoName,
    head_sha: headSha,
    name: submissionCheckName
  });
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
  getSubmissionStatus,
  submissionCheckName,
  createCheckRun
};
