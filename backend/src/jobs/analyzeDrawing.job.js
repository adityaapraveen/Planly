import { analyzeDrawing } from '../services/analysis.service.js'

export const analyzeDrawingJob = async (job) => {
    const { drawingId, userId, reviewMode } = job.data

    console.log(`Starting analysis for drawing: ${drawingId}`)

    const analysis = await analyzeDrawing({
        drawingId,
        userId,
        reviewMode
    })

    console.log(`Completed analysis for drawing: ${drawingId}`)

    return {
        analysisId: analysis.id,
        drawingId,
        reviewMode
    }
}
