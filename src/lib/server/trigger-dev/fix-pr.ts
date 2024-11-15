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
  getPullRequestByIssue,
  submissionHeaderComment
} from './utils';
import { contributors } from '../mongo/collections';
import { insertEvent } from '../gcloud';

import { EventType } from '$lib/@types';

export const bugCheckPrefix = 'Bug Report Info';
export const bugCheckName = (login: string) => `${bugCheckPrefix} (${login})`;

export const bugReportRegex = /^@pr-time-tracker bug commit (.+) && bug author @(.+)/;

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
    bugCheckPrefix,
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

      let reporterId: number | undefined | null;
      const reporter = bugReportComment.author;
      const reporterUsername = reporter?.login;

      if (reporter) {
        const user = await io.runTask(
          'get-reporter',
          async () => {
            return await contributors.getOne({ login: reporter.login });
          },
          { name: 'Get reporter' }
        );
        if (user) {
          reporterId = user.id;
        }
      }

      if (!reporterId || !reporterUsername) {
        return io.logger.log('Bug report author not found');
      }

      const bugAuthorContributor = await io.runTask(
        'get-bug-author',
        async () => {
          return await contributors.getOne({ login: bugAuthor });
        },
        { name: 'Get bug author' }
      );

      const bugReport: BugReport = {
        commitLink,
        bugAuthorUsername: bugAuthor,
        bugAuthorId: bugAuthorContributor.id,
        reporterId: reporterId,
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
  bugAuthorId: number;
  reporterId: number;
  reporterUsername: string;
};
async function sendBugReportEvent<T extends IOWithIntegrations<{ github: Autoinvoicing }>>(
  bugReport: BugReport,
  pullRequest: SimplePullRequest | PullRequest,
  orgName: string,
  repositoryName: string,
  io: T
) {
  const event = {
    action: EventType.PR_CLOSED,
    id: pullRequest.number,
    index: 1,
    organization: orgName || 'holdex',
    owner: pullRequest.user.login,
    repository: repositoryName,
    sender: pullRequest.user.login,
    title: pullRequest.title,
    commit_link: bugReport.commitLink,
    bug_author_username: bugReport.bugAuthorUsername,
    bug_author_id: bugReport.bugAuthorId,
    reporter_id: bugReport.reporterId,
    reporter_username: bugReport.reporterUsername,
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
        submissionHeaderComment('Bug Report', pullRequest.number.toString()),
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
