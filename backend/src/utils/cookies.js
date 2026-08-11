import { config } from '../config/config.js'

export const refreshCookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === 'prod',
    sameSite:
        config.NODE_ENV === 'prod'
            ? 'none'
            : 'lax',
    maxAge:
        config.COOKIE_EXPIRES_IN *
        24 *
        60 *
        60 *
        1000
}

export const refreshCookieClearOptions = {
    httpOnly: refreshCookieOptions.httpOnly,
    secure: refreshCookieOptions.secure,
    sameSite: refreshCookieOptions.sameSite
}
