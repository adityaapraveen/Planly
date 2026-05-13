import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import {
    loginUser,
    refreshAccessToken,
    registerUser
} from '../services/auth.service.js'
import { refreshCookieOptions } from '../utils/cookies.js'

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

    const result = await loginUser(payload)

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

    const result = await registerUser(payload)

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
    const result = await refreshAccessToken(refreshToken)

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
    res.clearCookie('refreshToken', refreshCookieOptions)

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    })
})
