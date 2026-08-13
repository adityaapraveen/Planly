import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

const METADATA_FIELDS = [
    'sheetNumber',
    'title',
    'discipline',
    'revision',
    'issueDate'
]

const normalizeOptionalText = (value) => {
    if (value === null || value === undefined) return null
    const normalized = String(value).trim()
    return normalized || null
}

export const extractionToSheetData = (metadata) => {
    const fieldConfidence = {}
    const evidence = {}

    for (const field of METADATA_FIELDS) {
        fieldConfidence[field] = metadata[field].confidence
        evidence[field] = metadata[field].evidence
    }

    const sheetNumber = normalizeOptionalText(metadata.sheetNumber.value)
    const reviewStatus = !sheetNumber ||
        !normalizeOptionalText(metadata.title.value) ||
        metadata.sheetNumber.confidence < 0.7 ||
        metadata.confidence < 0.65
        ? 'NEEDS_REVIEW'
        : 'AI_EXTRACTED'

    return {
        sheetNumber,
        title: normalizeOptionalText(metadata.title.value),
        discipline: normalizeOptionalText(metadata.discipline.value),
        revision: normalizeOptionalText(metadata.revision.value),
        issueDate: normalizeOptionalText(metadata.issueDate.value),
        confidence: metadata.confidence,
        fieldConfidence,
        evidence,
        titleBlockLocation: metadata.titleBlockLocation,
        reviewStatus,
        metadataVersion: 'sheet-metadata-v1'
    }
}

export const shouldRefreshExtractedSheet = (reviewStatus) =>
    ['AI_EXTRACTED', 'NEEDS_REVIEW'].includes(reviewStatus)

export const serializeSheet = (sheet, pageNumber) => ({
    id: sheet.id,
    pageId: sheet.pageId,
    pageNumber,
    sheetNumber: sheet.sheetNumber,
    title: sheet.title,
    discipline: sheet.discipline,
    revision: sheet.revision,
    issueDate: sheet.issueDate,
    confidence: sheet.confidence,
    fieldConfidence: sheet.fieldConfidence,
    evidence: sheet.evidence,
    titleBlockLocation: sheet.titleBlockLocation,
    reviewStatus: sheet.reviewStatus,
    correctedAt: sheet.correctedAt,
    updatedAt: sheet.updatedAt
})

export const buildSheetDiagnostics = (sheets) => {
    const diagnostics = []
    const byNumber = new Map()

    for (const sheet of sheets) {
        const normalizedNumber = normalizeOptionalText(sheet.sheetNumber)

        if (!normalizedNumber) {
            diagnostics.push({
                code: 'MISSING_SHEET_NUMBER',
                severity: 'warning',
                message: `Page ${sheet.pageNumber} has no identified sheet number.`,
                sheetIds: [sheet.id],
                pageNumbers: [sheet.pageNumber]
            })
            continue
        }

        const key = normalizedNumber.toLocaleUpperCase('en-US')
        const existing = byNumber.get(key) || []
        existing.push(sheet)
        byNumber.set(key, existing)
    }

    for (const group of byNumber.values()) {
        if (group.length < 2) continue
        diagnostics.push({
            code: 'DUPLICATE_SHEET_NUMBER',
            severity: 'error',
            message: `Sheet number ${group[0].sheetNumber} appears on ${group.length} pages.`,
            sheetIds: group.map((sheet) => sheet.id),
            pageNumbers: group.map((sheet) => sheet.pageNumber)
        })
    }

    for (const sheet of sheets) {
        if (sheet.reviewStatus !== 'NEEDS_REVIEW') continue
        diagnostics.push({
            code: 'LOW_CONFIDENCE_METADATA',
            severity: 'info',
            message: `Page ${sheet.pageNumber} needs metadata review.`,
            sheetIds: [sheet.id],
            pageNumbers: [sheet.pageNumber]
        })
    }

    return diagnostics
}

export const createSheetIndex = (pages) => {
    const sheets = pages
        .filter((page) => page.sheet)
        .map((page) => serializeSheet(page.sheet, page.pageNumber))

    return {
        sheets,
        diagnostics: buildSheetDiagnostics(sheets),
        summary: {
            totalPages: pages.length,
            indexedSheets: sheets.length,
            needsReview: sheets.filter((sheet) =>
                sheet.reviewStatus === 'NEEDS_REVIEW'
            ).length,
            confirmed: sheets.filter((sheet) =>
                ['CORRECTED', 'CONFIRMED'].includes(sheet.reviewStatus)
            ).length
        }
    }
}

export const updateSheetMetadata = async ({ userId, sheetId, changes }) => {
    const sheet = await prisma.sheet.findFirst({
        where: {
            id: sheetId,
            page: {
                drawing: {
                    project: { userId }
                }
            }
        }
    })

    if (!sheet) {
        throw new AppError('Sheet not found', 404)
    }

    const metadataChanges = Object.fromEntries(
        METADATA_FIELDS
            .filter((field) => Object.hasOwn(changes, field))
            .map((field) => [field, normalizeOptionalText(changes[field])])
    )
    const changedFields = Object.keys(metadataChanges)
    const data = { ...metadataChanges }

    if (changedFields.length > 0) {
        const fieldConfidence = { ...(sheet.fieldConfidence || {}) }
        const evidence = { ...(sheet.evidence || {}) }

        for (const field of changedFields) {
            fieldConfidence[field] = 1
            evidence[field] = 'Corrected by a project user.'
        }

        data.fieldConfidence = fieldConfidence
        data.evidence = evidence
        data.reviewStatus = 'CORRECTED'
        data.correctedAt = new Date()
    } else if (changes.reviewStatus === 'CONFIRMED') {
        data.reviewStatus = 'CONFIRMED'
    } else {
        throw new AppError('No sheet metadata changes provided', 400)
    }

    return prisma.sheet.update({
        where: { id: sheet.id },
        data
    })
}
