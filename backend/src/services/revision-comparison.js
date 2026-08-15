const SHEET_FIELDS = ['sheetNumber', 'title', 'discipline', 'revision', 'issueDate']

const normalizeText = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const normalizeSheetNumber = (value) => normalizeText(value)
    .replace(/[\s._-]+/g, '')

const serializeSheet = (page) => ({
    id: page.sheet?.id || null,
    pageId: page.id,
    pageNumber: page.pageNumber,
    imageUrl: page.imageUrl || null,
    sheetNumber: page.sheet?.sheetNumber || null,
    title: page.sheet?.title || null,
    discipline: page.sheet?.discipline || null,
    revision: page.sheet?.revision || null,
    issueDate: page.sheet?.issueDate || null,
    reviewStatus: page.sheet?.reviewStatus || null,
    confidence: Number(page.sheet?.confidence || 0)
})

const createSheetEntries = (pages = []) => {
    const occurrences = new Map()

    return [...pages]
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((page) => {
            const normalizedNumber = normalizeSheetNumber(page.sheet?.sheetNumber)
            const baseKey = normalizedNumber
                ? `sheet:${normalizedNumber}`
                : `page:${page.pageNumber}`
            const occurrence = (occurrences.get(baseKey) || 0) + 1
            occurrences.set(baseKey, occurrence)

            return {
                key: `${baseKey}#${occurrence}`,
                matchMethod: normalizedNumber ? 'SHEET_NUMBER' : 'PAGE_POSITION',
                sheet: serializeSheet(page)
            }
        })
}

const normalizeSheetField = (field, value) => field === 'sheetNumber'
    ? normalizeSheetNumber(value)
    : normalizeText(value)

const changedSheetFields = (previous, current) => SHEET_FIELDS
    .filter((field) => normalizeSheetField(field, previous?.[field]) !==
        normalizeSheetField(field, current?.[field]))
    .map((field) => ({
        field,
        previous: previous?.[field] || null,
        current: current?.[field] || null
    }))

export const compareSheets = ({ previousPages = [], currentPages = [] }) => {
    const previous = new Map(createSheetEntries(previousPages).map((item) => [item.key, item]))
    const current = new Map(createSheetEntries(currentPages).map((item) => [item.key, item]))
    const keys = new Set([...previous.keys(), ...current.keys()])

    const changes = [...keys].map((key) => {
        const before = previous.get(key)
        const after = current.get(key)

        if (!before) {
            return {
                key,
                status: 'ADDED',
                matchMethod: after.matchMethod,
                changedFields: [],
                previous: null,
                current: after.sheet
            }
        }

        if (!after) {
            return {
                key,
                status: 'REMOVED',
                matchMethod: before.matchMethod,
                changedFields: [],
                previous: before.sheet,
                current: null
            }
        }

        const changedFields = changedSheetFields(before.sheet, after.sheet)

        return {
            key,
            status: changedFields.length > 0 ? 'MODIFIED' : 'UNCHANGED',
            matchMethod: before.matchMethod === after.matchMethod
                ? before.matchMethod
                : 'PAGE_POSITION',
            changedFields,
            previous: before.sheet,
            current: after.sheet
        }
    }).sort((a, b) => {
        const aPage = a.current?.pageNumber || a.previous?.pageNumber || 0
        const bPage = b.current?.pageNumber || b.previous?.pageNumber || 0
        return aPage - bPage
    })

    const summary = changes.reduce((result, item) => {
        result[item.status.toLowerCase()] += 1
        return result
    }, { added: 0, removed: 0, modified: 0, unchanged: 0 })

    return { summary, changes }
}

const createPageSheetLookup = (pages = []) => new Map(
    pages.map((page) => [
        Number(page.pageNumber),
        {
            key: normalizeSheetNumber(page.sheet?.sheetNumber) || `page-${page.pageNumber}`,
            label: page.sheet?.sheetNumber || null
        }
    ])
)

const serializeFinding = (issue, pageSheets) => {
    const pageNumber = Number(issue.page || 1)
    const matchedSheet = pageSheets.get(pageNumber)

    return {
        id: issue.id,
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        confidence: Number(issue.confidence || 0),
        page: pageNumber,
        sheetNumber: matchedSheet?.label || null,
        sheetKey: matchedSheet?.key || `page-${pageNumber}`,
        status: issue.status,
        explanation: issue.explanation,
        recommendation: issue.recommendation,
        x: Number(issue.x || 0),
        y: Number(issue.y || 0),
        width: Number(issue.width || 0),
        height: Number(issue.height || 0),
        hasLocation: issue.hasLocation !== false
    }
}

const createFindingEntries = ({ issues = [], pages = [] }) => {
    const pageSheets = createPageSheetLookup(pages)
    const occurrences = new Map()

    return issues.map((issue) => {
        const finding = serializeFinding(issue, pageSheets)
        const baseKey = [
            normalizeText(finding.category),
            normalizeText(finding.title),
            finding.sheetKey
        ].join('|')
        const occurrence = (occurrences.get(baseKey) || 0) + 1
        occurrences.set(baseKey, occurrence)

        return { key: `${baseKey}#${occurrence}`, finding }
    })
}

export const compareFindings = ({
    previousIssues = [],
    currentIssues = [],
    previousPages = [],
    currentPages = []
}) => {
    const previous = new Map(createFindingEntries({
        issues: previousIssues,
        pages: previousPages
    }).map((item) => [item.key, item.finding]))
    const current = new Map(createFindingEntries({
        issues: currentIssues,
        pages: currentPages
    }).map((item) => [item.key, item.finding]))
    const keys = new Set([...previous.keys(), ...current.keys()])
    const changes = [...keys].map((key) => {
        const before = previous.get(key) || null
        const after = current.get(key) || null
        const status = !before ? 'NEW' : !after ? 'RESOLVED' : 'PERSISTING'
        return { key, status, previous: before, current: after }
    })

    const summary = changes.reduce((result, item) => {
        result[item.status.toLowerCase()] += 1
        return result
    }, { new: 0, resolved: 0, persisting: 0 })

    return { summary, changes }
}

export const buildRevisionComparison = ({ previous, current }) => {
    const sheetComparison = compareSheets({
        previousPages: previous.pages,
        currentPages: current.pages
    })
    const previousAnalysis = previous.analyses?.[0] || null
    const currentAnalysis = current.analyses?.[0] || null
    const findingsReady = previousAnalysis?.status === 'COMPLETED' &&
        currentAnalysis?.status === 'COMPLETED'
    const hasFailed = current.status === 'FAILED' || previous.status === 'FAILED' ||
        currentAnalysis?.status === 'FAILED' || previousAnalysis?.status === 'FAILED'
    const isProcessing = ['PENDING', 'PROCESSING'].includes(current.status) ||
        ['PENDING', 'PROCESSING'].includes(previous.status) ||
        ['PENDING', 'PROCESSING'].includes(currentAnalysis?.status) ||
        ['PENDING', 'PROCESSING'].includes(previousAnalysis?.status)
    const findingStatus = findingsReady
        ? 'READY'
        : hasFailed
            ? 'FAILED'
            : isProcessing
                ? 'PROCESSING'
                : 'INSUFFICIENT_EVIDENCE'

    return {
        comparisonVersion: 'revision-comparison-v1',
        status: hasFailed
            ? 'FAILED'
            : isProcessing
                ? 'PROCESSING'
                : sheetComparison.changes.length === 0
                    ? 'INSUFFICIENT_EVIDENCE'
                    : 'READY',
        method: {
            sheets: 'Normalized sheet number with page-position fallback when sheet numbers are missing',
            findings: 'Exact normalized category, title, and matched sheet identity',
            limitation: 'This first comparison identifies structured metadata and finding changes; it does not yet claim pixel-level geometry changes.'
        },
        previous: {
            id: previous.id,
            fileName: previous.fileName,
            status: previous.status,
            createdAt: previous.createdAt
        },
        current: {
            id: current.id,
            projectId: current.projectId,
            fileName: current.fileName,
            status: current.status,
            createdAt: current.createdAt
        },
        sheets: sheetComparison,
        findings: findingsReady
            ? { status: findingStatus, ...compareFindings({
                previousIssues: previousAnalysis.issues,
                currentIssues: currentAnalysis.issues,
                previousPages: previous.pages,
                currentPages: current.pages
            }) }
            : {
                status: findingStatus,
                summary: { new: 0, resolved: 0, persisting: 0 },
                changes: []
            }
    }
}
