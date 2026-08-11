import { prisma } from '../config/prisma.js'
import { processAnalysisRun } from './analysis.service.js'

const MAX_CONCURRENT_ANALYSES = 2
const activeAnalyses = new Map()
const pendingAnalyses = []
const pendingAnalysisIds = new Set()

const runNextAnalyses = () => {
    while (
        activeAnalyses.size < MAX_CONCURRENT_ANALYSES &&
        pendingAnalyses.length > 0
    ) {
        const request = pendingAnalyses.shift()
        pendingAnalysisIds.delete(request.analysisId)

        const task = Promise.resolve()
            .then(() => processAnalysisRun(request))
            .then(() => {
                console.log(`Analysis completed: ${request.analysisId}`)
            })
            .catch((error) => {
                console.error(`Analysis failed for drawing ${request.drawingId}`, {
                    analysisId: request.analysisId,
                    message: error?.message,
                    status: error?.status,
                    code: error?.code,
                    providerMessage:
                        error?.error?.metadata?.raw ||
                        error?.error?.message
                })
            })
            .finally(() => {
                activeAnalyses.delete(request.analysisId)
                runNextAnalyses()
            })

        activeAnalyses.set(request.analysisId, task)
    }
}

/**
 * Schedules a persisted analysis run without holding the HTTP request open.
 * PostgreSQL stores the run state; this process only limits local concurrency.
 */
export const startAnalysis = ({ analysisId, drawingId, userId }) => {
    if (
        activeAnalyses.has(analysisId) ||
        pendingAnalysisIds.has(analysisId)
    ) {
        return false
    }

    pendingAnalysisIds.add(analysisId)
    pendingAnalyses.push({ analysisId, drawingId, userId })
    queueMicrotask(runNextAnalyses)
    return true
}

export const recoverInterruptedAnalyses = async () => {
    const interruptedRuns = await prisma.analysis.findMany({
        where: {
            status: { in: ['PENDING', 'PROCESSING'] }
        },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            drawingId: true,
            drawing: {
                select: {
                    project: {
                        select: { userId: true }
                    }
                }
            }
        }
    })

    for (const run of interruptedRuns) {
        startAnalysis({
            analysisId: run.id,
            drawingId: run.drawingId,
            userId: run.drawing.project.userId
        })
    }

    if (interruptedRuns.length > 0) {
        console.log(`Recovered ${interruptedRuns.length} interrupted analysis run(s)`)
    }
}

export const waitForActiveAnalyses = () =>
    Promise.allSettled([...activeAnalyses.values()])
