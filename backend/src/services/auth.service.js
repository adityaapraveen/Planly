import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken
} from '../utils/jwt.js'

const sanitizeUser = (user) => {
    const { password, ...safeUser } = user
    return safeUser
}

const buildAuthPayload = (user) => ({
    userId: user.id
})

const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex')

const getTokenExpiry = (token) => {
    const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString('utf8')
    )

    return new Date(payload.exp * 1000)
}

const buildAuthTokens = async (user, session = {}) => {
    const payload = buildAuthPayload(user)
    const sessionId = crypto.randomUUID()
    const refreshToken = signRefreshToken({ ...payload, sessionId })

    await prisma.refreshSession.create({
        data: {
            id: sessionId,
            userId: user.id,
            tokenHash: hashToken(refreshToken),
            expiresAt: getTokenExpiry(refreshToken),
            userAgent: session.userAgent?.slice(0, 500),
            ipAddress: session.ipAddress?.slice(0, 100)
        }
    })

    return {
        accessToken: signAccessToken(payload),
        refreshToken
    }
}

export const registerUser = async ({ name, email, password, session }) => {
    if (!email || typeof email !== 'string') {
        throw new AppError('Valid email is required', 400)
    }

    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        throw new AppError('email already exists', 409)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    })

    const tokens = await buildAuthTokens(user, session)

    return {
        user: sanitizeUser(user),
        ...tokens
    }
}

export const loginUser = async ({ email, password, session }) => {
    if (!email || typeof email !== 'string') {
        throw new AppError('Valid email is required', 400)
    }

    if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400)
    }

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        throw new AppError('Invalid email or password', 401)
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401)
    }

    const tokens = await buildAuthTokens(user, session)

    return {
        user: sanitizeUser(user),
        ...tokens
    }
}

export const refreshAccessToken = async (refreshToken, sessionMetadata = {}) => {
    if (!refreshToken) {
        throw new AppError('Refresh token missing', 401)
    }

    let decoded

    try {
        decoded = verifyRefreshToken(refreshToken)
    } catch {
        throw new AppError('Invalid or expired refresh token', 401)
    }

    if (
        !decoded?.userId ||
        typeof decoded.userId !== 'string' ||
        !decoded?.sessionId ||
        typeof decoded.sessionId !== 'string'
    ) {
        throw new AppError('Invalid refresh token', 401)
    }

    const currentSession = await prisma.refreshSession.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true }
    })

    if (
        !currentSession ||
        currentSession.userId !== decoded.userId ||
        currentSession.revokedAt ||
        currentSession.expiresAt <= new Date() ||
        currentSession.tokenHash !== hashToken(refreshToken)
    ) {
        throw new AppError('Refresh session is no longer valid', 401)
    }

    const nextSessionId = crypto.randomUUID()
    const nextRefreshToken = signRefreshToken({
        ...buildAuthPayload(currentSession.user),
        sessionId: nextSessionId
    })

    await prisma.$transaction(async (tx) => {
        const revoked = await tx.refreshSession.updateMany({
            where: {
                id: currentSession.id,
                revokedAt: null
            },
            data: { revokedAt: new Date() }
        })

        if (revoked.count !== 1) {
            throw new AppError('Refresh token has already been used', 401)
        }

        await tx.refreshSession.create({
            data: {
                id: nextSessionId,
                userId: currentSession.userId,
                tokenHash: hashToken(nextRefreshToken),
                expiresAt: getTokenExpiry(nextRefreshToken),
                userAgent: sessionMetadata.userAgent?.slice(0, 500),
                ipAddress: sessionMetadata.ipAddress?.slice(0, 100)
            }
        })
    })

    return {
        accessToken: signAccessToken(buildAuthPayload(currentSession.user)),
        refreshToken: nextRefreshToken,
        user: sanitizeUser(currentSession.user)
    }
}

export const revokeRefreshSession = async (refreshToken) => {
    if (!refreshToken) return

    try {
        const decoded = verifyRefreshToken(refreshToken)

        if (decoded?.sessionId) {
            await prisma.refreshSession.updateMany({
                where: {
                    id: decoded.sessionId,
                    tokenHash: hashToken(refreshToken),
                    revokedAt: null
                },
                data: { revokedAt: new Date() }
            })
        }
    } catch {
        // Logout remains idempotent when the cookie is invalid or expired.
    }
}
