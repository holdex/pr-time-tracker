import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import type { CheckRunEvent } from '$lib/server/github';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: CheckRunEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, repository, organization, sender, check_run } = payload;

  switch (action) {
    default: {
      io.logger.log('current action for check run is not in the parse candidate', payload);
    }
  }
}
