import { Queue } from 'bullmq'
import { redisConnection } from '../config/redis'

export const analysisQueue = new Queue('analysis-queue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 3000
        },
        removeOnComplete: {
            age: 60 * 60,
            count: 100
        },
        removeOnFail: {
            age: 24 * 60 * 60
        }

    }
})

export const addAnalysisJob = async ({ drawingId, userId }) => {
    return analysisQueue.add(
        'analyze-drawing',
        {
            drawingId,
            userId
        },
        {
            jobId: `drawing-${drawingId}`
        }
    )
}