import crypto from 'crypto'

export const requestContext = (req, res, next) => {
    const incomingRequestId = req.get('x-request-id')
    req.id = incomingRequestId?.slice(0, 100) || crypto.randomUUID()
    res.setHeader('x-request-id', req.id)
    next()
}
