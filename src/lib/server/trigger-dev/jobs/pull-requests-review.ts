import { logger, wait } from '@trigger.dev/sdk/v3';

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
  reinsertComment,
  submissionCheckName,
  submissionHeaderComment
} from '../utils';
import { runPrFixCheckRun } from '../fix-pr';

import { EventType, type ItemSchema } from '$lib/@types';

export async function createJob(payload: PullRequestReviewEvent) {
  const { action, pull_request, repository, organization, review } = payload;
  const orgName = organization?.login || 'holdex';

  switch (action) {
    case 'submitted': {
      logger.info('wait for first call');
      await wait.for({ seconds: 5 });

      // store these events in gcloud
      if (
        review.state === 'approved' ||
        review.state === 'changes_requested' ||
        review.state === 'commented'
      ) {
        const orgDetails = await logger.trace('get org installation', async () => {
          const { data } = await getInstallationId(organization?.login as string);
          return data;
        });

        await insertPrEvent(payload);
        const prInfo = await updatePrInfo(payload, (s) => s);

        await logger.trace('reinsert-sticky-comment', async () => {
          return reinsertComment(
            orgDetails.id,
            orgName,
            repository.name,
            submissionHeaderComment('Pull Request', pull_request.id.toString()),
            pull_request.number
          );
        });

        const contributorList = await logger.trace('get contributors list', async () => {
          const data = await contributors.getManyBy({
            id: { $in: prInfo.contributor_ids }
          });
          return data;
        });

        const taskChecks = [];
        for (const c of contributorList) {
          if (excludedAccounts.includes(c.login)) continue;
          taskChecks.push(
            logger.trace(`create-check-run-for-contributor_${c.login}`, async () => {
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
              logger.info(`check result`, { result });
              return Promise.resolve();
            })
          );
        }
        await Promise.allSettled(taskChecks);
      }
      return runPrFixCheckRun(payload);
    }
    default: {
      logger.info('current action for pull request is not in the parse candidate', payload as any);
    }
  }
}

async function insertPrEvent<E extends PullRequestReviewEvent = PullRequestReviewEvent>(
  payload: E
) {
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
  await logger.trace(`insert event: ${eventId}`, async () => {
    const data = await insertEvent(event, eventId);
    return data;
  });

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
  await logger.trace(`insert owner event: ${prOwnerEventId}`, async () => {
    const data = await insertEvent(prOwnerEvent, prOwnerEventId);
    return data;
  });
}

async function updatePrInfo<E extends PullRequestReviewEvent = PullRequestReviewEvent>(
  payload: E,
  prepareInfo: (s: ItemSchema) => ItemSchema
) {
  const { pull_request, repository, organization, sender } = payload;
  const contributorInfo = getContributorInfo(sender);

  const contributor = await logger.trace(`update contributor: ${contributorInfo.id}`, async () => {
    const data = await contributors.update(contributorInfo);
    return data;
  });

  const prInfo = await logger.trace(`get pr info: ${pull_request.node_id}`, async () => {
    const data = await getPrInfo(pull_request, repository, organization, sender, contributor);
    return data;
  });

  return logger.trace(`update pr info: ${pull_request.node_id}`, async () => {
    const data = await items.update(prepareInfo(prInfo), { onCreateIfNotExist: true });
    return data;
  });
}
