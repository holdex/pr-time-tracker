import { logger } from '@trigger.dev/sdk/v3';

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
import { insertEvent } from '../gcloud';
import { items } from '../mongo/collections';

import { type EventsSchema, EventType, type ItemSchema } from '$lib/@types';

export const bugCheckPrefix = 'Bug Report Info';
export const bugCheckName = (login: string) => `${bugCheckPrefix} (${login})`;

export const bugReportRegex = /^@pr-time-tracker bug commit (.+) && bug author @([^\s]+)/;

export function getBugReportWarningTemplate(sender: string) {
  return `@${sender} please use git blame and specify the link to the commit link that has introduced this bug. Send the following message in this PR: \`@pr-time-tracker bug commit [link] && bug author @name\``;
}

const fixPrRegex = /^fix(\(.+\))?:/;
export async function runPrFixCheckRun<
  E extends PullRequestEvent | PullRequestReviewEvent | IssueCommentEvent =
    | PullRequestEvent
    | PullRequestReviewEvent
    | IssueCommentEvent
>(payload: E) {
  const { repository, organization, sender } = payload;
  let title;
  let isPullRequestEvent = false;
  if ('pull_request' in payload) {
    isPullRequestEvent = true;
    title = payload.pull_request.title;
  } else {
    title = payload.issue.title;
  }

  let shouldRunFixPrCheck = false;
  if (fixPrRegex.test(title)) {
    shouldRunFixPrCheck = true;
    if (isPullRequestEvent && payload.action === 'edited') {
      // if the pr's body is edited, then don't need to do anything
      if ('body' in payload.changes) {
        shouldRunFixPrCheck = false;
      }
    }
  }

  let shouldDeleteFixPrCheck = false;
  if (isPullRequestEvent && payload.action === 'edited') {
    if ('title' in payload.changes) {
      if (fixPrRegex.test(payload.changes.title?.from ?? '') && !fixPrRegex.test(title)) {
        shouldDeleteFixPrCheck = true;
      }
    }
  }

  if (!shouldRunFixPrCheck && !shouldDeleteFixPrCheck) {
    return;
  }
  if (!organization) {
    return logger.log('organization not found');
  }

  let pullRequest: SimplePullRequest | PullRequest;
  if ('pull_request' in payload) {
    pullRequest = payload.pull_request;
  } else {
    const pr = await getPullRequestByIssue(
      payload.issue,
      organization.id,
      organization.login,
      payload.repository.name
    );
    if (!pr) {
      return logger.log('pull request from issue not found');
    }
    pullRequest = pr;
  }

  const orgDetails = await logger.trace('fix-pr-get-org-installation', async () => {
    const { data } = await getInstallationId(organization?.login as string);
    return data;
  });

  if (shouldRunFixPrCheck) {
    const { user } = pullRequest;

    if (pullRequest.draft) {
      return logger.log('skipped draft pull request');
    }

    if (payload.action !== 'closed') {
      await logger.trace(`create-check-run-for-fix-pr`, async () => {
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
        await logger.info(`check result`, { result });
        return Promise.resolve();
      });
    } else if (payload.action === 'closed' && payload.pull_request.merged) {
      await processBugReport(orgDetails.id, organization.login, repository.name, pullRequest);
    }
  } else if (shouldDeleteFixPrCheck) {
    await deleteFixPrReportAndResolveCheckRun(
      orgDetails.id,
      organization.login,
      repository.name,
      pullRequest,
      sender
    );
  }
}

async function processBugReport(
  orgID: number,
  orgName: string,
  repositoryName: string,
  pullRequest: SimplePullRequest | PullRequest
) {
  const bugReportComment = await getPreviousComment(
    orgID,
    orgName,
    repositoryName,
    bugReportRegex,
    pullRequest.number,
    'pullRequest',
    'others'
  );
  if (!bugReportComment) {
    return logger.log('Bug report not found');
  }

  await logger.trace(`send-bug-report-event`, async () => {
    const bugReportMatch = bugReportRegex.exec(bugReportComment.body);
    if (!bugReportMatch) {
      return logger.log('Bug report regex does not match!');
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
    await sendBugReportEvent(bugReport);
  });
}

type BugReport = {
  commitLink: string;
  bugAuthorUsername: string;
  reporterUsername: string;
};
async function sendBugReportEvent(bugReport: BugReport) {
  const commitLinkRegex = /https:\/\/github.com\/([^/]+)\/([^/]+)\/pull\/([^/]+)\/commits\/([^/]+)/;
  const regexRes = commitLinkRegex.exec(bugReport.commitLink);
  if (!regexRes) {
    return logger.log('commit link regex does not match');
  }
  const [, org, repo, prNumber] = commitLinkRegex.exec(bugReport.commitLink) ?? [];
  const pullRequest: ItemSchema | null = await logger.trace(
    `fix-pr-get-pull-request-${prNumber}`,
    async () => {
      return items.getOne({
        number: { $eq: Number(prNumber) },
        repo: { $eq: repo },
        org: { $eq: org }
      });
    }
  );

  const event: EventsSchema = {
    action: EventType.BUG_INTRODUCED,
    id: pullRequest?.number ?? Number(prNumber),
    index: 1,
    organization: pullRequest?.org ?? org ?? 'holdex',
    owner: bugReport.bugAuthorUsername,
    repository: pullRequest?.repo ?? repo,
    sender: bugReport.reporterUsername,
    title: pullRequest?.title ?? 'unknown',
    created_at: pullRequest?.created_at
      ? Math.round(new Date(pullRequest.created_at).getTime() / 1000).toFixed(0)
      : undefined,
    updated_at: pullRequest?.updated_at
      ? Math.round(new Date(pullRequest.updated_at).getTime() / 1000).toFixed(0)
      : undefined
  };

  const eventId = `${event.organization}/${event.repository}@${event.id}_${event.action}`;
  await logger.trace(`insert event: ${eventId}`, async () => {
    const data = await insertEvent(event, eventId);
    return data;
  });
}

async function deleteFixPrReportAndResolveCheckRun(
  orgID: number,
  orgName: string,
  repositoryName: string,
  pullRequest: SimplePullRequest | PullRequest,
  sender: { login: string; id: number }
) {
  await logger.trace(`delete-fix-pr-warning-and-resolve-check-run`, async () => {
    const previousBugReportWarning = await getPreviousComment(
      orgID,
      orgName,
      repositoryName,
      submissionHeaderComment('Bug Report', pullRequest.number.toString()),
      pullRequest.number,
      'pullRequest',
      'bot'
    );
    if (previousBugReportWarning) {
      await deleteComment(orgID, orgName, repositoryName, previousBugReportWarning);
    }

    await deleteCheckRun(
      { name: orgName, installationId: orgID, repo: repositoryName },
      sender,
      pullRequest,
      (s) => bugCheckName(s)
    );
  });
}
