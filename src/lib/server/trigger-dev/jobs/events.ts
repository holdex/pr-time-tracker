import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';

import type { IssuesEvent } from '$lib/server/github';

import { client } from '../';
import { github, events } from './util';

// Your first job
// This Job will be triggered by an event, log a joke to the console, and then wait 5 seconds before logging the punchline
client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'events-streaming_clearpool',
  name: 'Streaming events for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onIssue,
    org: 'clearpool-finance'
  }),
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'events-streaming_holdex',
  name: 'Streaming events for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onIssue,
    org: 'holdex'
  }),
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project
  id: 'events-streaming_ithaca',
  name: 'Streaming events for Github using app',
  version: '0.0.1',
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: github.triggers.org({
    event: events.onIssue,
    org: 'itacha-protocol'
  }),
  run: async (payload, io, ctx) => createJob(payload, io, ctx)
});

async function createJob(payload: IssuesEvent, io: IOWithIntegrations<any>, ctx: TriggerContext) {
  io.logger.log('current action for issue is not in the parse candidate', payload);
}
