import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { renderPdfPages } from './pdf-render.service.js'
import { generateVisionResponse } from './ai/ai.service.js'
import { pageVisionReviewSystemPrompt } from '../prompts/pageVisionReview.prompt.js'

const clamp01 = (value) => {
    const number = Number(value)

    if (Number.isNaN(number)) return 0

    return Math.max(0, Math.min(1, number))
}

const normalizeIssue = (issue, pageNumber) => {
    const location = issue.location || {}
    const normalizedLocation = {
        x: clamp01(location.x),
        y: clamp01(location.y),
        width: clamp01(location.width),
        height: clamp01(location.height)
    }
    const hasLocation = normalizedLocation.width > 0 && normalizedLocation.height > 0
    const severity = String(issue.severity || 'Medium').trim()
    const normalizedSeverity = ['High', 'Medium', 'Low'].find(
        (level) => level.toLowerCase() === severity.toLowerCase()
    ) || 'Medium'

    return {
        id: issue.id || undefined,
        title: issue.title || 'Untitled issue',
        category: issue.category || 'Drawing Quality',
        severity: normalizedSeverity,
        confidence: clamp01(issue.confidence ?? 0.5),
        page: Number(issue.page || pageNumber),
        location: normalizedLocation,
        hasLocation,
        explanation: issue.explanation || '',
        recommendation: issue.recommendation || ''
    }
}

const calculateOverallScore = (issues) => {
    let score = 100

    for (const issue of issues) {
        if (issue.severity === 'High') score -= 20
        if (issue.severity === 'Medium') score -= 10
        if (issue.severity === 'Low') score -= 5
    }

    return Math.max(0, score)
}

const analyzeSinglePage = async ({ drawing, page }) => {
    const aiResponse = await generateVisionResponse({
        systemPrompt: pageVisionReviewSystemPrompt,
        userPrompt: `
Analyze page ${page.pageNumber} of this architectural drawing.

Drawing file name: ${drawing.fileName}

Important:
- Focus only on this page.
- Give pinpoint coordinates using normalized values from 0 to 1.
- Do not return generic issues.
- If an issue is visible in the title block, dimension line, room label, legend, schedule, or drawing region, provide an approximate bounding box.
`,
        imagePaths: [page.imagePath],
        temperature: 0.1
    })

    const parsed = safeJsonParse(aiResponse)

    const issues = Array.isArray(parsed.issues)
        ? parsed.issues.map((issue) => normalizeIssue(issue, page.pageNumber))
        : []

    return {
        pageNumber: page.pageNumber,
        score: Number(parsed.score ?? 0),
        summary: parsed.summary || '',
        issues
    }
}

const safeJsonParse = (value) => {
    if (value && typeof value === 'object') {
        return value
    }

    const raw = String(value || '').trim()

    try {
        return JSON.parse(raw)
    } catch {
        const start = raw.indexOf('{')
        const end = raw.lastIndexOf('}')

        if (start >= 0 && end > start) {
            const sliced = raw.slice(start, end + 1)
            try {
                return JSON.parse(sliced)
            } catch {
                // fall through
            }
        }

        return {
            score: 0,
            summary: 'AI response could not be parsed into structured JSON.',
            issues: []
        }
    }
}

export const analyzeDrawing = async ({
    userId,
    drawingId,
    reviewMode = 'SUBMISSION_READINESS'
}) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: {
                userId
            }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    const existingAnalysis = await prisma.analysis.findUnique({
        where: {
            drawingId_reviewMode: {
                drawingId,
                reviewMode
            }
        }
    })

    if (existingAnalysis) {
        return existingAnalysis
    }

    await prisma.drawing.update({
        where: { id: drawing.id },
        data: { status: 'PROCESSING' }
    })

    const startedAt = Date.now()

    try {
        const pages = await renderPdfPages({
            drawingId: drawing.id,
            pdfPath: drawing.filePath
        })

        if (!pages.length) {
            throw new AppError('Could not render PDF pages', 500)
        }

        const pageResults = []

        for (const page of pages) {
            const pageResult = await analyzeSinglePage({
                drawing,
                page
            })

            pageResults.push(pageResult)
        }

        const allIssues = pageResults.flatMap((page) => page.issues)

        const score = calculateOverallScore(allIssues)

        const summary =
            allIssues.length === 0
                ? 'No major drawing issues were identified in the reviewed pages.'
                : `The review found ${allIssues.length} issue(s) across ${pageResults.length} page(s), with focus areas in documentation quality, drawing readability, and coordination readiness.`

        const analysis = await prisma.analysis.create({
            data: {
                drawingId: drawing.id,
                score,
                summary,
                issues: allIssues,
                reviewMode,
                rawOutput: {
                    pageResults,
                    reviewMode,
                    analysisMode: 'page-by-page-vision',
                    durationMs: Date.now() - startedAt
                }
            }
        })

        await prisma.drawing.update({
            where: { id: drawing.id },
            data: { status: 'COMPLETED' }
        })

        return analysis
    } catch (error) {
        await prisma.drawing.update({
            where: { id: drawing.id },
            data: { status: 'FAILED' }
        })

        throw error
    }
}

export const getDrawingAnalysis = async ({
    userId,
    drawingId,
    reviewMode = 'SUBMISSION_READINESS'
}) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: {
                userId
            }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    const analysis = await prisma.analysis.findUnique({
        where: {
            drawingId_reviewMode: {
                drawingId,
                reviewMode
            }
        }
    })

    if (!analysis) {
        throw new AppError('Analysis not found for this review mode', 404)
    }

    return analysis
}
