import { analyzeDrawing } from './analysis.service.js'

const activeAnalyses = new Map()

/**
 * Starts analysis without holding the HTTP request open.
 *
 * This is intentionally process-local. It is suitable while the API runs as a
 * single instance, but it does not survive restarts or coordinate across
 * multiple server instances. Use a durable job system again if those
 * guarantees become necessary.
 */
export const startAnalysis = ({
    drawingId,
    userId,
    reviewMode = 'SUBMISSION_READINESS'
}) => {
    // A drawing has one shared status field, so only one of its review modes
    // can be processed at a time without reporting misleading state.
    const analysisKey = drawingId

    if (activeAnalyses.has(analysisKey)) {
        return false
    }

    const analysisTask = Promise.resolve()
        .then(() => analyzeDrawing({ drawingId, userId, reviewMode }))
        .then((analysis) => {
            console.log(`Analysis completed: ${analysis.id}`)
        })
        .catch((error) => {
            console.error(`Analysis failed for drawing ${drawingId}`, {
                message: error?.message,
                status: error?.status,
                code: error?.code,
                providerMessage:
                    error?.error?.metadata?.raw ||
                    error?.error?.message
            })
        })
        .finally(() => {
            activeAnalyses.delete(analysisKey)
        })

    activeAnalyses.set(analysisKey, analysisTask)

    return true
}
