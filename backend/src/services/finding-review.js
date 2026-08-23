import { AppError } from '../utils/AppError.js'

const terminalStatuses = new Set(['RESOLVED', 'DISMISSED'])

const cleanOptionalText = (value) => {
    const normalized = typeof value === 'string' ? value.trim() : ''
    return normalized || null
}

export const buildFindingReviewChange = ({ issue, status, reason, note }) => {
    const reviewReason = cleanOptionalText(reason)
    const reviewerNote = cleanOptionalText(note)

    if (status === 'DISMISSED' && !reviewReason) {
        throw new AppError('A dismissal reason is required to preserve the professional review trail', 400)
    }

    if (status === issue.status && reviewReason === (issue.reviewReason || null) &&
        reviewerNote === (issue.reviewerNote || null)) {
        throw new AppError('The finding review has no changes', 400)
    }

    return {
        issueUpdate: {
            status,
            reviewReason: terminalStatuses.has(status) ? reviewReason : null,
            reviewerNote,
            reviewedAt: new Date()
        },
        event: {
            previousStatus: issue.status,
            status,
            reason: terminalStatuses.has(status) ? reviewReason : null,
            note: reviewerNote
        }
    }
}
