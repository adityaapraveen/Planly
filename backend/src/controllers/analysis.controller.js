import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import {
    getDrawingAnalysis,
    requestDrawingAnalysis,
    updateAnalysisIssueStatus
} from '../services/analysis.service.js'
import { startAnalysis } from '../services/analysis-runner.service.js'
import { updateSheetMetadata } from '../services/sheet-index.service.js'

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
    status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED']),
    reason: z.string().trim().max(500).nullable().optional(),
    note: z.string().trim().max(2000).nullable().optional()
}).strict()

const optionalMetadataValue = z.string().trim().max(500).nullable().optional()
const sheetMetadataSchema = z.object({
    sheetNumber: optionalMetadataValue,
    title: optionalMetadataValue,
    discipline: optionalMetadataValue,
    revision: optionalMetadataValue,
    issueDate: optionalMetadataValue,
    reviewStatus: z.literal('CONFIRMED').optional()
}).strict().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one metadata field or confirmation is required' }
).refine(
    (value) => !value.reviewStatus || Object.keys(value).length === 1,
    { message: 'Confirm metadata separately from correcting fields' }
)

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
    const { status, reason, note } = issueStatusSchema.parse(req.body)
    const issue = await updateAnalysisIssueStatus({
        userId: req.user.id,
        issueId: req.params.issueId,
        status,
        reason,
        note
    })

    res.status(200).json({
        success: true,
        message: 'Finding status updated',
        data: { issue }
    })
})

export const updateSheetMetadataController = asyncHandler(async (req, res) => {
    const changes = sheetMetadataSchema.parse(req.body)
    const sheet = await updateSheetMetadata({
        userId: req.user.id,
        sheetId: req.params.sheetId,
        changes
    })

    res.status(200).json({
        success: true,
        message: changes.reviewStatus === 'CONFIRMED'
            ? 'Sheet metadata confirmed'
            : 'Sheet metadata corrected',
        data: { sheet }
    })
})
