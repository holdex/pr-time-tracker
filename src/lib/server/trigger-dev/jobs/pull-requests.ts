import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { PullRequestEvent } from '@octokit/webhooks-types';

import { insertEvent } from '$lib/server/gcloud';
import { contributors, items } from '$lib/server/mongo/collections';

import {
  bugCheckName,
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
  payload: PullRequestEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, pull_request, repository, organization, sender } = payload;

  switch (action) {
    case 'opened':
    case 'edited':
    case 'synchronize':
    case 'closed': {
      if (action === 'opened' || action === 'closed') {
        await insertPrEvent(payload, io);
      }

      const prInfo = await updatePrInfo(payload, io, (s) => s);

      if (
        action === 'synchronize' &&
        (pull_request.requested_reviewers.length > 0 || pull_request.requested_teams.length > 0)
      ) {
        const orgDetails = await io.runTask(
          'get org installation',
          async () => {
            const { data } = await getInstallationId(organization?.login as string);
            return data;
          },
          { name: 'Get Organization installation' },
          (err: any, _, _io) => {
            _io.logger.error(err);
          }
        );

        const contributorList = await io.runTask<any>(
          'get contributors list',
          async () => {
            const data = await contributors.getManyBy({
              id: { $in: prInfo.contributor_ids }
            });
            return data;
          },
          { name: 'Get contributors list' },
          (err: any, _, _io) => {
            _io.logger.error(err);
          }
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
              { name: `check run for ${c.login}` },
              (err: any, _, _io) => {
                _io.logger.error(err);
              }
            )
          );
        }
        await Promise.allSettled(taskChecks);
      }

      await runPrFixCheckRun(payload, io);
      break;
    }
    case 'reopened': {
      await updatePrInfo(payload, io, (s) => ({ ...s, closed_at: '' }));
      break;
    }
    case 'review_requested': {
      const orgDetails = await io.runTask(
        'get org installation',
        async () => {
          const { data } = await getInstallationId(organization?.login as string);
          return data;
        },
        { name: 'Get Organization installation' },
        (err: any, _, _io) => {
          _io.logger.error(err);
        }
      );

      const contributorList = await io.runTask<any>(
        'map contributors',
        async () => {
          const contributor = await contributors.update(getContributorInfo(pull_request.user));
          const prInfo = await getPrInfo(
            pull_request,
            repository,
            organization,
            sender,
            contributor
          );
          return contributors.getManyBy({ id: { $in: prInfo.contributor_ids || [] } });
        },
        { name: 'Map contributors list' },
        (err: any, _, _io) => {
          _io.logger.error(err);
        }
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
                (s) => submissionCheckName(s),
                'submission'
              );
              await io.logger.info(`check result`, { result });
              return Promise.resolve();
            },
            { name: `check run for ${c.login}` },
            (err: any, _, _io) => {
              _io.logger.error(err);
            }
          )
        );
      }
      await Promise.allSettled(taskChecks);
      return runPrFixCheckRun(payload, io);
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}

async function insertPrEvent<
  T extends IOWithIntegrations<{ github: Autoinvoicing }>,
  E extends PullRequestEvent = PullRequestEvent
>(payload: E, io: T) {
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
}

async function updatePrInfo<
  T extends IOWithIntegrations<{ github: Autoinvoicing }>,
  E extends PullRequestEvent = PullRequestEvent
>(payload: E, io: T, prepareInfo: (s: ItemSchema) => ItemSchema) {
  const { action, pull_request, repository, organization, sender } = payload;
  let contributorInfo = getContributorInfo(sender);

  if (action === 'opened' || action === 'closed') {
    contributorInfo = getContributorInfo(pull_request.user);
  }

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

  await io.wait('wait for first call', 5);

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
