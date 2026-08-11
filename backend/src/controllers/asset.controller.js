import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { verifySignedAssetRequest } from '../utils/asset-url.js'
import { resolveStoredAsset } from '../services/local-storage.service.js'

const sendAsset = (res, assetPath, fileName) => {
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
    )
    res.sendFile(resolveStoredAsset(assetPath))
}

export const getDrawingFile = asyncHandler(async (req, res) => {
    verifySignedAssetRequest({
        drawingId: req.params.drawingId,
        assetType: 'drawing',
        expires: req.query.expires,
        signature: req.query.signature
    })

    const drawing = await prisma.drawing.findUnique({
        where: { id: req.params.drawingId },
        select: { filePath: true, fileName: true }
    })

    if (!drawing) throw new AppError('Drawing not found', 404)
    sendAsset(res, drawing.filePath, drawing.fileName)
})

export const getDrawingPageImage = asyncHandler(async (req, res) => {
    const pageNumber = Number(req.params.pageNumber)

    verifySignedAssetRequest({
        drawingId: req.params.drawingId,
        assetType: 'page',
        pageNumber,
        expires: req.query.expires,
        signature: req.query.signature
    })

    const page = await prisma.drawingPage.findFirst({
        where: {
            drawingId: req.params.drawingId,
            pageNumber
        },
        select: { imagePath: true, imageName: true }
    })

    if (!page) throw new AppError('Drawing page not found', 404)
    sendAsset(res, page.imagePath, page.imageName)
})
