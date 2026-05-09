import { config } from "../config/config.js";

export const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500

    res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal server errror',
        ...(config.NODE_ENV === 'dev' && {
            stack: error.stack
        })
    })
}