import { analyzeDrawing } from '../services/analysis.service.js'

export const analyzeDrawingJob = async (job) => {
    const { drawingId, userId } = job.data

    console.log(`Starting analysis for drawing: ${drawingId}`)

    const analysis = await analyzeDrawing({
        drawingId,
        userId
    })

    console.log(`Completed analysis for drawing: ${drawingId}`)

    return {
        analysisId: analysis.id,
        drawingId
    }
}