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
import { bugReports } from '../mongo/collections/bug-reports.collection';
import { contributors } from '../mongo/collections';

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

  // TODO: remove this after the feature is all ready
  const dummy = true;
  if (dummy) {
    return;
  }

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
      await saveBugReportToDb(orgDetails.id, organization.login, repository.name, pullRequest, io);
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

async function saveBugReportToDb(
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
    return io.logger('Bug report not found');
  }

  const bugReport = await io.runTask(`save-bug-report-to-db`, async () => {
    const bugReportMatch = bugReportRegex.exec(bugReportComment.body);
    if (!bugReportMatch) {
      return io.logger('Bug report regex does not match!');
    }

    const [, commitLinkOrLinkMd, bugAuthor] = bugReportMatch;
    const markdownLinkRegex = /\[[^\]]*\]\(([^)]+)\)/;

    let commitLink = commitLinkOrLinkMd;
    const regexMatch = markdownLinkRegex.exec(commitLinkOrLinkMd);
    if (regexMatch) {
      [, commitLink] = regexMatch;
    }

    let reporterId: number | undefined | null;
    const bugReporter = bugReportComment.author;
    const reporterUsername = bugReporter?.login;

    if (bugReporter) {
      if ('databaseId' in bugReporter) {
        reporterId = bugReporter.databaseId;
      } else {
        const reporter = await io.runTask(
          'get-reporter',
          async () => {
            return await contributors.getOne({ login: bugReporter.login });
          },
          { name: 'Get reporter' }
        );
        if (reporter) {
          reporterId = reporter.id;
        }
      }
    }

    if (!reporterId || !reporterUsername) {
      return io.logger('Bug report author not found');
    }

    return await bugReports.create({
      bug_author_username: bugAuthor,
      commit_link: commitLink,
      item_id: pullRequest.number,
      reporter_id: reporterId,
      reporter_username: reporterUsername
    });
  });

  // TODO: send event
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
