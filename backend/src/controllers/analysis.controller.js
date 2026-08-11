import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import {
    getDrawingAnalysis,
    requestDrawingAnalysis,
    updateAnalysisIssueStatus
} from '../services/analysis.service.js'
import { startAnalysis } from '../services/analysis-runner.service.js'

const reviewModeSchema = z.object({
    reviewMode: z
        .enum([
            'SUBMISSION_READINESS',
            'DOCUMENTATION_REVIEW',
            'CONSTRUCTABILITY_REVIEW',
            'COORDINATION_REVIEW',
            'COMPLIANCE_RISK_REVIEW'
        ])
        .default('SUBMISSION_READINESS'),
    force: z.boolean().default(false)
})

const issueStatusSchema = z.object({
    status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'])
})

export const analyzeDrawingController = asyncHandler(async (req, res) => {
    const { reviewMode, force } = reviewModeSchema.parse(req.body ?? {})
    const result = await requestDrawingAnalysis({
        drawingId: req.params.drawingId,
        userId: req.user.id,
        reviewMode,
        force
    })

    if (result.shouldStart) {
        startAnalysis({
            analysisId: result.analysis.id,
            drawingId: req.params.drawingId,
            userId: req.user.id,
            reviewMode
        })
    }

    res.status(result.shouldStart ? 202 : 200).json({
        success: true,
        message: result.created
            ? 'Analysis started successfully'
            : result.shouldStart
                ? 'Analysis is already in progress'
                : 'Latest completed analysis returned',
        data: {
            drawingId: req.params.drawingId,
            status: result.analysis.status,
            reviewMode,
            analysis: result.analysis
        }
    })
})

export const getDrawingAnalysisController = asyncHandler(async (req, res) => {
    const reviewMode = req.query.reviewMode || 'SUBMISSION_READINESS'

    const analysis = await getDrawingAnalysis({
        userId: req.user.id,
        drawingId: req.params.drawingId,
        reviewMode
    })

    res.status(200).json({
        success: true,
        data: {
            analysis
        }
    })
})

export const updateAnalysisIssueController = asyncHandler(async (req, res) => {
    const { status } = issueStatusSchema.parse(req.body)
    const issue = await updateAnalysisIssueStatus({
        userId: req.user.id,
        issueId: req.params.issueId,
        status
    })

    res.status(200).json({
        success: true,
        message: 'Finding status updated',
        data: { issue }
    })
})
