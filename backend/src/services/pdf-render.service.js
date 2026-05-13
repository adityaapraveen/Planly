import path from 'path'
import fs from 'fs/promises'
import { execFile } from 'child_process'
import { promisify } from 'util'

import { fromPath } from 'pdf2pic'

import { prisma } from '../config/prisma.js'

const OUTPUT_DIR = 'uploads/rendered-pages'
const DRAWING_PAGES_TABLE = 'public.drawing_pages'
const execFileAsync = promisify(execFile)

const isMissingDrawingPagesTableError = (error) =>
    error?.message?.includes(DRAWING_PAGES_TABLE)

const toPublicImagePath = (imagePath) => {
    const normalized = String(imagePath || '').replaceAll('\\', '/')
    const uploadsIndex = normalized.indexOf('uploads/')
    if (uploadsIndex >= 0) {
        return normalized.slice(uploadsIndex)
    }

    const imageName = path.basename(normalized)
    return `uploads/rendered-pages/${imageName}`
}

const isGraphicsMagickDependencyError = (error) =>
    String(error?.message || '').includes('Could not execute GraphicsMagick/ImageMagick')

const renderWithPdf2Pic = async ({ drawingPath, pdfPath }) => {
    const fileBaseName = path.basename(drawingPath, path.extname(drawingPath))

    const convert = fromPath(pdfPath, {
        density: 180,
        saveFilename: fileBaseName,
        savePath: OUTPUT_DIR,
        format: 'png',
        width: 1800,
        height: 1800
    })

    const pages = await convert.bulk(-1)

    return pages.map((page) => ({
        pageNumber: Number(page.page),
        imagePath: toPublicImagePath(page.path),
        imageName: path.basename(page.path)
    }))
}

const renderWithPdftoppm = async ({ drawingPath, pdfPath }) => {
    const fileBaseName = path.basename(drawingPath, path.extname(drawingPath))
    const outputPrefix = path.join(OUTPUT_DIR, `${fileBaseName}-page`)

    await execFileAsync('pdftoppm', [
        '-png',
        '-r', '180',
        pdfPath,
        outputPrefix
    ])

    const files = await fs.readdir(OUTPUT_DIR)
    const targetPrefix = `${fileBaseName}-page-`

    const imageFiles = files
        .filter((name) => name.startsWith(targetPrefix) && name.endsWith('.png'))
        .sort((left, right) => {
            const leftNum = Number(left.replace(targetPrefix, '').replace('.png', ''))
            const rightNum = Number(right.replace(targetPrefix, '').replace('.png', ''))
            return leftNum - rightNum
        })

    if (imageFiles.length === 0) {
        throw new Error('pdftoppm did not produce any PNG pages')
    }

    return imageFiles.map((fileName, index) => {
        const imagePath = `uploads/rendered-pages/${fileName}`
        return {
            pageNumber: index + 1,
            imagePath,
            imageName: fileName
        }
    })
}

export const renderPdfPages = async ({ drawingId, pdfPath }) => {
    let existingPages = []
    let canPersistPages = true

    try {
        existingPages = await prisma.drawingPage.findMany({
            where: {
                drawingId
            },
            orderBy: {
                pageNumber: 'asc'
            }
        })
    } catch (error) {
        if (isMissingDrawingPagesTableError(error)) {
            canPersistPages = false
            existingPages = []
        } else {
            throw error
        }
    }

    if (existingPages.length > 0) {
        return existingPages
    }
    
    const drawing = await prisma.drawing.findUnique({
        where: {
            id: drawingId
        }
    })
    if (!drawing) {
        throw new Error('Drawing not found', 404)
    }

    await fs.mkdir(OUTPUT_DIR, {
        recursive: true
    })

    let renderedPages

    try {
        renderedPages = await renderWithPdf2Pic({
            drawingPath: drawing.filePath,
            pdfPath
        })
    } catch (error) {
        if (!isGraphicsMagickDependencyError(error)) {
            throw error
        }

        renderedPages = await renderWithPdftoppm({
            drawingPath: drawing.filePath,
            pdfPath
        })
    }

    const drawingPages = []

    for (const page of renderedPages) {
        const pageNumber = page.pageNumber
        const imagePath = page.imagePath
        const imageName = page.imageName

        const drawingPage = canPersistPages
            ? await prisma.drawingPage.create({
                data: {
                    drawingId,

                    pageNumber,

                    imagePath,

                    imageName
                }
            })
            : {
                id: `${drawingId}-${pageNumber}`,
                drawingId,
                pageNumber,
                imagePath,
                imageName
            }

        drawingPages.push(drawingPage)
    }

    return drawingPages
}
