import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'

import {
    createProject,
    deleteProject,
    getProjectById,
    getUserProjects,
    updateProject
} from '../services/project.service.js'

const createProjectSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional()
})

const updateProjectSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional()
})

export const createProjectController = asyncHandler(async (req, res) => {
    const payload = createProjectSchema.parse(req.body)

    const project = await createProject({
        userId: req.user.id,
        name: payload.name,
        description: payload.description
    })

    res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: {
            project
        }
    })
})

export const getProjectsController = asyncHandler(async (req, res) => {
    const projects = await getUserProjects({
        userId: req.user.id
    })

    res.status(200).json({
        success: true,
        data: {
            projects
        }
    })
})

export const getProjectController = asyncHandler(async (req, res) => {
    const project = await getProjectById({
        userId: req.user.id,
        projectId: req.params.projectId
    })

    res.status(200).json({
        success: true,
        data: {
            project
        }
    })
})

export const updateProjectController = asyncHandler(async (req, res) => {
    const payload = updateProjectSchema.parse(req.body)

    const project = await updateProject({
        userId: req.user.id,
        projectId: req.params.projectId,
        name: payload.name,
        description: payload.description
    })

    res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: {
            project
        }
    })
})

export const deleteProjectController = asyncHandler(async (req, res) => {
    await deleteProject({
        userId: req.user.id,
        projectId: req.params.projectId
    })

    res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
    })
})
