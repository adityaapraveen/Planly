import express from 'express'
import { requireAuth } from '../middlewares/requireAuth.js'

import {
    analyzeDrawingController,
    getDrawingAnalysisController,
    updateAnalysisIssueController,
    updateSheetMetadataController
} from '../controllers/analysis.controller.js'
import {
    getDrawingReportController,
    getRevisionComparisonController
} from '../controllers/drawing.controller.js'
import { analysisRateLimit } from '../middlewares/rateLimits.js'

export const analysisRouter = express.Router()

analysisRouter.use(requireAuth)

analysisRouter.post(
    '/drawings/:drawingId/analyze',
    analysisRateLimit,
    analyzeDrawingController
)

analysisRouter.get(
    '/drawings/:drawingId/analysis',
    getDrawingAnalysisController
)

analysisRouter.patch(
    '/analysis/issues/:issueId',
    updateAnalysisIssueController
)

analysisRouter.patch(
    '/sheets/:sheetId',
    updateSheetMetadataController
)

analysisRouter.get(
    '/drawings/:drawingId/report',
    getDrawingReportController
)

analysisRouter.get(
    '/drawings/:drawingId/revision-comparison',
    getRevisionComparisonController
)
