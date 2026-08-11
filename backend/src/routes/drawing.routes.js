import express from 'express'

import { requireAuth } from '../middlewares/requireAuth.js'

import { uploadDrawing } from '../middlewares/upload.middleware.js'
import { uploadRateLimit } from '../middlewares/rateLimits.js'

import {
    deleteProjectDrawingController,
    getProjectDrawingsController,
    uploadDrawingController
} from '../controllers/drawing.controller.js'

export const drawingRouter =
    express.Router()

drawingRouter.use(requireAuth)

drawingRouter.route('/:projectId/drawings').post(
        uploadRateLimit,
        uploadDrawing.single('drawing'),
        uploadDrawingController
    )

    .get(getProjectDrawingsController)

drawingRouter
    .route('/:projectId/drawings/:drawingId')
    .delete(deleteProjectDrawingController)
