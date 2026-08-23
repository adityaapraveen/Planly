import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet' // helps secure apps by setting various HTTP response headers
import morgan from 'morgan' // logging
import cors from 'cors' // allows us to specify who is allowed to request resources
import { config } from './config/config.js'
import { healthRouter } from './routes/health.routes.js'
import { notfound } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { authRouter } from './routes/auth.routes.js'
import { projectRouter } from './routes/project.routes.js'
import { drawingRouter } from './routes/drawing.routes.js'
import { analysisRouter } from './routes/analysis.routes.js'
import { requestContext } from './middlewares/requestContext.js'
import { apiRateLimit, authRateLimit } from './middlewares/rateLimits.js'
import { assetRouter } from './routes/asset.routes.js'


export const app = express()

app.disable('x-powered-by')
if (config.TRUST_PROXY_HOPS > 0) {
    app.set('trust proxy', config.TRUST_PROXY_HOPS)
}
app.use(requestContext)

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true
}))

app.use(express.json({
    limit: '2mb'
}))

app.use(cookieParser())

if (config.NODE_ENV === 'dev') {
    app.use(morgan('dev'))
}

app.use('/api/v1/health', healthRouter)
app.use('/api/assets', assetRouter)
app.use('/api', apiRateLimit)
app.use('/api/auth', authRateLimit, authRouter)
app.use('/api/projects', projectRouter)
app.use('/api/projects', drawingRouter)
app.use('/api', analysisRouter)

app.use(notfound)
app.use(errorHandler)
