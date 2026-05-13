import bcrypt from 'bcrypt'
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

const buildAuthTokens = (user) => {
    const payload = buildAuthPayload(user)
    return {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload)
    }
}

export const registerUser = async ({ name, email, password }) => {
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

    const tokens = buildAuthTokens(user)

    return {
        user: sanitizeUser(user),
        ...tokens
    }
}

export const loginUser = async ({ email, password }) => {
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

    const tokens = buildAuthTokens(user)

    return {
        user: sanitizeUser(user),
        ...tokens
    }
}

export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError('Refresh token missing', 401)
    }

    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded?.userId || typeof decoded.userId !== 'string') {
        throw new AppError('Invalid refresh token', 401)
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
    })

    if (!user) {
        throw new AppError('User no longer exists', 401)
    }

    return {
        accessToken: signAccessToken(buildAuthPayload(user)),
        user: sanitizeUser(user)
    }
}
