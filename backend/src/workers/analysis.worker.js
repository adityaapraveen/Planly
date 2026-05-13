import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { analyzeDrawingJob } from "../jobs/analyzeDrawing.job.js";
import { prisma } from "../config/prisma.js";

export const analysisWorker = new Worker(
    'analysis-queue', async (job) => {
        if (job.name === 'analyze-drawing') {
            return analyzeDrawingJob(job)
        }

        throw new Error(`unknown job name: ${job.name} `)
    },

    {
        connection: redisConnection,
        concurrency: 2
    }
)

analysisWorker.on('completed', (job) => {
    console.log(`Analysis job completed: ${job.id}`)
})

analysisWorker.on('failed', async (job, error) => {
    console.error(`Analysis job failed: ${job?.id}`, error.message)

    const drawingId = job?.data?.drawingId

    if (drawingId) {
        try {
            await prisma.drawing.update({
                where: {
                    id: drawingId
                },
                data: {
                    status: 'FAILED'
                }
            })
        } catch (updateError) {
            // The drawing can be deleted while a queued job is still pending.
            if (updateError?.code === 'P2025') {
                console.warn(`Skipping FAILED status update; drawing ${drawingId} no longer exists`)
                return
            }

            throw updateError
        }
    }
})

