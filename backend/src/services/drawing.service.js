import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import fs from 'fs/promises'

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
            fileUrl: file.path,
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

    if (drawing.fileUrl) {
        await fs.unlink(drawing.fileUrl).catch(() => null)
    }

    return null
}
