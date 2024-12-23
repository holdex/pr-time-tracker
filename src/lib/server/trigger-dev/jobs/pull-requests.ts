import { logger, wait } from '@trigger.dev/sdk/v3';

import type { PullRequestEvent } from '@octokit/webhooks-types';

import { insertEvent } from '$lib/server/gcloud';
import { contributors, items } from '$lib/server/mongo/collections';

import {
  createCheckRunIfNotExists,
  excludedAccounts,
  getContributorInfo,
  getInstallationId,
  getPrInfo,
  submissionCheckName
} from '../utils';
import { runPrFixCheckRun } from '../fix-pr';

import { EventType, type ItemSchema } from '$lib/@types';

export async function createJob(payload: PullRequestEvent) {
  const { action, pull_request, repository, organization, sender } = payload;

  switch (action) {
    case 'opened':
    case 'edited':
    case 'synchronize':
    case 'closed': {
      if (action === 'opened' || action === 'closed') {
        await insertPrEvent(payload);
      }

      const prInfo = await updatePrInfo(payload, (s) => s);

      if (
        action === 'synchronize' &&
        (pull_request.requested_reviewers.length > 0 || pull_request.requested_teams.length > 0)
      ) {
        const orgDetails = await logger.trace('get org installation', async () => {
          const { data } = await getInstallationId(organization?.login as string);
          return data;
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

      await runPrFixCheckRun(payload);
      break;
    }
    case 'ready_for_review': {
      await runPrFixCheckRun(payload);
      break;
    }
    case 'reopened': {
      await updatePrInfo(payload, (s) => ({ ...s, closed_at: '' }));
      break;
    }
    case 'review_requested': {
      const orgDetails = await logger.trace('get org installation', async () => {
        const { data } = await getInstallationId(organization?.login as string);
        return data;
      });

      const contributorList = await logger.trace('map contributors', async () => {
        const contributor = await contributors.update(getContributorInfo(pull_request.user));
        const prInfo = await getPrInfo(pull_request, repository, organization, sender, contributor);
        return contributors.getManyBy({ id: { $in: prInfo.contributor_ids || [] } });
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
              (s) => submissionCheckName(s),
              'submission'
            );
            logger.info(`check result`, { result });
            return Promise.resolve();
          })
        );
      }
      await Promise.allSettled(taskChecks);
      return runPrFixCheckRun(payload);
    }
    default: {
      logger.log('current action for pull request is not in the parse candidate', payload as any);
    }
  }
}

async function insertPrEvent<E extends PullRequestEvent = PullRequestEvent>(payload: E) {
  const { action, pull_request, repository, organization } = payload;

  const event = {
    action:
      action === 'opened'
        ? EventType.PR_OPENED
        : pull_request.merged
        ? EventType.PR_MERGED
        : EventType.PR_CLOSED,
    id: pull_request.number,
    index: 1,
    organization: organization?.login || 'holdex',
    owner: pull_request.user.login,
    repository: repository.name,
    sender: pull_request.user.login,
    title: pull_request.title,
    created_at: Math.round(new Date(pull_request.created_at).getTime() / 1000).toFixed(0),
    updated_at: Math.round(new Date(pull_request.updated_at).getTime() / 1000).toFixed(0)
  };

  const eventId = `${event.organization}/${event.repository}@${event.id}_${event.action}`;
  await logger.trace(`insert event: ${eventId}`, async () => {
    const data = await insertEvent(event, eventId);
    return data;
  });
}

async function updatePrInfo<E extends PullRequestEvent = PullRequestEvent>(
  payload: E,
  prepareInfo: (s: ItemSchema) => ItemSchema
) {
  const { action, pull_request, repository, organization, sender } = payload;
  let contributorInfo = getContributorInfo(sender);

  if (action === 'opened' || action === 'closed') {
    contributorInfo = getContributorInfo(pull_request.user);
  }

  const contributor = await logger.trace(`update contributor: ${contributorInfo.id}`, async () => {
    const data = await contributors.update(contributorInfo);
    return data;
  });

  logger.info('wait for first call');
  await wait.for({ seconds: 5 });

  const prInfo = await logger.trace(`get pr info: ${pull_request.node_id}`, async () => {
    const data = await getPrInfo(pull_request, repository, organization, sender, contributor);
    return data;
  });

  return logger.trace(`update pr info: ${pull_request.node_id}`, async () => {
    const data = await items.update(prepareInfo(prInfo), { onCreateIfNotExist: true });
    return data;
  });
}
