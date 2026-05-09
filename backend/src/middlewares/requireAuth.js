import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { verifyAccessToken } from '../utils/jwt.js'

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication required', 401)
        }

        const token = authHeader.slice(7).trim()
        const decoded = verifyAccessToken(token)

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        if (!user) {
            throw new AppError('User no longer exists', 401)
        }

        req.user = user
        next()
    } catch (error) {
        next(new AppError('Invalid or expired token', 401))
    }
}
