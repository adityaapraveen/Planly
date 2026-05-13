import { config } from "../config/config.js";

export const errorHandler = (error, req, res, next) => {
    const isPrismaValidationError =
        error?.name === 'PrismaClientValidationError'
    const statusCode =
        error.statusCode || (isPrismaValidationError ? 400 : 500)
    const message = isPrismaValidationError
        ? 'Invalid request payload for database query'
        : (error.message || 'Internal server error')

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.NODE_ENV === 'dev' && {
            stack: error.stack
        })
    })
}
