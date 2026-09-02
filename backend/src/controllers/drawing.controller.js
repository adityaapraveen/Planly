import { asyncHandler } from '../middlewares/asyncHandler.js'

import {
    deleteProjectDrawing,
    getDrawingPageArtifacts,
    getDrawingReport,
    getProjectDrawings,
    uploadProjectDrawing
} from '../services/drawing.service.js'

import { startAnalysis } from '../services/analysis-runner.service.js'
import { requestDrawingAnalysis } from '../services/analysis.service.js'
import { getRevisionComparison } from '../services/revision-comparison.service.js'

export const uploadDrawingController = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'PDF file is required'
        })
    }

    const revisionOfId = typeof req.body?.revisionOfId === 'string'
        ? req.body.revisionOfId.trim()
        : null

    const drawing = await uploadProjectDrawing({
        userId: req.user.id,
        projectId: req.params.projectId,
        file: req.file,
        revisionOfId: revisionOfId || null
    })

    let result

    try {
        result = await requestDrawingAnalysis({
            drawingId: drawing.id,
            userId: req.user.id,
            reviewMode: 'SUBMISSION_READINESS'
        })
    } catch (error) {
        await deleteProjectDrawing({
            userId: req.user.id,
            projectId: req.params.projectId,
            drawingId: drawing.id
        })
        throw error
    }

    startAnalysis({
        analysisId: result.analysis.id,
        drawingId: drawing.id,
        userId: req.user.id,
        reviewMode: 'SUBMISSION_READINESS'
    })

    res.status(202).json({
        success: true,
        message: 'Drawing uploaded successfully. Analysis has started.',

        data: {
            drawing: {
                id: drawing.id,
                fileName: drawing.fileName,
                mimeType: drawing.mimeType,
                size: drawing.size,
                status: result.analysis.status,
                projectId: drawing.projectId,
                revisionOfId: drawing.revisionOfId,
                createdAt: drawing.createdAt,
                updatedAt: drawing.updatedAt
            },
            analysis: result.analysis
        }
    })
})

export const getProjectDrawingsController = asyncHandler(async (req, res) => {
    const drawings = await getProjectDrawings({
        userId: req.user.id,
        projectId: req.params.projectId
    })

    res.status(200).json({
        success: true,
        data: {
            drawings
        }
    })
})

export const deleteProjectDrawingController = asyncHandler(async (req, res) => {
    await deleteProjectDrawing({
        userId: req.user.id,
        projectId: req.params.projectId,
        drawingId: req.params.drawingId
    })

    res.status(200).json({
        success: true,
        message: 'Drawing deleted successfully'
    })
})

export const getDrawingPageArtifactsController = asyncHandler(async (req, res) => {
    const artifacts = await getDrawingPageArtifacts({
        userId: req.user.id,
        drawingId: req.params.drawingId,
        pageNumber: req.params.pageNumber
    })

    res.status(200).json({
        success: true,
        data: { artifacts }
    })
})

export const getDrawingReportController = asyncHandler(async (req, res) => {
    const drawing = await getDrawingReport({
        userId: req.user.id,
        drawingId: req.params.drawingId
    })

    res.status(200).json({
        success: true,
        data: {
            drawing
        }
    })
})

export const getRevisionComparisonController = asyncHandler(async (req, res) => {
    const comparison = await getRevisionComparison({
        userId: req.user.id,
        drawingId: req.params.drawingId
    })

    res.status(200).json({
        success: true,
        data: { comparison }
    })
})
