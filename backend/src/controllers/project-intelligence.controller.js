import { z } from 'zod'
import { asyncHandler } from '../middlewares/asyncHandler.js'
import {
    askProjectQuestion,
    getProjectQuestions,
    searchProjectEvidence
} from '../services/project-intelligence.service.js'
import {
    getProjectCheckReport,
    updateProjectCheckSetting
} from '../services/project-check.service.js'
import {
    getEvidenceIndexStatus,
    syncProjectEvidenceIndex
} from '../services/evidence-index.service.js'

const searchSchema = z.object({
    q: z.string().trim().min(2).max(500)
})

const questionSchema = z.object({
    question: z.string().trim().min(3).max(1000)
}).strict()

const checkSettingSchema = z.object({
    enabled: z.boolean().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
}).strict().refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one check setting is required' }
)

export const searchProjectController = asyncHandler(async (req, res) => {
    const { q } = searchSchema.parse(req.query)
    const result = await searchProjectEvidence({
        userId: req.user.id,
        projectId: req.params.projectId,
        query: q
    })

    res.status(200).json({ success: true, data: result })
})

export const askProjectQuestionController = asyncHandler(async (req, res) => {
    const { question } = questionSchema.parse(req.body)
    const answer = await askProjectQuestion({
        userId: req.user.id,
        projectId: req.params.projectId,
        question
    })

    res.status(201).json({
        success: true,
        message: answer.status === 'INSUFFICIENT_EVIDENCE'
            ? 'The indexed evidence was insufficient'
            : 'Question answered from project evidence',
        data: { answer }
    })
})

export const getProjectQuestionsController = asyncHandler(async (req, res) => {
    const questions = await getProjectQuestions({
        userId: req.user.id,
        projectId: req.params.projectId
    })
    res.status(200).json({ success: true, data: { questions } })
})

export const getProjectChecksController = asyncHandler(async (req, res) => {
    const report = await getProjectCheckReport({
        userId: req.user.id,
        projectId: req.params.projectId
    })
    res.status(200).json({ success: true, data: { report } })
})

export const updateProjectCheckController = asyncHandler(async (req, res) => {
    const changes = checkSettingSchema.parse(req.body)
    const report = await updateProjectCheckSetting({
        userId: req.user.id,
        projectId: req.params.projectId,
        checkKey: req.params.checkKey,
        ...changes
    })
    res.status(200).json({
        success: true,
        message: 'Project check setting updated',
        data: { report }
    })
})

export const getEvidenceIndexStatusController = asyncHandler(async (req, res) => {
    const index = await getEvidenceIndexStatus({
        userId: req.user.id,
        projectId: req.params.projectId
    })
    res.status(200).json({ success: true, data: { index } })
})

export const syncEvidenceIndexController = asyncHandler(async (req, res) => {
    const index = await syncProjectEvidenceIndex({
        userId: req.user.id,
        projectId: req.params.projectId
    })
    res.status(200).json({
        success: true,
        message: index.retrievalMode === 'HYBRID'
            ? 'Project context indexed for hybrid retrieval'
            : 'Project context indexed with lexical retrieval',
        data: { index }
    })
})
