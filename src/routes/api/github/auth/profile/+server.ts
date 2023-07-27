import { json } from '@sveltejs/kit';
import app, { type User } from '$lib/server/github';
import { names, serializeCookie } from '$lib/CookieManager';
import type { RequestHandler } from '@sveltejs/kit';
import config from '$lib/config';


export const GET: RequestHandler = async ({ cookies }) => {
    let accessToken = cookies.get(names.accessTokenCookieName);
    let refreshToken = cookies.get(names.refreshTokenCookieName);

    let user: User | null = null;

    if (!accessToken) {
        if (refreshToken) {
            const { authentication } = await app.oauth.refreshToken({ refreshToken });

            cookies.set(names.accessTokenCookieName, authentication.token, serializeCookie({
                expires: new Date(authentication.expiresAt)
            }))
            cookies.set(names.refreshTokenCookieName, authentication.refreshToken, serializeCookie({
                expires: new Date(authentication.refreshTokenExpiresAt)
            }))

            accessToken = authentication.token
            refreshToken = authentication.refreshToken
        } else {
            return json({ user }, { status: 200 })
        }
    }

    await fetch(config.github.apiUrl + "/user", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(r => r.json()).then(r => user = r);
    return json({ user }, { status: 200 })
}