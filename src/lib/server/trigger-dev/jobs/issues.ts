import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type {
  IssuesLabeledEvent,
  IssuesUnlabeledEvent,
  PullRequestReviewEvent
} from '@octokit/webhooks-types';

import { contributors, items } from '$lib/server/mongo/collections';
import { insertEvent } from '$lib/server/gcloud';

import {
  createCheckRunIfNotExists,
  excludedAccounts,
  getContributorInfo,
  getInstallationId,
  getPrInfo
} from '../utils';

import { EventType } from '$lib/@types';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: IssuesLabeledEvent | IssuesUnlabeledEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, issue, repository, organization, sender, label } = payload;

  switch (action) {
    default: {
      io.logger.log('current action for issue is not in the parse candidate', payload);
    }
  }
}
