import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import config from '$lib/server/config';
import clientPromise from '$lib/server/mongo';
import { collections, updateCollectionInfo, type ItemCollection } from '$lib/server/mongo/operations';
import app from '$lib/server/github';


export const POST: RequestHandler = async ({ request }) => {
    let {} = await app.webhooks.verifyAndReceive({ 
        id: request.headers["x-github-delivery"],
        name: request.headers["x-github-event"],
        signature: request.headers["x-hub-signature-256"],
        payload: request.body
    })
}