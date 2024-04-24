import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import type { PullRequestEvent } from '$lib/server/github';
import { insertEvent } from '$lib/server/gcloud';
import { contributors, items } from '$lib/server/mongo/collections';

import {
  createCheckRunIfNotExists,
  getContributorInfo,
  getInstallationId,
  getPrInfo
} from '../../github/util';

import { EventType } from '$lib/@types';

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
      const { user, merged } = pull_request;
      let contributorInfo;

      if (action === 'opened' || action === 'closed') {
        contributorInfo = getContributorInfo(user);

        const event = {
          action:
            action === 'opened'
              ? EventType.PR_OPENED
              : merged
              ? EventType.PR_MERGED
              : EventType.PR_CLOSED,
          id: pull_request.number,
          index: 1,
          organization: organization?.login || 'holdex',
          owner: user.login,
          repository: repository.name,
          sender: user.login,
          title: pull_request.title,
          created_at: Math.round(new Date(pull_request.created_at).getTime() / 1000).toFixed(0),
          updated_at: Math.round(new Date(pull_request.updated_at).getTime() / 1000).toFixed(0)
        };

        // store these events in gcloud
        await insertEvent(
          event,
          `${event.organization}/${event.repository}@${event.id}_${event.action}`
        );
      } else {
        contributorInfo = getContributorInfo(sender);
      }

      const contributor = await contributors.update(contributorInfo);
      await io.wait('wait for first call', 5);
      const prInfo = await getPrInfo(pull_request, repository, organization, sender, contributor);
      await items.update(prInfo, { onCreateIfNotExist: true });

      if (action === 'synchronize' && pull_request.requested_reviewers.length > 0) {
        const orgDetails = await io.github.runTask(
          'get org installation',
          async () => {
            const { data } = await getInstallationId(organization?.login as string);
            return data;
          },
          { name: 'Get Organization installation' }
        );

        const contributorList = await contributors.getManyBy({
          id: { $in: prInfo.contributor_ids }
        });

        const taskChecks = [];
        for (const c of contributorList) {
          taskChecks.push(
            io.github.runTask(
              `create-check-run-for-contributor_${c.login}`,
              async () => {
                const result = await createCheckRunIfNotExists(
                  { name: organization?.login as string, installationId: orgDetails.id },
                  repository.name,
                  c.login,
                  c.id,
                  pull_request
                );
                await io.logger.info(`check result`, { result });
                return Promise.resolve();
              },
              { name: `check run for ${c.login}` }
            )
          );
        }
        return Promise.allSettled(taskChecks);
      }
      break;
    }
    case 'review_requested': {
      const orgDetails = await io.github.runTask(
        'get org installation',
        async () => {
          const { data } = await getInstallationId(organization?.login as string);
          return data;
        },
        { name: 'Get Organization installation' }
      );

      const contributorList = await io.github.runTask(
        'map contributors',
        async () => {
          const contributor = await contributors.update(getContributorInfo(sender));
          const prInfo = await getPrInfo(
            pull_request,
            repository,
            organization,
            sender,
            contributor
          );
          return contributors.getManyBy({ id: { $in: prInfo.contributor_ids || [] } });
        },
        { name: 'Map contributors list' }
      );

      const taskChecks = [];
      for (const c of contributorList) {
        taskChecks.push(
          io.github.runTask(
            `create-check-run-for-contributor_${c.login}`,
            async () => {
              const result = await createCheckRunIfNotExists(
                { name: organization?.login as string, installationId: orgDetails.id },
                repository.name,
                c.login,
                c.id,
                pull_request
              );
              await io.logger.info(`check result`, { result });
              return Promise.resolve();
            },
            { name: `check run for ${c.login}` }
          )
        );
      }
      return Promise.allSettled(taskChecks);
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}
