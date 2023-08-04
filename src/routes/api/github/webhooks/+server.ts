import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

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
    throw error(400, 'verification_failed');
  }

  const eventName = request.headers.get('x-github-event') as string;
  switch (eventName) {
    case 'installation': {
      parseInstallationEvents(body);
      break;
    }
    case 'pull_request': {
      parsePullRequestEvents(body);
      break;
    }
    case 'pull_request_review': {
      parsePullRequestReviewEvents(body);
      break;
    }
    case 'issues': {
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
