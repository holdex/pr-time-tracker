// import all your job files here
import { type IOWithIntegrations, eventTrigger } from '@trigger.dev/sdk';
import zod from 'zod';

import { isDev } from '$lib/config';
import config from '$lib/server/config';

import { client, github, events, type Autoinvoicing } from '../client';
import { createJob as createPrJob } from './pull-requests';
import { createJob as createPrReviewJob } from './pull-requests-review';
import { createJob as createCheckRunJob, createEventJob as createCheckEventJob } from './check-run';

config.integrationsList.forEach((org) => {
  const checkRunLimit = client.defineConcurrencyLimit({
    id: `${org.id}_checkRun_${isDev ? '_dev' : ''}-shared`,
    limit: 1 // Limit all jobs in this group to 1 concurrent executions
  });

  const customEventLimit = client.defineConcurrencyLimit({
    id: `${org.id}_customEvent_${isDev ? '_dev' : ''}-shared`,
    limit: 1 // Limit all jobs in this group to 1 concurrent executions
  });

  client.defineJob({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming pull requests for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onPullRequest,
      org: org.name
    }),
    integrations: { github },
    run: async (payload, io, ctx) =>
      createPrJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  client.defineJob({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-review-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming pull requests review for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onPullRequestReview,
      org: org.name
    }),
    integrations: { github },
    run: async (payload, io, ctx) =>
      createPrReviewJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  client.defineJob({
    id: `custom-event-streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming custom events for Github using app',
    version: '0.0.1',
    trigger: eventTrigger({
      name: `${org.name}_pr_submission.created`,
      schema: zod.object({
        organization: zod.string(),
        repo: zod.string(),
        prId: zod.number(),
        prNumber: zod.number(),
        checkRunId: zod.number(),
        senderId: zod.number(),
        senderLogin: zod.string()
      })
    }),
    concurrencyLimit: checkRunLimit,
    integrations: { github },
    run: async (payload, io, ctx) =>
      createCheckEventJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  client.defineJob({
    id: `check_run_streaming_${org.id}${isDev ? '_dev' : ''}`,
    name: 'Streaming check runs for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onCheckRun,
      org: org.name
    }),
    concurrencyLimit: customEventLimit,
    integrations: { github },
    run: async (payload, io, ctx) =>
      createCheckRunJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });
});
