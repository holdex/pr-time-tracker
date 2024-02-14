import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import type { CheckRunEvent } from '$lib/server/github';
import app from '$lib/server/github';

import { getSubmissionStatus, submissionCheckName } from './util';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: CheckRunEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, repository, organization, sender, check_run } = payload;

  switch (action) {
    case 'created':
    case 'rerequested': {
      if (check_run.name === submissionCheckName) {
        const submission = await getSubmissionStatus(sender.id, check_run.pull_requests[0].number);

        const octokit = await app.getInstallationOctokit(40473624);
        await octokit.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
          owner: organization?.login || 'holdex',
          repo: repository.name,
          check_run_id: check_run.id,
          status: 'completed',
          conclusion: submission ? 'success' : 'failure',
          completed_at: new Date().toISOString(),
          output: {
            title: submission
              ? `✅ cost submitted: ${submission.hours} hours.`
              : '❌ Cost submission missing',
            summary: submission
              ? `Pull request cost submitted`
              : `Submit cost. [Go to](https://invoice.holdex.io)`
          }
        });
      }
      break;
    }
    default: {
      io.logger.log('current action for check run is not in the parse candidate', payload);
    }
  }
}
