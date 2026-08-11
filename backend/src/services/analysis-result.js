import { z } from 'zod'
import { AppError } from '../utils/AppError.js'

const locationSchema = z.object({
    x: z.coerce.number().finite(),
    y: z.coerce.number().finite(),
    width: z.coerce.number().finite(),
    height: z.coerce.number().finite()
})

const issueSchema = z.object({
    title: z.string().trim().min(1).max(240),
    category: z.string().trim().min(1).max(100),
    severity: z.enum(['Low', 'Medium', 'High']),
    confidence: z.coerce.number().finite().min(0).max(1),
    page: z.coerce.number().int().positive(),
    location: locationSchema,
    explanation: z.string().trim().min(1).max(4000),
    recommendation: z.string().trim().min(1).max(4000)
})

const pageAnalysisSchema = z.object({
    score: z.coerce.number().finite().min(0).max(100),
    summary: z.string().trim().min(1).max(4000),
    issues: z.array(issueSchema).max(100)
})

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value)))

const extractJson = (value) => {
    if (value && typeof value === 'object') return value

    const raw = String(value || '').trim()

    try {
        return JSON.parse(raw)
    } catch {
        const start = raw.indexOf('{')
        const end = raw.lastIndexOf('}')

        if (start >= 0 && end > start) {
            try {
                return JSON.parse(raw.slice(start, end + 1))
            } catch {
                // The schema error below intentionally fails the run.
            }
        }
    }

    throw new AppError('AI response was not valid JSON', 502)
}

export const parsePageAnalysis = (value, expectedPageNumber) => {
    const result = pageAnalysisSchema.safeParse(extractJson(value))

    if (!result.success) {
        const error = new AppError('AI response did not match the analysis contract', 502)
        error.code = 'INVALID_AI_RESPONSE'
        error.details = result.error.issues
        throw error
    }

    return {
        score: result.data.score,
        summary: result.data.summary,
        issues: result.data.issues.map((issue) => {
            const location = {
                x: clamp01(issue.location.x),
                y: clamp01(issue.location.y),
                width: clamp01(issue.location.width),
                height: clamp01(issue.location.height)
            }

            return {
                ...issue,
                page: expectedPageNumber,
                location,
                hasLocation: location.width > 0 && location.height > 0
            }
        })
    }
}

const severityWeights = {
    High: 20,
    Medium: 10,
    Low: 4
}

export const calculateOverallScore = (issues) => {
    const totalDeduction = issues.reduce((total, issue) => {
        const severityWeight = severityWeights[issue.severity] || severityWeights.Medium
        const confidenceFactor = 0.5 + (clamp01(issue.confidence) * 0.5)
        return total + (severityWeight * confidenceFactor)
    }, 0)

    return Math.max(0, Math.round(100 - totalDeduction))
}

export const issueToCreateInput = (issue) => ({
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    confidence: issue.confidence,
    page: issue.page,
    x: issue.location.x,
    y: issue.location.y,
    width: issue.location.width,
    height: issue.location.height,
    hasLocation: issue.hasLocation,
    explanation: issue.explanation,
    recommendation: issue.recommendation
})

export const serializeIssue = (issue) => ({
    id: issue.id,
    title: issue.title,
    category: issue.category,
    severity: issue.severity,
    confidence: issue.confidence,
    page: issue.page,
    location: {
        x: issue.x,
        y: issue.y,
        width: issue.width,
        height: issue.height
    },
    hasLocation: issue.hasLocation,
    explanation: issue.explanation,
    recommendation: issue.recommendation,
    status: issue.status
})
