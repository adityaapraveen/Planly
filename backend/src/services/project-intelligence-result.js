import { z } from 'zod'
import { AppError } from '../utils/AppError.js'

const citedAnswerSchema = z.object({
    answer: z.string().trim().min(1).max(8000),
    citationIds: z.array(z.string().trim().min(1).max(200)).max(20),
    confidence: z.coerce.number().finite().min(0).max(1),
    insufficientEvidence: z.boolean()
})

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
                // Contract error below is intentionally user-safe.
            }
        }
    }

    throw new AppError('AI answer was not valid JSON', 502)
}

export const parseCitedAnswer = (value, availableEvidence) => {
    const result = citedAnswerSchema.safeParse(extractJson(value))

    if (!result.success) {
        const error = new AppError('AI answer did not match the cited-answer contract', 502)
        error.code = 'INVALID_AI_ANSWER'
        error.details = result.error.issues
        throw error
    }

    const evidenceById = new Map(availableEvidence.map((item) => [item.id, item]))
    const citationIds = [...new Set(result.data.citationIds)]
    const unknownCitation = citationIds.find((id) => !evidenceById.has(id))

    if (unknownCitation) {
        const error = new AppError('AI answer cited evidence outside the project context', 502)
        error.code = 'INVALID_AI_CITATION'
        throw error
    }

    if (!result.data.insufficientEvidence && citationIds.length === 0) {
        const error = new AppError('AI answer was not supported by a project citation', 502)
        error.code = 'MISSING_AI_CITATION'
        throw error
    }

    if (result.data.insufficientEvidence && citationIds.length > 0) {
        const error = new AppError('AI answer returned citations while declaring insufficient evidence', 502)
        error.code = 'CONTRADICTORY_AI_ANSWER'
        throw error
    }

    return {
        answer: result.data.answer,
        confidence: result.data.confidence,
        status: result.data.insufficientEvidence
            ? 'INSUFFICIENT_EVIDENCE'
            : 'ANSWERED',
        citations: citationIds.map((id) => evidenceById.get(id))
    }
}
