import fs from 'fs/promises'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

import { prisma } from '../config/prisma.js'
import { deleteStoredAssets } from './local-storage.service.js'

export const HIGH_RESOLUTION_REGION_VERSION = 'page-regions-v1'

const OUTPUT_DIR = 'uploads/rendered-regions'
const GRID_COLUMNS = 3
const GRID_ROWS = 2
const GRID_OVERLAP_X = 0.025
const GRID_OVERLAP_Y = 0.04
const TARGET_REGION_PIXELS = 2048
const MIN_RENDER_DPI = 72
const MAX_RENDER_DPI = 400
const execFileAsync = promisify(execFile)

const round = (value, precision = 6) => {
    const factor = 10 ** precision
    return Math.round(value * factor) / factor
}
const clamp = (value, minimum, maximum) =>
    Math.max(minimum, Math.min(maximum, value))

const regionGeometry = ({ key, kind, x, y, right, bottom, pageWidth, pageHeight }) => {
    const width = right - x
    const height = bottom - y
    const widthPoints = width * pageWidth
    const heightPoints = height * pageHeight
    const dpi = Math.round(clamp(
        (TARGET_REGION_PIXELS * 72) / Math.max(widthPoints, heightPoints),
        MIN_RENDER_DPI,
        MAX_RENDER_DPI
    ))
    const pixelsPerPoint = dpi / 72

    return {
        key,
        kind,
        version: HIGH_RESOLUTION_REGION_VERSION,
        x: round(x),
        y: round(y),
        width: round(width),
        height: round(height),
        dpi,
        crop: {
            x: Math.max(0, Math.floor(x * pageWidth * pixelsPerPoint)),
            y: Math.max(0, Math.floor(y * pageHeight * pixelsPerPoint)),
            width: Math.max(1, Math.ceil(widthPoints * pixelsPerPoint)),
            height: Math.max(1, Math.ceil(heightPoints * pixelsPerPoint))
        }
    }
}

export const buildPageRegionDefinitions = ({ pageWidth, pageHeight }) => {
    if (!Number.isFinite(pageWidth) || pageWidth <= 0 ||
        !Number.isFinite(pageHeight) || pageHeight <= 0) {
        throw new Error('Page dimensions must be positive finite numbers')
    }

    const regions = []
    for (let row = 0; row < GRID_ROWS; row += 1) {
        for (let column = 0; column < GRID_COLUMNS; column += 1) {
            const x = Math.max(0, (column / GRID_COLUMNS) - GRID_OVERLAP_X)
            const y = Math.max(0, (row / GRID_ROWS) - GRID_OVERLAP_Y)
            const right = Math.min(1, ((column + 1) / GRID_COLUMNS) + GRID_OVERLAP_X)
            const bottom = Math.min(1, ((row + 1) / GRID_ROWS) + GRID_OVERLAP_Y)
            regions.push(regionGeometry({
                key: `grid-r${row + 1}-c${column + 1}`,
                kind: 'GRID',
                x,
                y,
                right,
                bottom,
                pageWidth,
                pageHeight
            }))
        }
    }

    regions.push(regionGeometry({
        key: 'title-block-default',
        kind: 'TITLE_BLOCK',
        x: 0.62,
        y: 0.58,
        right: 1,
        bottom: 1,
        pageWidth,
        pageHeight
    }))

    return regions
}

export const buildPdftoppmRegionArgs = ({ pdfPath, pageNumber, region, outputPrefix }) => [
    '-f', String(pageNumber),
    '-l', String(pageNumber),
    '-png',
    '-singlefile',
    '-r', String(region.dpi),
    '-x', String(region.crop.x),
    '-y', String(region.crop.y),
    '-W', String(region.crop.width),
    '-H', String(region.crop.height),
    pdfPath,
    outputPrefix
]

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}

const readPngDimensions = async (filePath) => {
    const handle = await fs.open(filePath, 'r')
    try {
        const header = Buffer.alloc(24)
        const { bytesRead } = await handle.read(header, 0, header.length, 0)
        const pngSignature = '89504e470d0a1a0a'
        if (bytesRead !== header.length || header.subarray(0, 8).toString('hex') !== pngSignature) {
            throw new Error('Rendered region is not a valid PNG')
        }
        return {
            pixelWidth: header.readUInt32BE(16),
            pixelHeight: header.readUInt32BE(20)
        }
    } finally {
        await handle.close()
    }
}

const renderRegion = async ({ drawingId, pdfPath, pageNumber, region }) => {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    const imageName = `${drawingId}-page-${pageNumber}-${region.key}-${region.version}.png`
    const imagePath = path.join(OUTPUT_DIR, imageName).replaceAll('\\', '/')
    const outputPrefix = imagePath.slice(0, -path.extname(imagePath).length)

    await execFileAsync('pdftoppm', buildPdftoppmRegionArgs({
        pdfPath,
        pageNumber,
        region,
        outputPrefix
    }))

    if (!await fileExists(imagePath)) {
        throw new Error('High-resolution renderer did not produce the expected region')
    }

    return {
        imageName,
        imagePath,
        ...await readPngDimensions(imagePath)
    }
}

const publicRegion = (region) => ({
    id: region.id,
    pageId: region.pageId,
    key: region.key,
    kind: region.kind,
    version: region.version,
    status: region.status,
    error: region.error,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    dpi: region.dpi,
    pixelWidth: region.pixelWidth,
    pixelHeight: region.pixelHeight,
    imagePath: region.imagePath,
    imageName: region.imageName
})

export const ensureHighResolutionRegions = async ({ drawingId, pdfPath, pages }) => {
    const pageIds = pages.map((page) => page.id)
    const existing = await prisma.drawingPageRegion.findMany({
        where: { pageId: { in: pageIds } }
    })
    const existingByIdentity = new Map(existing.map((region) => [
        `${region.pageId}:${region.key}`,
        region
    ]))

    for (const page of pages) {
        const dimensions = page.nativeArtifacts?.page
        if (!dimensions?.width || !dimensions?.height) continue

        const definitions = buildPageRegionDefinitions({
            pageWidth: dimensions.width,
            pageHeight: dimensions.height
        })
        for (const definition of definitions) {
            const identity = `${page.id}:${definition.key}`
            const previous = existingByIdentity.get(identity)
            const reusable = previous?.status === 'AVAILABLE' &&
                previous.version === HIGH_RESOLUTION_REGION_VERSION &&
                previous.imagePath && await fileExists(previous.imagePath)
            if (reusable) continue

            const pending = await prisma.drawingPageRegion.upsert({
                where: { pageId_key: { pageId: page.id, key: definition.key } },
                create: {
                    pageId: page.id,
                    key: definition.key,
                    kind: definition.kind,
                    version: definition.version,
                    status: 'PENDING',
                    x: definition.x,
                    y: definition.y,
                    width: definition.width,
                    height: definition.height,
                    dpi: definition.dpi,
                    pixelWidth: definition.crop.width,
                    pixelHeight: definition.crop.height
                },
                update: {
                    kind: definition.kind,
                    version: definition.version,
                    status: 'PENDING',
                    error: null,
                    x: definition.x,
                    y: definition.y,
                    width: definition.width,
                    height: definition.height,
                    dpi: definition.dpi,
                    pixelWidth: definition.crop.width,
                    pixelHeight: definition.crop.height
                }
            })

            try {
                const rendered = await renderRegion({
                    drawingId,
                    pdfPath,
                    pageNumber: page.pageNumber,
                    region: definition
                })
                await prisma.drawingPageRegion.update({
                    where: { id: pending.id },
                    data: {
                        ...rendered,
                        status: 'AVAILABLE',
                        error: null
                    }
                })
                if (previous?.imagePath && previous.imagePath !== rendered.imagePath) {
                    await deleteStoredAssets([previous.imagePath])
                }
            } catch {
                await prisma.drawingPageRegion.update({
                    where: { id: pending.id },
                    data: {
                        status: 'FAILED',
                        error: 'High-resolution region rendering failed'
                    }
                })
            }
        }
    }

    const regions = await prisma.drawingPageRegion.findMany({
        where: { pageId: { in: pageIds } },
        orderBy: [{ pageId: 'asc' }, { key: 'asc' }]
    })
    const regionsByPage = new Map()
    for (const region of regions) {
        const values = regionsByPage.get(region.pageId) || []
        values.push(publicRegion(region))
        regionsByPage.set(region.pageId, values)
    }

    return pages.map((page) => ({
        ...page,
        regions: regionsByPage.get(page.id) || []
    }))
}
