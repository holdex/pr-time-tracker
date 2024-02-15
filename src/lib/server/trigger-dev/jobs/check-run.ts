import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';

import type { CheckRunEvent } from '$lib/server/github';
import app from '$lib/server/github';

import { getInstallationId, getSubmissionStatus, submissionCheckName } from './util';

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: CheckRunEvent,
  io: T,
  ctx: TriggerContext
) {
  const { action, repository, sender, check_run, organization } = payload;

  switch (action) {
    case 'created':
    case 'rerequested': {
      if (check_run.name === submissionCheckName) {
        const orgDetails = await io.github.runTask(
          'get org installation',
          async () => {
            const { data } = await getInstallationId(organization?.login as string);
            return data;
          },
          { name: 'Get Organization installation' }
        );

        await io.github.runTask(
          'update-check-run',
          async () => {
            const submission = await getSubmissionStatus(
              sender.id,
              check_run.pull_requests[0].number
            );
            const octokit = await app.getInstallationOctokit(orgDetails.id);
            await octokit.rest.checks.update({
              owner: organization?.login as string,
              repo: repository.name,
              check_run_id: check_run.id,
              status: 'completed',
              conclusion: submission ? 'success' : 'failure',
              completed_at: new Date().toISOString(),
              output: {
                title: submission
                  ? `✅ cost submitted: ${submission.hours} hours.`
                  : '❌ cost submission missing',
                summary: submission
                  ? `Pull request cost submitted. No actions required.`
                  : `Submit cost by following the [link](https://invoice.holdex.io).`
              }
            });
          },
          { name: 'Update check run' }
        );
      }
      break;
    }
    default: {
      io.logger.log('current action for check run is not in the parse candidate', payload);
    }
  }
}
