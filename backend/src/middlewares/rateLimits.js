import { rateLimit } from 'express-rate-limit'

const jsonRateLimitHandler = (req, res) => {
    res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        requestId: req.id
    })
}

const createLimiter = (options) => rateLimit({
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: jsonRateLimitHandler,
    ...options
})

export const apiRateLimit = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 500
})

export const authRateLimit = createLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 25
})

export const uploadRateLimit = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 30
})

export const analysisRateLimit = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 30
})

export const questionRateLimit = createLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 60
})
