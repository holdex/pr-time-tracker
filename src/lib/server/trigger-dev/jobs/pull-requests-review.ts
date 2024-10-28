import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { PullRequestReviewEvent } from '@octokit/webhooks-types';

import { contributors, items } from '$lib/server/mongo/collections';
import { insertEvent } from '$lib/server/gcloud';

import {
  createCheckRunIfNotExists,
  excludedAccounts,
  getContributorInfo,
  getInstallationId,
  getPrInfo,
  runPrFixCheckRun,
  submissionCheckName
} from '../utils';

import { EventType, type ItemSchema } from '$lib/@types';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: PullRequestReviewEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, pull_request, repository, organization, review } = payload;

  switch (action) {
    case 'submitted': {
      await io.wait('wait for first call', 5);

      // store these events in gcloud
      if (
        review.state === 'approved' ||
        review.state === 'changes_requested' ||
        review.state === 'commented'
      ) {
        await insertPrEvent(payload, io);

        const prInfo = await updatePrInfo(payload, io, (s) => s);

        const orgDetails = await io.runTask(
          'get org installation',
          async () => {
            const { data } = await getInstallationId(organization?.login as string);
            return data;
          },
          { name: 'Get Organization installation' }
        );

        const contributorList = await io.runTask<any>(
          'get contributors list',
          async () => {
            const data = await contributors.getManyBy({
              id: { $in: prInfo.contributor_ids }
            });
            return data;
          },
          { name: 'Get contributors list' }
        );

        const taskChecks = [];
        for (const c of contributorList) {
          if (excludedAccounts.includes(c.login)) continue;
          taskChecks.push(
            io.runTask(
              `create-check-run-for-contributor_${c.login}`,
              async () => {
                const result = await createCheckRunIfNotExists(
                  {
                    name: organization?.login as string,
                    installationId: orgDetails.id,
                    repo: repository.name
                  },
                  c,
                  pull_request,
                  (_c) => submissionCheckName(_c),
                  'submission'
                );
                await io.logger.info(`check result`, { result });
                return Promise.resolve();
              },
              { name: `check run for ${c.login}` }
            )
          );
        }
        await Promise.allSettled(taskChecks);
      }
      return runPrFixCheckRun(payload, io);
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}

async function insertPrEvent<
  T extends IOWithIntegrations<{ github: Autoinvoicing }>,
  E extends PullRequestReviewEvent = PullRequestReviewEvent
>(payload: E, io: T) {
  const { pull_request, repository, organization, review } = payload;

  const event = {
    action:
      review.state === 'approved'
        ? EventType.PR_REVIEW_APPROVE
        : review.state === 'changes_requested'
        ? EventType.PR_REVIEW_REJECT
        : EventType.PR_REVIEW_COMMENT,
    id: pull_request.number,
    index: 1,
    organization: organization?.login || 'holdex',
    owner: pull_request.user.login,
    repository: repository.name,
    sender: review.user.login,
    title: pull_request.title,
    created_at: Math.round(new Date(pull_request.created_at).getTime() / 1000).toFixed(0),
    updated_at: Math.round(new Date(pull_request.updated_at).getTime() / 1000).toFixed(0)
  };

  const eventId = `${event.organization}/${event.repository}@${event.id}_${event.created_at}_${event.sender}_${event.action}`;
  await io.runTask(
    `insert event: ${eventId}`,
    async () => {
      const data = await insertEvent(event, eventId);
      return data;
    },
    { name: 'Insert Bigquery event' },
    (err: any, _, _io) => {
      _io.logger.error(err);
    }
  );

  const prOwnerEvent = Object.assign({}, event, {
    sender: event.owner,
    action:
      review.state === 'approved'
        ? EventType.PR_APPROVED
        : review.state === 'changes_requested'
        ? EventType.PR_REJECTED
        : EventType.PR_COMMENTED
  });

  const prOwnerEventId = `${prOwnerEvent.organization}/${prOwnerEvent.repository}@${prOwnerEvent.id}_${prOwnerEvent.created_at}_${prOwnerEvent.sender}_${prOwnerEvent.action}`;
  await io.runTask(
    `insert owner event: ${prOwnerEventId}`,
    async () => {
      const data = await insertEvent(prOwnerEvent, prOwnerEventId);
      return data;
    },
    { name: 'Insert Bigquery owner event' },
    (err: any, _, _io) => {
      _io.logger.error(err);
    }
  );
}

async function updatePrInfo<
  T extends IOWithIntegrations<{ github: Autoinvoicing }>,
  E extends PullRequestReviewEvent = PullRequestReviewEvent
>(payload: E, io: T, prepareInfo: (s: ItemSchema) => ItemSchema) {
  const { pull_request, repository, organization, sender } = payload;
  const contributorInfo = getContributorInfo(sender);

  const contributor = await io.runTask<any>(
    `update contributor: ${contributorInfo.id}`,
    async () => {
      const data = await contributors.update(contributorInfo);
      return data;
    },
    { name: 'Update Contributor schema' },
    (err: any, _, _io) => {
      _io.logger.error(err);
    }
  );

  const prInfo = await io.runTask<any>(
    `get pr info: ${pull_request.node_id}`,
    async () => {
      const data = await getPrInfo(pull_request, repository, organization, sender, contributor);
      return data;
    },
    { name: 'Get Item schema' },
    (err: any, _, _io) => {
      _io.logger.error(err);
    }
  );

  return io.runTask<any>(
    `update pr info: ${pull_request.node_id}`,
    async () => {
      const data = await items.update(prepareInfo(prInfo), { onCreateIfNotExist: true });
      return data;
    },
    { name: 'Update Item schema' },
    (err: any, _, _io) => {
      _io.logger.error(err);
    }
  );
}
