import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import app from '$lib/server/github';


export const GET: RequestHandler = async ({ }) => {
    const result = await app.octokit.request("GET /app")
    console.log('result', result);
    return json({ message: "success" }, { status: 200 })
}