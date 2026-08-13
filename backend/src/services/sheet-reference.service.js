const LOW_CONFIDENCE_THRESHOLD = 0.55

export const normalizeSheetNumber = (value) => String(value || '')
    .trim()
    .toLocaleUpperCase('en-US')
    .replaceAll(/\s+/g, '')

const referenceKey = ({ reference, sourcePageId }) => [
    sourcePageId,
    reference.referenceType,
    reference.detailNumber || '',
    normalizeSheetNumber(reference.targetSheetNumber),
    reference.label.toLocaleUpperCase('en-US'),
    Math.round(reference.location.x * 1000),
    Math.round(reference.location.y * 1000)
].join('|')

const indexSheetsByNumber = (pages) => {
    const sheetsByNumber = new Map()

    for (const page of pages) {
        const key = normalizeSheetNumber(page.sheet?.sheetNumber)
        if (!key) continue
        const candidates = sheetsByNumber.get(key) || []
        candidates.push(page.sheet)
        sheetsByNumber.set(key, candidates)
    }

    return sheetsByNumber
}

const resolveTarget = (reference, sheetsByNumber) => {
    const targetKey = normalizeSheetNumber(reference.targetSheetNumber)
    const candidates = sheetsByNumber.get(targetKey) || []
    let resolutionStatus = 'RESOLVED'

    if (reference.confidence < LOW_CONFIDENCE_THRESHOLD) {
        resolutionStatus = 'LOW_CONFIDENCE'
    } else if (candidates.length === 0) {
        resolutionStatus = 'MISSING_TARGET'
    } else if (candidates.length > 1) {
        resolutionStatus = 'AMBIGUOUS_TARGET'
    }

    return {
        resolutionStatus,
        targetSheetId: candidates.length === 1
            ? candidates[0].id
            : null
    }
}

export const resolveSheetReferences = ({ pages, pageResults }) => {
    const sheetsByNumber = indexSheetsByNumber(pages)

    const seen = new Set()
    const references = []

    for (const pageResult of pageResults) {
        const sourcePage = pages.find((page) =>
            page.pageNumber === pageResult.pageNumber
        )
        if (!sourcePage) continue

        for (const reference of pageResult.sheetReferences) {
            const key = referenceKey({
                reference,
                sourcePageId: sourcePage.id
            })
            if (seen.has(key)) continue
            seen.add(key)

            const target = resolveTarget(reference, sheetsByNumber)

            references.push({
                referenceType: reference.referenceType,
                label: reference.label,
                detailNumber: reference.detailNumber,
                targetSheetNumber: reference.targetSheetNumber,
                confidence: reference.confidence,
                evidence: reference.evidence,
                x: reference.location.x,
                y: reference.location.y,
                width: reference.location.width,
                height: reference.location.height,
                hasLocation: reference.hasLocation,
                resolutionStatus: target.resolutionStatus,
                sourcePageId: sourcePage.id,
                targetSheetId: target.targetSheetId
            })
        }
    }

    return references
}

export const reconcileSheetReferences = ({ pages, references }) => {
    const sheetsByNumber = indexSheetsByNumber(pages)

    return references.map((reference) => ({
        id: reference.id,
        ...resolveTarget(reference, sheetsByNumber)
    }))
}

export const serializeSheetReference = (reference) => ({
    id: reference.id,
    referenceType: reference.referenceType,
    label: reference.label,
    detailNumber: reference.detailNumber,
    targetSheetNumber: reference.targetSheetNumber,
    confidence: reference.confidence,
    evidence: reference.evidence,
    location: {
        x: reference.x,
        y: reference.y,
        width: reference.width,
        height: reference.height
    },
    hasLocation: reference.hasLocation,
    resolutionStatus: reference.resolutionStatus,
    source: {
        pageId: reference.sourcePage.id,
        pageNumber: reference.sourcePage.pageNumber,
        sheetId: reference.sourcePage.sheet?.id || null,
        sheetNumber: reference.sourcePage.sheet?.sheetNumber || null,
        sheetTitle: reference.sourcePage.sheet?.title || null
    },
    target: reference.targetSheet
        ? {
            sheetId: reference.targetSheet.id,
            pageNumber: reference.targetSheet.page.pageNumber,
            sheetNumber: reference.targetSheet.sheetNumber,
            sheetTitle: reference.targetSheet.title
        }
        : null
})

export const createReferenceGraph = (references) => {
    const serialized = references.map(serializeSheetReference)
    const count = (status) => serialized.filter((reference) =>
        reference.resolutionStatus === status
    ).length

    return {
        references: serialized,
        summary: {
            total: serialized.length,
            resolved: count('RESOLVED'),
            missing: count('MISSING_TARGET'),
            ambiguous: count('AMBIGUOUS_TARGET'),
            lowConfidence: count('LOW_CONFIDENCE')
        }
    }
}
