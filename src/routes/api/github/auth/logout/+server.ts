import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { names, serializeCookie } from '$lib/CookieManager';

export const GET: RequestHandler = async ({ cookies }) => {
    cookies.delete(names.accessTokenCookieName, serializeCookie({
        expires: new Date(0)
    }))
    cookies.delete(names.refreshTokenCookieName, serializeCookie({
        expires: new Date(0)
    }))
    return json({}, { status: 200 })
}