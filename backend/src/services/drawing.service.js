import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import fs from 'fs/promises'
import path from 'path'

const DRAWING_PAGES_TABLE = 'public.drawing_pages'

const isMissingDrawingPagesTableError = (error) =>
    error?.message?.includes(DRAWING_PAGES_TABLE)

const toPublicUploadsPath = (assetPath, fallbackDir = 'uploads') => {
    const normalized = String(assetPath || '').replaceAll('\\', '/')
    const uploadsIndex = normalized.indexOf('uploads/')
    if (uploadsIndex >= 0) {
        return normalized.slice(uploadsIndex)
    }

    const fileName = path.basename(normalized)
    return `${fallbackDir}/${fileName}`
}

export const uploadProjectDrawing = async ({ userId, projectId, file }) => {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId
        }
    })
    if (!project) {
        throw new AppError('Project not found', 404)
    }

    const drawing = await prisma.drawing.create({
        data: {
            fileName: file.originalname || file.filename,
            filePath: file.path,
            mimeType: file.mimetype,
            size: file.size,

            projectId,

            status: 'PENDING'
        }
    })

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

    await prisma.drawing.delete({
        where: {
            id: drawingId
        }
    })

    const filePath = drawing.filePath || drawing.fileUrl
    if (filePath) {
        await fs.unlink(filePath).catch(() => null)
    }

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
                take: 1
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
        ...page,
        imagePath: toPublicUploadsPath(page.imagePath, 'uploads/rendered-pages')
    }))

    return {
        ...drawing,
        analysis: drawing.analyses?.[0] || null,
        filePath: toPublicUploadsPath(drawing.filePath || drawing.fileUrl, 'uploads/drawings'),
        pages: normalizedPages
    }
}
