import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import {
    assertPdfFile,
    deleteStoredAssets
} from './local-storage.service.js'
import { createSignedAssetUrl } from '../utils/asset-url.js'
import { serializeAnalysis } from './analysis.service.js'

const DRAWING_PAGES_TABLE = 'public.drawing_pages'

const isMissingDrawingPagesTableError = (error) =>
    error?.message?.includes(DRAWING_PAGES_TABLE)

export const uploadProjectDrawing = async ({ userId, projectId, file }) => {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId
        }
    })
    if (!project) {
        await deleteStoredAssets([file.path])
        throw new AppError('Project not found', 404)
    }

    try {
        await assertPdfFile(file.path)
    } catch (error) {
        await deleteStoredAssets([file.path])
        throw error
    }

    let drawing

    try {
        drawing = await prisma.drawing.create({
            data: {
                fileName: file.originalname || file.filename,
                filePath: file.path,
                mimeType: file.mimetype,
                size: file.size,
                projectId,
                status: 'PENDING'
            }
        })
    } catch (error) {
        await deleteStoredAssets([file.path])
        throw error
    }

    return drawing
}

export const getProjectDrawings = async ({ userId, projectId }) => {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId
        }
    })

    if (!project) {
        throw new AppError('Project not found', 404)
    }

    return prisma.drawing.findMany({
        where: {
            projectId
        },
        select: {
            id: true,
            fileName: true,
            mimeType: true,
            size: true,
            status: true,
            projectId: true,
            createdAt: true,
            updatedAt: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export const deleteProjectDrawing = async ({ userId, projectId, drawingId }) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            projectId,
            project: {
                userId
            }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    let pages = []

    try {
        pages = await prisma.drawingPage.findMany({
            where: { drawingId },
            select: { imagePath: true }
        })
    } catch (error) {
        if (!isMissingDrawingPagesTableError(error)) throw error
    }

    await prisma.drawing.delete({
        where: {
            id: drawingId
        }
    })

    await deleteStoredAssets([
        drawing.filePath,
        ...pages.map((page) => page.imagePath)
    ])

    return null
}

export const getDrawingReport = async ({ userId, drawingId }) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: {
                userId
            }
        },
        include: {
            analyses: {
                where: {
                    reviewMode: 'SUBMISSION_READINESS'
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 1,
                include: {
                    issues: {
                        orderBy: [
                            { page: 'asc' },
                            { createdAt: 'asc' }
                        ]
                    }
                }
            }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    let pages = []

    try {
        pages = await prisma.drawingPage.findMany({
            where: {
                drawingId
            },
            orderBy: {
                pageNumber: 'asc'
            }
        })
    } catch (error) {
        if (!isMissingDrawingPagesTableError(error)) {
            throw error
        }
    }

    const normalizedPages = pages.map((page) => ({
        id: page.id,
        drawingId: page.drawingId,
        pageNumber: page.pageNumber,
        imageName: page.imageName,
        createdAt: page.createdAt,
        imageUrl: createSignedAssetUrl({
            drawingId: drawing.id,
            assetType: 'page',
            pageNumber: page.pageNumber
        })
    }))

    const fileUrl = createSignedAssetUrl({
        drawingId: drawing.id,
        assetType: 'drawing'
    })

    return {
        id: drawing.id,
        fileName: drawing.fileName,
        mimeType: drawing.mimeType,
        size: drawing.size,
        status: drawing.status,
        projectId: drawing.projectId,
        createdAt: drawing.createdAt,
        updatedAt: drawing.updatedAt,
        analysis: serializeAnalysis(drawing.analyses?.[0]),
        fileUrl,
        pages: normalizedPages
    }
}
