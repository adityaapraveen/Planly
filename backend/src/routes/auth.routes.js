import express from 'express'
import {
    login,
    logout,
    refresh,
    register
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/requireAuth.js'

export const authRouter = express.Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: req.user
        }
    })
})
