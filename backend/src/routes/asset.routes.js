import express from 'express'
import {
    getDrawingFile,
    getDrawingPageImage,
    getDrawingRegionImage
} from '../controllers/asset.controller.js'

export const assetRouter = express.Router()

assetRouter.get('/drawings/:drawingId/file', getDrawingFile)
assetRouter.get('/drawings/:drawingId/pages/:pageNumber', getDrawingPageImage)
assetRouter.get('/drawings/:drawingId/regions/:regionId', getDrawingRegionImage)
