// import all your job files here
import { github, events } from './util';
import { client } from '../';
import { createJob as createPrJob } from './pull-requests';
import { createJob as createPrReviewJob } from './pull-requests-review';

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
    run: async (payload, io, ctx) => createPrJob(payload, io, ctx)
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
    run: async (payload, io, ctx) => createPrReviewJob(payload, io, ctx)
  });
});
