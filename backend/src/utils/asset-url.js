import crypto from 'crypto'
import { config } from '../config/config.js'
import { AppError } from './AppError.js'

const sign = (payload) => crypto
    .createHmac('sha256', config.ASSET_SIGNING_SECRET)
    .update(payload)
    .digest('base64url')

const buildPayload = ({ drawingId, assetType, pageNumber, expires }) =>
    [drawingId, assetType, pageNumber || '', expires].join(':')

export const createSignedAssetUrl = ({
    drawingId,
    assetType,
    pageNumber
}) => {
    const expires = Math.floor(Date.now() / 1000) + config.ASSET_URL_TTL_SECONDS
    const payload = buildPayload({ drawingId, assetType, pageNumber, expires })
    const signature = sign(payload)
    const path = assetType === 'drawing'
        ? `/api/assets/drawings/${drawingId}/file`
        : `/api/assets/drawings/${drawingId}/pages/${pageNumber}`

    return `${path}?expires=${expires}&signature=${signature}`
}

export const verifySignedAssetRequest = ({
    drawingId,
    assetType,
    pageNumber,
    expires,
    signature
}) => {
    const expiry = Number(expires)

    if (!Number.isInteger(expiry) || expiry < Math.floor(Date.now() / 1000)) {
        throw new AppError('Asset link has expired', 403)
    }

    const expected = sign(buildPayload({
        drawingId,
        assetType,
        pageNumber,
        expires: expiry
    }))
    const actualBuffer = Buffer.from(String(signature || ''))
    const expectedBuffer = Buffer.from(expected)

    if (
        actualBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
        throw new AppError('Invalid asset link', 403)
    }
}
