import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import {
    loginUser,
    refreshAccessToken,
    registerUser,
    revokeRefreshSession
} from '../services/auth.service.js'
import {
    refreshCookieClearOptions,
    refreshCookieOptions
} from '../utils/cookies.js'

const registerSchema = z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8)
})

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8)
})

export const login = asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body)

    const result = await loginUser({
        ...payload,
        session: {
            userAgent: req.get('user-agent'),
            ipAddress: req.ip
        }
    })

    res.cookie(
        'refreshToken',
        result.refreshToken,
        refreshCookieOptions
    )

    res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    })
})

export const register = asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body)

    const result = await registerUser({
        ...payload,
        session: {
            userAgent: req.get('user-agent'),
            ipAddress: req.ip
        }
    })

    res.cookie(
        'refreshToken',
        result.refreshToken,
        refreshCookieOptions
    )

    res.status(201).json({
        success: true,
        message: 'Registered successfully',
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    })
})

export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    const result = await refreshAccessToken(refreshToken, {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
    })

    res.cookie(
        'refreshToken',
        result.refreshToken,
        refreshCookieOptions
    )

    res.status(200).json({
        success: true,
        message: 'Access token refreshed',
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    })
})

export const logout = asyncHandler(async (req, res) => {
    await revokeRefreshSession(req.cookies?.refreshToken)
    res.clearCookie('refreshToken', refreshCookieClearOptions)

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    })
})
