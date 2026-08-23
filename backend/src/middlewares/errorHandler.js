import { config } from "../config/config.js";

export const errorHandler = (error, req, res, next) => {
    const isPrismaValidationError =
        error?.name === 'PrismaClientValidationError'
    const isZodError = error?.name === 'ZodError'
    const isUploadTooLarge = error?.code === 'LIMIT_FILE_SIZE'
    const statusCode =
        error.statusCode ||
        (isUploadTooLarge ? 413 : null) ||
        (isPrismaValidationError || isZodError ? 400 : 500)
    const message = isUploadTooLarge
        ? 'PDF must be 20MB or smaller'
        : isZodError
            ? 'Invalid request payload'
            : isPrismaValidationError
                ? 'Invalid request payload for database query'
                : (error.message || 'Internal server error')

    const publicMessage = statusCode >= 500 && config.NODE_ENV !== 'dev'
        ? 'The request could not be completed. Try again or contact support with the request ID.'
        : message

    console.error(JSON.stringify({
        level: 'error',
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        errorName: error?.name,
        errorCode: error?.code,
        message
    }))

    res.status(statusCode).json({
        success: false,
        message: publicMessage,
        requestId: req.id,
        ...(config.NODE_ENV === 'dev' && {
            stack: error.stack
        })
    })
}
