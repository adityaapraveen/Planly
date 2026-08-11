import { app } from "./app.js";
import { config } from "./config/config.js";
import { prisma } from './config/prisma.js'
import {
    recoverInterruptedAnalyses,
    waitForActiveAnalyses
} from './services/analysis-runner.service.js'

const server = app.listen(config.PORT, () => {
    console.log('Server running at PORT: ', config.PORT)
})

recoverInterruptedAnalyses().catch((error) => {
    console.error('Could not recover interrupted analyses', error)
})

let shuttingDown = false

const shutdown = (signal) => {
    if (shuttingDown) return
    shuttingDown = true

    console.log(`${signal} received; finishing active requests`)

    server.close(async () => {
        await Promise.race([
            waitForActiveAnalyses(),
            new Promise((resolve) => setTimeout(resolve, 30_000))
        ])
        await prisma.$disconnect()
        process.exit(0)
    })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
