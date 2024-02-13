// import all your job files here
import type { IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import { github, events } from './util';
import { client } from '../';
import { createJob as createPrJob } from './pull-requests';
import { createJob as createPrReviewJob } from './pull-requests-review';
import { createJob as createCheckRunJob } from './check-run';

[
  { id: 'clearpool', name: 'clearpool-finance' },
  { id: 'holdex', name: 'holdex' }
].forEach((org) => {
  client.defineJob({
    // This is the unique identifier for your Job, it must be unique across all Jobs in your project
    id: `pull-requests-streaming_${org.id}`,
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
    id: `pull-requests-review-streaming_${org.id}`,
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
    id: `check_run_streaming_${org.id}`,
    name: 'Streaming check runs for Github using app',
    version: '0.0.1',
    trigger: github.triggers.org({
      event: events.onCheckRun,
      org: org.name
    }),
    integrations: { github },
    run: async (payload, io, ctx) =>
      createCheckRunJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  });

  // client.defineJob({
  //   id: `check_suite_streaming_${org.id}`,
  //   name: 'Streaming check suite for Github using app',
  //   version: '0.0.1',
  //   trigger: github.triggers.org({
  //     event: events.onCheckSuite,
  //     org: org.name
  //   }),
  //   integrations: { github },
  //   run: async (payload, io, ctx) =>
  //     createCheckSuiteJob<IOWithIntegrations<{ github: Autoinvoicing }>>(payload, io, ctx)
  // });
});
