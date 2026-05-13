import { asyncHandler } from '../middlewares/asyncHandler.js'

import { getProjectDrawings, uploadProjectDrawing, deleteProjectDrawing, getDrawingReport } from '../services/drawing.service.js'

import { addAnalysisJob } from '../queues/analysis.queue.js'

export const uploadDrawingController = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'PDF file is required'
        })
    }

    const drawing = await uploadProjectDrawing({
        userId: req.user.id,
        projectId: req.params.projectId,
        file: req.file
    })

    await addAnalysisJob({
        drawingId: drawing.id,
        userId: req.user.id
    })

    res.status(202).json({
        success: true,
        message: 'Drawing uploaded successfully, Analysis has started',

        data: {
            drawing
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
