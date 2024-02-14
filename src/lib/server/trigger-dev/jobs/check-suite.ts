import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import type { CheckSuiteEvent } from '$lib/server/github';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: CheckSuiteEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, repository, organization, sender, check_suite } = payload;

  switch (action) {
    default: {
      io.logger.log('current action for check suite is not in the parse candidate', payload);
    }
  }
}
