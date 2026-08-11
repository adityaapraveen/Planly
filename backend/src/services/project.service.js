import { prisma } from "../config/prisma.js"
import { AppError } from "../utils/AppError.js"
import { deleteStoredAssets } from './local-storage.service.js'

export const createProject = async ({ userId, name, description }) => {
    return prisma.project.create({
        data: {
            name,
            description,
            userId
        }
    })
}

export const getUserProjects = async ({ userId }) => {
    const projects = await prisma.project.findMany({
        where: {
            userId
        },
        include: {
            drawings: {
                select: {
                    id: true,
                    analyses: {
                        where: {
                            reviewMode: 'SUBMISSION_READINESS',
                            status: 'COMPLETED'
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return projects.map((project) => ({
        ...project,
        drawings: project.drawings.map((drawing) => ({
            id: drawing.id,
            analysis: drawing.analyses?.[0] || null
        }))
    }))
}

export const getProjectById = async ({ userId, projectId }) => {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId
        }
    })

    if (!project) {
        throw new AppError('Project not found', 404)
    }
    return project
}

export const updateProject = async ({ userId, projectId, name, description }) => {
    await getProjectById({ userId, projectId })

    return prisma.project.update({
        where: {
            id: projectId
        },
        data: {
            name,
            description
        }
    })
}

export const deleteProject = async ({ userId, projectId }) => {
    await getProjectById({ userId, projectId })

    const drawings = await prisma.drawing.findMany({
        where: { projectId },
        select: {
            filePath: true,
            pages: {
                select: { imagePath: true }
            }
        }
    })

    await prisma.project.delete({
        where: {
            id: projectId
        }
    })

    await deleteStoredAssets(drawings.flatMap((drawing) => [
        drawing.filePath,
        ...drawing.pages.map((page) => page.imagePath)
    ])).catch((error) => {
        console.error('Project database record deleted, but some local assets could not be removed', {
            projectId,
            message: error?.message
        })
    })

    return null
}
