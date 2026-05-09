import express from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'

import {
    analyzeDrawingController,
    getDrawingAnalysisController
} from '../controllers/analysis.controller.js'

export const analysisRouter = express.Router()

analysisRouter.use(requireAuth)

analysisRouter.post(
    '/drawings/:drawingId/analyze',
    analyzeDrawingController
)

analysisRouter.get(
    '/drawings/:drawingId/analysis',
    getDrawingAnalysisController
)