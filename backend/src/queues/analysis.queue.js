import { Queue } from 'bullmq'
import { redisConnection } from '../config/redis.js'

export const analysisQueue = new Queue('analysis-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: {
            age: 60 * 60,
            count: 100
        },
        removeOnFail: {
            age: 24 * 60 * 60
        }
    }
})

export const addAnalysisJob = async ({
    drawingId,
    userId,
    reviewMode = 'SUBMISSION_READINESS'
}) => {
    const jobId = `drawing-${drawingId}-${reviewMode}`
    const existingJob = await analysisQueue.getJob(jobId)

    if (existingJob) {
        const state = await existingJob.getState()

        if (state === 'failed' || state === 'completed') {
            await existingJob.remove()
        } else {
            return existingJob
        }
    }

    return analysisQueue.add(
        'analyze-drawing',
        {
            drawingId,
            userId,
            reviewMode
        },
        {
            jobId
        }
    )
}
