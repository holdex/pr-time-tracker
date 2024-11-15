import type { IOWithIntegrations } from '@trigger.dev/sdk';
import type { Autoinvoicing } from '@holdex/autoinvoicing';
import type {
  IssueCommentEvent,
  PullRequest,
  PullRequestEvent,
  PullRequestReviewEvent,
  SimplePullRequest
} from '@octokit/webhooks-types';

import {
  createCheckRunIfNotExists,
  deleteCheckRun,
  deleteComment,
  getInstallationId,
  getPreviousComment,
  getPullRequestByIssue
} from './utils';
import { insertEvent } from '../gcloud';

import { type EventsSchema, EventType } from '$lib/@types';

export const bugCheckPrefix = 'Bug Report Info';
export const bugCheckName = (login: string) => `${bugCheckPrefix} (${login})`;

export const bugReportRegex = /^@pr-time-tracker bug commit (.+) && bug author @([^\s]+)/;

export function getBugReportWarningTemplate(sender: string) {
  return `@${sender} please use git blame and specify the link to the commit link that has introduced this bug. Send the following message in this PR: \`@pr-time-tracker bug commit [link] && bug author @name\``;
}

const fixPrRegex = /^fix:/;
export async function runPrFixCheckRun<
  T extends IOWithIntegrations<{ github: Autoinvoicing }>,
  E extends PullRequestEvent | PullRequestReviewEvent | IssueCommentEvent =
    | PullRequestEvent
    | PullRequestReviewEvent
    | IssueCommentEvent
>(payload: E, io: T) {
  const { repository, organization, sender } = payload;
  let title;
  if ('pull_request' in payload) {
    title = payload.pull_request.title;
  } else {
    title = payload.issue.title;
  }

  const isTitleChangedFromFixPr =
    payload.action === 'edited' &&
    'title' in payload.changes &&
    fixPrRegex.test(payload.changes.title?.from ?? '') &&
    !fixPrRegex.test(title);
  const isFixPr = fixPrRegex.test(title);

  if (!isFixPr && !isTitleChangedFromFixPr) {
    return;
  }
  if (!organization) {
    return io.logger.log('organization not found');
  }

  let pullRequest: SimplePullRequest | PullRequest;
  if ('pull_request' in payload) {
    pullRequest = payload.pull_request;
  } else {
    const pr = await getPullRequestByIssue(
      payload.issue,
      organization.id,
      organization.login,
      payload.repository.name,
      io
    );
    if (!pr) {
      return io.logger.log('pull request from issue not found');
    }
    pullRequest = pr;
  }

  const orgDetails = await io.runTask(
    'get org installation',
    async () => {
      const { data } = await getInstallationId(organization?.login as string);
      return data;
    },
    { name: 'Get Organization installation' }
  );

  if (isFixPr) {
    const { user } = pullRequest;

    if (payload.action !== 'closed') {
      await io.runTask(
        `create-check-run-for-fix-pr`,
        async () => {
          const result = await createCheckRunIfNotExists(
            {
              name: organization.login as string,
              installationId: orgDetails.id,
              repo: repository.name
            },
            user,
            pullRequest,
            (b) => bugCheckName(b),
            'bug_report'
          );
          await io.logger.info(`check result`, { result });
          return Promise.resolve();
        },
        { name: `check run for fix PR` }
      );
    } else if (payload.action === 'closed' && payload.pull_request.merged) {
      await processBugReport(orgDetails.id, organization.login, repository.name, pullRequest, io);
    }
  } else if (isTitleChangedFromFixPr) {
    await deleteFixPrReportAndResolveCheckRun(
      orgDetails.id,
      organization.login,
      repository.name,
      pullRequest,
      sender,
      io
    );
  }
}

async function processBugReport(
  orgID: number,
  orgName: string,
  repositoryName: string,
  pullRequest: SimplePullRequest | PullRequest,
  io: any
) {
  const bugReportComment = await getPreviousComment(
    orgID,
    orgName,
    repositoryName,
    bugReportRegex,
    pullRequest.number,
    'pullRequest',
    'others',
    io
  );
  if (!bugReportComment) {
    return io.logger.log('Bug report not found');
  }

  await io.runTask(
    `send-bug-report-event`,
    async () => {
      const bugReportMatch = bugReportRegex.exec(bugReportComment.body);
      if (!bugReportMatch) {
        return io.logger.log('Bug report regex does not match!');
      }

      const [, commitLinkOrLinkMd, bugAuthor] = bugReportMatch;
      const markdownLinkRegex = /\[[^\]]*\]\(([^)]+)\)/;

      let commitLink = commitLinkOrLinkMd;
      const regexMatch = markdownLinkRegex.exec(commitLinkOrLinkMd);
      if (regexMatch) {
        [, commitLink] = regexMatch;
      }

      const reporter = bugReportComment.author;
      const reporterUsername = reporter?.login ?? 'unknown';

      const bugReport: BugReport = {
        commitLink,
        bugAuthorUsername: bugAuthor,
        reporterUsername: reporterUsername
      };
      await sendBugReportEvent(bugReport, pullRequest, orgName, repositoryName, io);
    },
    { name: 'send bug report event' }
  );
}

type BugReport = {
  commitLink: string;
  bugAuthorUsername: string;
  reporterUsername: string;
};
async function sendBugReportEvent<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  bugReport: BugReport,
  pullRequest: SimplePullRequest | PullRequest,
  orgName: string,
  repositoryName: string,
  io: T
) {
  const event: EventsSchema = {
    action: EventType.BUG_INTRODUCED,
    id: pullRequest.id,
    label: bugReport.commitLink,
    index: 1,
    organization: orgName || 'holdex',
    owner: bugReport.bugAuthorUsername,
    repository: repositoryName,
    sender: bugReport.reporterUsername,
    title: pullRequest.title,
    created_at: Math.round(new Date(pullRequest.created_at).getTime() / 1000).toFixed(0),
    updated_at: Math.round(new Date(pullRequest.updated_at).getTime() / 1000).toFixed(0)
  };

  const eventId = `${event.organization}/${event.repository}@${event.id}_${event.action}_bug-report`;
  await io.runTask(
    `insert event: ${eventId}`,
    async () => {
      const data = await insertEvent(event, eventId);
      return data;
    },
    { name: 'Insert Bigquery event' },
    (err: any, _, _io) => {
      _io.logger.error(err);
    }
  );
}

async function deleteFixPrReportAndResolveCheckRun(
  orgID: number,
  orgName: string,
  repositoryName: string,
  pullRequest: SimplePullRequest | PullRequest,
  sender: { login: string; id: number },
  io: any
) {
  await io.runTask(
    `delete-fix-pr-warning-and-resolve-check-run`,
    async () => {
      const previousBugReportWarning = await getPreviousComment(
        orgID,
        orgName,
        repositoryName,
        bugReportRegex,
        pullRequest.number,
        'pullRequest',
        'bot',
        io
      );
      if (previousBugReportWarning) {
        await deleteComment(orgID, orgName, repositoryName, previousBugReportWarning, io);
      }

      await deleteCheckRun(
        { name: orgName, installationId: orgID, repo: repositoryName },
        sender,
        pullRequest,
        (s) => bugCheckName(s),
        io
      );
    },
    { name: `delete fix pr warning and resolve check run` }
  );
}
