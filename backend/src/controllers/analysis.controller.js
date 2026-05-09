import { asyncHandler } from '../middlewares/asyncHandler.js'

import { analyzeDrawing, getDrawingAnalysis } from '../services/analysis.service.js'

export const analyzeDrawingController = asyncHandler(async (req, res) => {
    const analysis = await analyzeDrawing({
        userId: req.user.id,
        drawingId: req.params.drawingId
    })

    res.status(200).json({
        success: true,
        message: 'Drawing analysis completed',
        data: {
            analysis
        }
    })
})

export const getDrawingAnalysisController = asyncHandler(async (req, res) => {
    const analysis = await getDrawingAnalysis({
        userId: req.user.id,
        drawingId: req.params.drawingId
    })

    res.status(200).json({
        success: true,
        data: {
            analysis
        }
    })
})