import { logger } from '@trigger.dev/sdk/v3';

import type { TriggerContext, IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type { IssueCommentEvent } from '@octokit/webhooks-types';

import {
  getInstallationId,
  submissionHeaderComment,
  getPullRequestByIssue,
  excludedAccounts,
  reinsertComment
} from '../utils';
import { bugReportRegex, runPrFixCheckRun } from '../fix-pr';

export async function createJob(payload: IssueCommentEvent) {
  const { action, organization, repository, issue } = payload;
  const orgName = organization?.login || 'holdex';

  const isPullRequest = !!issue.pull_request;
  if (!isPullRequest) {
    logger.log('comment creation in issue is not in the parse candidate', payload as any);
    return;
  }

  const orgDetails = await logger.trace('get-org-installation', async () => {
    const { data } = await getInstallationId(orgName);
    return data;
  });

  switch (action) {
    case 'created': {
      if (excludedAccounts.includes(payload.sender.login)) {
        logger.log(`current sender ${payload.sender.login} for issue comment is excluded`);
        return;
      }

      const pr = await getPullRequestByIssue(issue, orgDetails.id, orgName, repository.name);
      if (!pr) {
        return;
      }

      await logger.trace('reinsert-sticky-comment', async () => {
        return reinsertComment(
          orgDetails.id,
          orgName,
          repository.name,
          submissionHeaderComment('Pull Request', pr.id.toString()),
          issue.number
        );
      });

      await runPrFixCheckRun({ ...payload, pull_request: pr });

      break;
    }
    case 'edited': {
      const isChangedToOrFromBugReport =
        bugReportRegex.test(payload.comment.body) !==
        bugReportRegex.test(payload.changes.body?.from ?? '');

      if (isChangedToOrFromBugReport) {
        await runPrFixCheckRun(payload);
      }
      break;
    }
    case 'deleted': {
      const isBugReport = bugReportRegex.test(payload.comment.body);
      if (isBugReport) {
        await runPrFixCheckRun(payload);
      }
      break;
    }
    default: {
      logger.log('current action for issue comment is not in the parse candidate', payload);
    }
  }
}
