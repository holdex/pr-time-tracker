import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import config from '$lib/server/config';
import clientPromise from '$lib/server/mongo';
import app, { type IssuesEvent, type PullRequestEvent, type PullRequestReviewEvent } from '$lib/server/github';


export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json()

    const success = await verifyPayload(JSON.stringify(body), request.headers.get("x-hub-signature-256") as string)
    if (!success) {
        throw error(400, "verification_failed")
    }

    const eventName = request.headers.get("x-github-event") as string
    switch (eventName) {
        case "pull_request": {
            parsePullRequestEvents(body)
            break
        }
        case "pull_request_review": {
            parsePullRequestReviewEvents(body)
            break
        }
        case "issues": {
            parseIssuesEvents(body)
            break
        }
        default: {
            console.log("current event is not parsed", eventName)
            break
        }
    }
    return json({ message: "success" }, { status: 200 });
}

async function verifyPayload(payload: string, signature: string) {
    return app.webhooks.verify(payload, signature)
}

function parsePullRequestEvents(event: PullRequestEvent) {
    console.log('parsing pull_request_event', event)
}

function parsePullRequestReviewEvents(event: PullRequestReviewEvent) {
    console.log('parsing pull_request_review_event', event)
}

function parseIssuesEvents(event: IssuesEvent) {
    console.log('parsing issues_event', event)
} 