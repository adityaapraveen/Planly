import IORedis from 'ioredis'
import { config } from './config.js'

export const redisConnection = new IORedis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null
})