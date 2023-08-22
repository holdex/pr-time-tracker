import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

import { BAD_REQUEST, GitHubEventName } from '$lib/constants';
import app from '$lib/server/github';

import parseInstallationEvents from './installation';
import parsePullRequestEvents from './pull-requests';
import parsePullRequestReviewEvents from './pull-request-review';
import parseIssuesEvents from './issues';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const success = await app.webhooks.verify(
    JSON.stringify(body),
    request.headers.get('x-hub-signature-256') as string
  );
  if (!success) {
    throw error(BAD_REQUEST, 'verification_failed');
  }

  const eventName = request.headers.get('x-github-event') as string;

  switch (eventName as GitHubEventName) {
    case GitHubEventName.INSTALATION: {
      parseInstallationEvents(body);
      break;
    }
    case GitHubEventName.PULL_REQUEST: {
      parsePullRequestEvents(body);
      break;
    }
    case GitHubEventName.PULL_REQUEST_REVIEW: {
      parsePullRequestReviewEvents(body);
      break;
    }
    case GitHubEventName.ISSUES: {
      parseIssuesEvents(body);
      break;
    }
    default: {
      console.log('current event is not parsed', eventName);
      break;
    }
  }
  return json({ message: 'success' }, { status: 200 });
};
