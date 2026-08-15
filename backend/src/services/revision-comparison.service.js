import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { createSignedAssetUrl } from '../utils/asset-url.js'
import { buildRevisionComparison } from './revision-comparison.js'

const drawingInclude = {
    pages: {
        orderBy: { pageNumber: 'asc' },
        include: { sheet: true }
    },
    analyses: {
        where: { reviewMode: 'SUBMISSION_READINESS' },
        orderBy: { createdAt: 'desc' },
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

const withPageAssetUrls = (drawing) => ({
    ...drawing,
    pages: drawing.pages.map((page) => ({
        ...page,
        imageUrl: createSignedAssetUrl({
            drawingId: drawing.id,
            assetType: 'page',
            pageNumber: page.pageNumber
        })
    }))
})

export const getRevisionComparison = async ({ userId, drawingId }) => {
    const current = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: { userId }
        },
        include: drawingInclude
    })

    if (!current) throw new AppError('Drawing not found', 404)
    if (!current.revisionOfId) {
        throw new AppError('This drawing is not linked to a previous revision', 409)
    }

    const previous = await prisma.drawing.findFirst({
        where: {
            id: current.revisionOfId,
            projectId: current.projectId,
            project: { userId }
        },
        include: drawingInclude
    })

    if (!previous) {
        throw new AppError('Previous revision is unavailable', 404)
    }

    return buildRevisionComparison({
        previous: withPageAssetUrls(previous),
        current: withPageAssetUrls(current)
    })
}
