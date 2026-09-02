import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import {
    assertPdfFile,
    deleteStoredAssets
} from './local-storage.service.js'
import { createSignedAssetUrl } from '../utils/asset-url.js'
import { serializeAnalysis } from './analysis.service.js'
import { createSheetIndex } from './sheet-index.service.js'
import { createReferenceGraph } from './sheet-reference.service.js'

const DRAWING_PAGES_TABLE = 'public.drawing_pages'

const isMissingDrawingPagesTableError = (error) =>
    error?.message?.includes(DRAWING_PAGES_TABLE)

export const uploadProjectDrawing = async ({ userId, projectId, file, revisionOfId = null }) => {
    if (revisionOfId && (typeof revisionOfId !== 'string' || revisionOfId.length > 100)) {
        await deleteStoredAssets([file.path])
        throw new AppError('Invalid previous revision drawing', 400)
    }

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

    if (revisionOfId) {
        const previousRevision = await prisma.drawing.findFirst({
            where: {
                id: revisionOfId,
                projectId,
                project: { userId }
            },
            select: { id: true }
        })

        if (!previousRevision) {
            await deleteStoredAssets([file.path])
            throw new AppError('Previous revision drawing not found in this project', 400)
        }
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
                revisionOfId: revisionOfId || null,
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
            updatedAt: true,
            revisionOfId: true,
            revisionOf: {
                select: {
                    id: true,
                    fileName: true,
                    createdAt: true
                }
            }
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

export const getDrawingPageArtifacts = async ({ userId, drawingId, pageNumber }) => {
    const normalizedPageNumber = Number(pageNumber)
    if (!Number.isInteger(normalizedPageNumber) || normalizedPageNumber < 1) {
        throw new AppError('Invalid page number', 400)
    }

    const page = await prisma.drawingPage.findFirst({
        where: {
            drawingId,
            pageNumber: normalizedPageNumber,
            drawing: { project: { userId } }
        },
        select: {
            id: true,
            drawingId: true,
            pageNumber: true,
            nativeText: true,
            nativeArtifacts: true,
            nativeExtractionStatus: true,
            nativeExtractionVersion: true,
            nativeExtractionError: true,
            nativeExtractedAt: true
        }
    })

    if (!page) throw new AppError('Drawing page not found', 404)

    return {
        pageId: page.id,
        drawingId: page.drawingId,
        pageNumber: page.pageNumber,
        status: page.nativeExtractionStatus,
        version: page.nativeExtractionVersion,
        extractedAt: page.nativeExtractedAt,
        error: page.nativeExtractionError,
        text: page.nativeText,
        page: page.nativeArtifacts?.page || null,
        items: page.nativeArtifacts?.items || [],
        stats: page.nativeArtifacts?.stats || null
    }
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
                        ],
                        include: {
                            reviewEvents: {
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    reviewer: { select: { id: true, name: true } }
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    let pages = []
    let sheetReferences = []

    try {
        pages = await prisma.drawingPage.findMany({
            where: {
                drawingId
            },
            orderBy: {
                pageNumber: 'asc'
            },
            include: { sheet: true }
        })
        sheetReferences = await prisma.sheetReference.findMany({
            where: {
                sourcePage: { drawingId }
            },
            orderBy: [
                { sourcePage: { pageNumber: 'asc' } },
                { createdAt: 'asc' }
            ],
            include: {
                sourcePage: {
                    include: { sheet: true }
                },
                targetSheet: {
                    include: { page: true }
                }
            }
        })
    } catch (error) {
        if (!isMissingDrawingPagesTableError(error)) {
            throw error
        }
    }

    const normalizedPages = pages.map((page) => {
        const normalized = {
            id: page.id,
            drawingId: page.drawingId,
            pageNumber: page.pageNumber,
            imageName: page.imageName,
            createdAt: page.createdAt,
            imageUrl: createSignedAssetUrl({
                drawingId: drawing.id,
                assetType: 'page',
                pageNumber: page.pageNumber
            }),
            nativeExtraction: {
                status: page.nativeExtractionStatus,
                version: page.nativeExtractionVersion,
                extractedAt: page.nativeExtractedAt,
                error: page.nativeExtractionError,
                textAvailable: Boolean(page.nativeText),
                page: page.nativeArtifacts?.page || null,
                stats: page.nativeArtifacts?.stats || null
            }
        }

        return normalized
    })

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
        revisionOfId: drawing.revisionOfId,
        createdAt: drawing.createdAt,
        updatedAt: drawing.updatedAt,
        analysis: serializeAnalysis(drawing.analyses?.[0]),
        fileUrl,
        pages: normalizedPages,
        sheetIndex: createSheetIndex(pages),
        referenceGraph: createReferenceGraph(sheetReferences)
    }
}
