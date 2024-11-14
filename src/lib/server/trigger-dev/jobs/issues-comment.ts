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

export async function createJob<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  payload: IssueCommentEvent,
  io: T,
  ctx: TriggerContext,
  org: { nodeId: string; name: string }
) {
  const { action, organization, repository, issue } = payload;
  const orgName = organization?.login || 'holdex';

  const isPullRequest = !!issue.pull_request;
  if (!isPullRequest) {
    io.logger.log('comment creation in issue is not in the parse candidate', payload);
    return;
  }

  const orgDetails = await io.runTask(
    'get-org-installation',
    async () => {
      const { data } = await getInstallationId(orgName);
      return data;
    },
    { name: 'Get Organization installation' }
  );

  switch (action) {
    case 'created': {
      if (excludedAccounts.includes(payload.sender.login)) {
        io.logger.log(`current sender ${payload.sender.login} for issue comment is excluded`);
        return;
      }

      const pr = await getPullRequestByIssue(issue, orgDetails.id, org.name, repository.name, io);
      if (!pr) {
        return;
      }

      await io.runTask(
        'reinsert-sticky-comment',
        async () => {
          return reinsertComment(
            orgDetails.id,
            org.name,
            repository.name,
            submissionHeaderComment('Pull Request', pr.id.toString()),
            issue.number,
            io
          );
        },
        { name: 'Reinsert sticky comment' }
      );

      await runPrFixCheckRun({ ...payload, pull_request: pr }, io);

      break;
    }
    case 'edited': {
      const isChangedToOrFromBugReport =
        (bugReportRegex.test(payload.comment.body) &&
          bugReportRegex.test(payload.changes.body?.from ?? '')) ||
        (!bugReportRegex.test(payload.comment.body) &&
          bugReportRegex.test(payload.changes.body?.from ?? ''));

      if (isChangedToOrFromBugReport) {
        await runPrFixCheckRun({ ...payload, pull_request: payload.issue }, io);
      }
      break;
    }
    case 'deleted': {
      const isBugReport = bugReportRegex.test(payload.comment.body);
      if (isBugReport) {
        await runPrFixCheckRun({ ...payload, pull_request: payload.issue }, io);
      }
      break;
    }
    default: {
      io.logger.log('current action for issue comment is not in the parse candidate', payload);
    }
  }
}
