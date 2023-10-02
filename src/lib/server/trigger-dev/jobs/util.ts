import { Github, events } from '@trigger.dev/github';

import type { Document, ModifyResult } from 'mongodb';
import type { CollectionNames, ContributorSchema, ItemSchema } from '$lib/@types';

import clientPromise from '$lib/server/mongo';
import config from '$lib/server/config';
import type {
  PullRequest,
  User,
  SimplePullRequest,
  Repository,
  Organization
} from '$lib/server/github';
import { ItemType } from '$lib/constants';
import { items } from '$lib/server/mongo/collections';

const getContributorInfo = (user: User): Omit<ContributorSchema, 'role'> => ({
  id: user.id,
  name: user.login,
  login: user.login,
  url: user.html_url,
  avatarUrl: user.avatar_url
});

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

const github = new Github({
  id: 'github',
  token: config.github.token
});

export { getContributorInfo, getPrInfo, github, events };
