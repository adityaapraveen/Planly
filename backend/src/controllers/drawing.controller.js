import { asyncHandler } from '../middlewares/asyncHandler.js'

import { getProjectDrawings, uploadProjectDrawing } from '../services/drawing.service.js'

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

    res.status(201).json({
        success: true,
        message: 'Drawing uploaded successfully',

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