import { prisma } from '../config/prisma.js'

const locationFromJson = (value) => {
    if (!value || typeof value !== 'object') return null
    const { x, y, width, height } = value
    if (![x, y, width, height].every((item) => Number.isFinite(Number(item)))) {
        return null
    }
    return { x: Number(x), y: Number(y), width: Number(width), height: Number(height) }
}

const getLatestAnalyses = async (projectId) => {
    const analyses = await prisma.analysis.findMany({
        where: {
            status: 'COMPLETED',
            drawing: { projectId }
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
            drawing: { select: { id: true, fileName: true } },
            issues: true
        }
    })
    const seen = new Set()

    return analyses.filter((analysis) => {
        const key = `${analysis.drawingId}:${analysis.reviewMode}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

export const loadProjectEvidence = async (projectId) => {
    const [sheets, references, analyses] = await Promise.all([
        prisma.sheet.findMany({
            where: { page: { drawing: { projectId } } },
            take: 1000,
            include: {
                page: {
                    include: {
                        drawing: { select: { id: true, fileName: true } }
                    }
                }
            }
        }),
        prisma.sheetReference.findMany({
            where: { sourcePage: { drawing: { projectId } } },
            take: 2000,
            include: {
                sourcePage: {
                    include: {
                        sheet: true,
                        drawing: { select: { id: true, fileName: true } }
                    }
                }
            }
        }),
        getLatestAnalyses(projectId)
    ])

    const sheetEvidence = sheets.map((sheet) => ({
        id: `sheet:${sheet.id}`,
        type: 'SHEET',
        title: [sheet.sheetNumber, sheet.title].filter(Boolean).join(' — ') ||
            `PDF page ${sheet.page.pageNumber}`,
        snippet: [
            sheet.discipline && `Discipline: ${sheet.discipline}`,
            sheet.revision && `Revision: ${sheet.revision}`,
            sheet.issueDate && `Issue date: ${sheet.issueDate}`,
            `Review status: ${sheet.reviewStatus}`
        ].filter(Boolean).join('. '),
        drawingId: sheet.page.drawing.id,
        drawingName: sheet.page.drawing.fileName,
        pageNumber: sheet.page.pageNumber,
        sheetNumber: sheet.sheetNumber,
        location: locationFromJson(sheet.titleBlockLocation),
        confidence: sheet.confidence
    }))
    const referenceEvidence = references.map((reference) => ({
        id: `reference:${reference.id}`,
        type: 'REFERENCE',
        title: `${reference.label} → ${reference.targetSheetNumber}`,
        snippet: `${reference.referenceType}. ${reference.evidence}. Resolution: ${reference.resolutionStatus}`,
        drawingId: reference.sourcePage.drawing.id,
        drawingName: reference.sourcePage.drawing.fileName,
        pageNumber: reference.sourcePage.pageNumber,
        sheetNumber: reference.sourcePage.sheet?.sheetNumber || null,
        location: reference.hasLocation
            ? { x: reference.x, y: reference.y, width: reference.width, height: reference.height }
            : null,
        confidence: reference.confidence
    }))
    const sheetNumberByPage = new Map(sheets.map((sheet) => [
        `${sheet.page.drawing.id}:${sheet.page.pageNumber}`,
        sheet.sheetNumber
    ]))
    const issueEvidence = analyses.flatMap((analysis) =>
        analysis.issues.map((issue) => ({
            id: `finding:${issue.id}`,
            type: 'FINDING',
            title: issue.title,
            snippet: `${issue.category}. ${issue.explanation} Recommendation: ${issue.recommendation}. Severity: ${issue.severity}. Status: ${issue.status}`,
            drawingId: analysis.drawing.id,
            drawingName: analysis.drawing.fileName,
            pageNumber: issue.page,
            sheetNumber: sheetNumberByPage.get(
                `${analysis.drawing.id}:${issue.page}`
            ) || null,
            location: issue.hasLocation
                ? { x: issue.x, y: issue.y, width: issue.width, height: issue.height }
                : null,
            confidence: issue.confidence
        }))
    )

    return [...sheetEvidence, ...referenceEvidence, ...issueEvidence]
}
