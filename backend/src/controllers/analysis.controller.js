import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { addAnalysisJob } from '../queues/analysis.queue.js'
import { getDrawingAnalysis } from '../services/analysis.service.js'

const reviewModeSchema = z.object({
    reviewMode: z
        .enum([
            'SUBMISSION_READINESS',
            'DOCUMENTATION_REVIEW',
            'CONSTRUCTABILITY_REVIEW',
            'COORDINATION_REVIEW',
            'COMPLIANCE_RISK_REVIEW'
        ])
        .default('SUBMISSION_READINESS')
})

export const analyzeDrawingController = asyncHandler(async (req, res) => {
    const { reviewMode } = reviewModeSchema.parse(req.body ?? {})

    const drawing = await prisma.drawing.findFirst({
        where: {
            id: req.params.drawingId,
            project: {
                userId: req.user.id
            }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    const existingAnalysis = await prisma.analysis.findUnique({
        where: {
            drawingId_reviewMode: {
                drawingId: drawing.id,
                reviewMode
            }
        }
    })

    if (existingAnalysis) {
        return res.status(200).json({
            success: true,
            message: 'Analysis already completed for this review mode',
            data: {
                drawingId: drawing.id,
                status: 'COMPLETED',
                reviewMode,
                analysis: existingAnalysis
            }
        })
    }

    if (drawing.status === 'PENDING' || drawing.status === 'PROCESSING') {
        return res.status(202).json({
            success: true,
            message: 'Analysis is already in progress',
            data: {
                drawingId: drawing.id,
                status: drawing.status,
                reviewMode
            }
        })
    }

    await prisma.drawing.update({
        where: { id: drawing.id },
        data: { status: 'PENDING' }
    })

    try {
        await addAnalysisJob({
            drawingId: drawing.id,
            userId: req.user.id,
            reviewMode
        })
    } catch {
        await prisma.drawing.update({
            where: { id: drawing.id },
            data: { status: 'FAILED' }
        })

        throw new AppError('Could not queue analysis job. Please try again.', 503)
    }

    res.status(202).json({
        success: true,
        message: 'Analysis queued successfully',
        data: {
            drawingId: drawing.id,
            status: 'PENDING',
            reviewMode
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