import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { normalizeSheetNumber } from './sheet-reference.service.js'

export const PROJECT_CHECK_DEFINITIONS = [
    {
        key: 'MISSING_SHEET_NUMBER',
        title: 'Missing sheet number',
        purpose: 'Every indexed sheet should have a reviewable sheet identifier.',
        scope: 'Rendered pages with extracted sheet metadata.',
        expectedEvidence: 'A visible sheet number in the title block.',
        exclusions: 'Cover pages and intentionally unnumbered pages may be dismissed after professional review.',
        defaultSeverity: 'MEDIUM',
        version: 'v1'
    },
    {
        key: 'DUPLICATE_SHEET_NUMBER',
        title: 'Duplicate sheet number',
        purpose: 'A drawing set should not contain ambiguous sheet identifiers.',
        scope: 'Sheet numbers within each uploaded drawing set.',
        expectedEvidence: 'One unique normalized identifier per sheet.',
        exclusions: 'Separate uploaded drawing sets are evaluated independently.',
        defaultSeverity: 'HIGH',
        version: 'v1'
    },
    {
        key: 'BROKEN_REFERENCE',
        title: 'Broken sheet reference',
        purpose: 'Visible callouts should resolve to a sheet in the same drawing set.',
        scope: 'High-confidence extracted sheet references.',
        expectedEvidence: 'A unique target sheet matching the visible callout.',
        exclusions: 'References to intentionally external documents require human review.',
        defaultSeverity: 'HIGH',
        version: 'v1'
    },
    {
        key: 'AMBIGUOUS_REFERENCE',
        title: 'Ambiguous sheet reference',
        purpose: 'A callout must not resolve to multiple target sheets.',
        scope: 'Extracted references whose target identifier is duplicated.',
        expectedEvidence: 'Exactly one matching target sheet.',
        exclusions: 'None; duplicated identifiers should be corrected or explicitly documented.',
        defaultSeverity: 'HIGH',
        version: 'v1'
    },
    {
        key: 'LOW_CONFIDENCE_METADATA',
        title: 'Unreviewed sheet metadata',
        purpose: 'Low-confidence sheet metadata should receive human confirmation.',
        scope: 'AI-extracted sheet index rows marked as needing review.',
        expectedEvidence: 'Confirmed or corrected title-block metadata.',
        exclusions: 'None; this is a review-routing check, not a design defect.',
        defaultSeverity: 'LOW',
        version: 'v1'
    },
    {
        key: 'LOW_CONFIDENCE_REFERENCE',
        title: 'Uncertain sheet reference',
        purpose: 'Low-confidence callouts should not be silently treated as valid graph edges.',
        scope: 'Extracted references below the resolver confidence threshold.',
        expectedEvidence: 'A reviewer verifies the visible callout and its target.',
        exclusions: 'Illegible or intentionally symbolic annotations may require manual interpretation.',
        defaultSeverity: 'LOW',
        version: 'v1'
    }
]

const definitionByKey = new Map(PROJECT_CHECK_DEFINITIONS.map((item) => [item.key, item]))

const pageCitation = (page, message, location = null) => ({
    id: `check-page:${page.id}`,
    message,
    drawingId: page.drawing.id,
    drawingName: page.drawing.fileName,
    pageNumber: page.pageNumber,
    sheetNumber: page.sheet?.sheetNumber || null,
    location
})

const referenceCitation = (reference, message) => ({
    id: `check-reference:${reference.id}`,
    message,
    drawingId: reference.sourcePage.drawing.id,
    drawingName: reference.sourcePage.drawing.fileName,
    pageNumber: reference.sourcePage.pageNumber,
    sheetNumber: reference.sourcePage.sheet?.sheetNumber || null,
    location: reference.hasLocation
        ? { x: reference.x, y: reference.y, width: reference.width, height: reference.height }
        : null
})

const evaluateMissingSheetNumbers = (pages) => pages
    .filter((page) => page.sheet && !normalizeSheetNumber(page.sheet.sheetNumber))
    .map((page) => pageCitation(page, `PDF page ${page.pageNumber} has no sheet number.`))

const evaluateDuplicateSheetNumbers = (pages) => {
    const byDrawing = new Map()

    for (const page of pages) {
        const number = normalizeSheetNumber(page.sheet?.sheetNumber)
        if (!number) continue
        const drawingPages = byDrawing.get(page.drawingId) || new Map()
        const matches = drawingPages.get(number) || []
        matches.push(page)
        drawingPages.set(number, matches)
        byDrawing.set(page.drawingId, drawingPages)
    }

    return [...byDrawing.values()].flatMap((drawingPages) =>
        [...drawingPages.entries()].flatMap(([number, matches]) =>
            matches.length < 2
                ? []
                : matches.map((page) => pageCitation(
                    page,
                    `Sheet number ${number} appears ${matches.length} times in ${page.drawing.fileName}.`
                ))
        )
    )
}

const referenceFindings = (references, status, label) => references
    .filter((reference) => reference.resolutionStatus === status)
    .map((reference) => referenceCitation(
        reference,
        `${label}: ${reference.label} targets ${reference.targetSheetNumber}.`
    ))

const evaluators = {
    MISSING_SHEET_NUMBER: ({ pages }) => evaluateMissingSheetNumbers(pages),
    DUPLICATE_SHEET_NUMBER: ({ pages }) => evaluateDuplicateSheetNumbers(pages),
    BROKEN_REFERENCE: ({ references }) => referenceFindings(
        references,
        'MISSING_TARGET',
        'Missing target'
    ),
    AMBIGUOUS_REFERENCE: ({ references }) => referenceFindings(
        references,
        'AMBIGUOUS_TARGET',
        'Ambiguous target'
    ),
    LOW_CONFIDENCE_METADATA: ({ pages }) => pages
        .filter((page) => page.sheet?.reviewStatus === 'NEEDS_REVIEW')
        .map((page) => pageCitation(
            page,
            `Metadata for PDF page ${page.pageNumber} needs human review.`
        )),
    LOW_CONFIDENCE_REFERENCE: ({ references }) => referenceFindings(
        references,
        'LOW_CONFIDENCE',
        'Low-confidence reference'
    )
}

export const evaluateProjectChecks = ({ pages, references, settings = [] }) => {
    const settingsByKey = new Map(settings.map((setting) => [setting.checkKey, setting]))
    const ready = pages.length > 0 && pages.every((page) => page.sheet)
    const checks = PROJECT_CHECK_DEFINITIONS.map((definition) => {
        const setting = settingsByKey.get(definition.key)
        const enabled = setting?.enabled ?? true
        const severity = setting?.severity || definition.defaultSeverity
        const findings = ready && enabled
            ? evaluators[definition.key]({ pages, references })
            : []
        const status = !enabled
            ? 'DISABLED'
            : !ready
                ? 'NOT_READY'
                : findings.length > 0
                    ? 'FAIL'
                    : 'PASS'

        return {
            ...definition,
            enabled,
            severity,
            status,
            findingCount: findings.length,
            findings
        }
    })

    return {
        checks,
        summary: {
            total: checks.length,
            passing: checks.filter((check) => check.status === 'PASS').length,
            failing: checks.filter((check) => check.status === 'FAIL').length,
            disabled: checks.filter((check) => check.status === 'DISABLED').length,
            notReady: checks.filter((check) => check.status === 'NOT_READY').length,
            findings: checks.reduce((sum, check) => sum + check.findingCount, 0)
        }
    }
}

const verifyProject = async ({ userId, projectId }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true }
    })
    if (!project) throw new AppError('Project not found', 404)
    return project
}

export const getProjectCheckReport = async ({ userId, projectId }) => {
    await verifyProject({ userId, projectId })
    const [pages, references, settings] = await Promise.all([
        prisma.drawingPage.findMany({
            where: { drawing: { projectId } },
            include: {
                sheet: true,
                drawing: { select: { id: true, fileName: true } }
            }
        }),
        prisma.sheetReference.findMany({
            where: { sourcePage: { drawing: { projectId } } },
            include: {
                sourcePage: {
                    include: {
                        sheet: true,
                        drawing: { select: { id: true, fileName: true } }
                    }
                }
            }
        }),
        prisma.projectCheckSetting.findMany({ where: { projectId } })
    ])

    return evaluateProjectChecks({ pages, references, settings })
}

export const updateProjectCheckSetting = async ({
    userId,
    projectId,
    checkKey,
    enabled,
    severity
}) => {
    await verifyProject({ userId, projectId })
    const definition = definitionByKey.get(checkKey)
    if (!definition) throw new AppError('Unsupported project check', 400)

    await prisma.projectCheckSetting.upsert({
        where: {
            projectId_checkKey: { projectId, checkKey }
        },
        create: {
            projectId,
            checkKey,
            enabled: enabled ?? true,
            severity: severity || definition.defaultSeverity,
            version: definition.version
        },
        update: {
            ...(enabled !== undefined ? { enabled } : {}),
            ...(severity !== undefined ? { severity } : {}),
            version: definition.version
        }
    })

    return getProjectCheckReport({ userId, projectId })
}
