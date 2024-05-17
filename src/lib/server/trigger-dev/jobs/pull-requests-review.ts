import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { PullRequestReviewEvent } from '@octokit/webhooks-types';

import { contributors, items } from '$lib/server/mongo/collections';
import { insertEvent } from '$lib/server/gcloud';

import {
  createCheckRunIfNotExists,
  getContributorInfo,
  getInstallationId,
  getPrInfo
} from '../utils';

import { EventType } from '$lib/@types';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: PullRequestReviewEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, pull_request, repository, organization, sender, review } = payload;

  switch (action) {
    case 'submitted': {
      const contributor = await contributors.update(getContributorInfo(sender));
      await io.wait('wait for first call', 5);

      // store these events in gcloud
      if (
        review.state === 'approved' ||
        review.state === 'changes_requested' ||
        review.state === 'commented'
      ) {
        const event = {
          action:
            review.state === 'approved'
              ? EventType.PR_APPROVED
              : review.state === 'changes_requested'
              ? EventType.PR_REJECTED
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

        await insertEvent(
          event,
          `${event.organization}/${event.repository}@${event.id}_${event.created_at}_${event.sender}_${event.action}`
        );

        const prInfo = await items.update(
          await getPrInfo(pull_request, repository, organization, sender, contributor),
          { onCreateIfNotExist: true }
        );

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
    default: {
      io.logger.log('current action for pull request is not in the parse candidate', payload);
    }
  }
}
