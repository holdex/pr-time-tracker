import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import type { PullRequestEvent } from '$lib/server/github';
import { insertEvent } from '$lib/server/gcloud';
import { contributors, items } from '$lib/server/mongo/collections';

import {
  createCheckRun,
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

        // store these events in gcloud
        await insertEvent({
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
        });
        await io.wait('wait for call', 5);
      } else {
        contributorInfo = getContributorInfo(sender);
      }
      const contributor = await contributors.update(contributorInfo);

      await io.wait('wait for first call', 5);

      const prInfo = await getPrInfo(pull_request, repository, organization, sender, contributor);
      await items.update(prInfo, { onCreateIfNotExist: true });

      if (action === 'synchronize' && pull_request.requested_reviewers.length > 0) {
        await io.wait('wait for second call', 5);

        const orgDetails = await io.github.runTask(
          'get org installation',
          async () => {
            const { data } = await getInstallationId(organization?.login as string);
            return data;
          },
          { name: 'Get Organization installation' }
        );

        await io.github.runTask(
          'create-check-runs',
          async () => {
            const list = await contributors.getManyBy({ id: { $in: prInfo.contributor_ids } });

            for (const item of list) {
              /* eslint-disable no-await-in-loop */
              await createCheckRun(
                { name: organization?.login as string, installationId: orgDetails.id },
                repository.name,
                item.login,
                pull_request.head.sha
              );
            }
          },
          { name: 'Create check runs' }
        );
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

      await io.github.runTask(
        'create-check-runs',
        async () => {
          const contributor = await contributors.update(getContributorInfo(sender));
          const prInfo = await getPrInfo(
            pull_request,
            repository,
            organization,
            sender,
            contributor
          );
          const list = await contributors.getManyBy({ id: { $in: prInfo.contributor_ids || [] } });
          for (const item of list) {
            /* eslint-disable no-await-in-loop */
            await createCheckRun(
              { name: organization?.login as string, installationId: orgDetails.id },
              repository.name,
              item.login,
              pull_request.head.sha
            );
          }
        },
        { name: 'Create check runs' }
      );
      break;
    }
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}
