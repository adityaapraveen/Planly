import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

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
            fileName: file.originalName,
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