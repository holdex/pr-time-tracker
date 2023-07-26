import type { RequestHandler } from '@sveltejs/kit';
import { json, redirect } from '@sveltejs/kit';
import app from '$lib/server/github';


export const GET: RequestHandler = async ({ url }) => {
    const code = url.searchParams.get("code") as string;
    const state = url.searchParams.get("state") as string;

    const result = await app.oauth.createToken({
        code,
        state,
    })
    console.log('result', result);
    return json({ message: "success" }, { status: 200 })
    return redirect(307, "/")
}