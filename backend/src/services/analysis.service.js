import { prisma } from '../config/prisma.js'
import { config } from '../config/config.js'
import { AppError } from '../utils/AppError.js'
import { renderPdfPages } from './pdf-render.service.js'
import { ensureNativePdfArtifacts } from './native-pdf-extraction.service.js'
import { ensureHighResolutionRegions } from './high-resolution-region.service.js'
import {
    generateVisionResponse,
    getAIProviderMetadata
} from './ai/ai.service.js'
import { pageVisionReviewSystemPrompt } from '../prompts/pageVisionReview.prompt.js'
import { REVIEW_MODES } from '../prompts/reviewModes.prompt.js'
import {
    calculateOverallScore,
    issueToCreateInput,
    parsePageAnalysis,
    serializeIssue
} from './analysis-result.js'
import {
    extractionToSheetData,
    shouldRefreshExtractedSheet
} from './sheet-index.service.js'
import { resolveSheetReferences } from './sheet-reference.service.js'
import { analysisFailureData } from './analysis-error.js'
import { buildFindingReviewChange } from './finding-review.js'

const reviewEventInclude = {
    orderBy: { createdAt: 'desc' },
    include: {
        reviewer: { select: { id: true, name: true } }
    }
}

const analysisInclude = {
    issues: {
        orderBy: [
            { page: 'asc' },
            { createdAt: 'asc' }
        ],
        include: { reviewEvents: reviewEventInclude }
    }
}

const buildReviewSystemPrompt = (reviewMode) => {
    const reviewModeConfig = REVIEW_MODES[reviewMode]

    if (!reviewModeConfig) {
        throw new AppError(`Unsupported review mode: ${reviewMode}`, 400)
    }

    return pageVisionReviewSystemPrompt({
        reviewModeLabel: reviewModeConfig.label,
        reviewModeFocus: reviewModeConfig.focus
    })
}

const analyzeSinglePage = async ({ drawing, page, systemPrompt }) => {
    const titleBlockRegion = page.regions?.find((region) =>
        region.kind === 'TITLE_BLOCK' &&
        region.status === 'AVAILABLE' &&
        region.imagePath
    )
    const supplementalImageInstruction = titleBlockRegion
        ? `\n- Image 1 is the full-page overview. Image 2 is a high-resolution crop of the probable title-block region at normalized page bounds x=${titleBlockRegion.x}, y=${titleBlockRegion.y}, width=${titleBlockRegion.width}, height=${titleBlockRegion.height}.\n- Use Image 2 to read small title-block text, but return every location in Image 1 full-page coordinates.`
        : ''

    const aiResponse = await generateVisionResponse({
        systemPrompt,
        userPrompt: `
Analyze page ${page.pageNumber} of this architectural drawing.

Drawing file name: ${drawing.fileName}

Important:
- Focus only on this page.
- Give pinpoint coordinates using normalized values from 0 to 1.
- Do not return generic issues.
- If an issue is visible in the title block, dimension line, room label, legend, schedule, or drawing region, provide an approximate bounding box.${supplementalImageInstruction}
`,
        imagePaths: [
            page.imagePath,
            ...(titleBlockRegion ? [titleBlockRegion.imagePath] : [])
        ],
        temperature: 0.1
    })

    return {
        pageNumber: page.pageNumber,
        ...parsePageAnalysis(aiResponse, page.pageNumber)
    }
}

const legacyIssues = (snapshot) => Array.isArray(snapshot) ? snapshot : []

export const serializeAnalysis = (analysis) => {
    if (!analysis) return null

    const issueRecords = Array.isArray(analysis.issues)
        ? analysis.issues.map(serializeIssue)
        : []

    return {
        ...analysis,
        issues: issueRecords.length > 0
            ? issueRecords
            : legacyIssues(analysis.issuesSnapshot),
        issuesSnapshot: undefined
    }
}

const findOwnedDrawing = async ({ userId, drawingId }) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: { userId }
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    return drawing
}

const assertWithinDailyLimit = async (userId) => {
    const startOfToday = new Date()
    startOfToday.setUTCHours(0, 0, 0, 0)

    const runsToday = await prisma.analysis.count({
        where: {
            createdAt: { gte: startOfToday },
            drawing: {
                project: { userId }
            }
        }
    })

    if (runsToday >= config.ANALYSIS_DAILY_LIMIT) {
        throw new AppError(
            `Daily analysis limit of ${config.ANALYSIS_DAILY_LIMIT} reached`,
            429
        )
    }
}

export const requestDrawingAnalysis = async ({
    userId,
    drawingId,
    reviewMode = 'SUBMISSION_READINESS',
    force = false
}) => {
    const drawing = await findOwnedDrawing({ userId, drawingId })

    const activeAnalysis = await prisma.analysis.findFirst({
        where: {
            drawingId,
            reviewMode,
            status: { in: ['PENDING', 'PROCESSING'] }
        },
        orderBy: { createdAt: 'desc' },
        include: analysisInclude
    })

    if (activeAnalysis) {
        return {
            analysis: serializeAnalysis(activeAnalysis),
            shouldStart: true,
            created: false
        }
    }

    if (!force) {
        const completedAnalysis = await prisma.analysis.findFirst({
            where: {
                drawingId,
                reviewMode,
                status: 'COMPLETED'
            },
            orderBy: { createdAt: 'desc' },
            include: analysisInclude
        })

        if (completedAnalysis) {
            return {
                analysis: serializeAnalysis(completedAnalysis),
                shouldStart: false,
                created: false
            }
        }
    }

    await assertWithinDailyLimit(userId)

    const { provider, model } = getAIProviderMetadata()
    const analysis = await prisma.analysis.create({
        data: {
            drawingId: drawing.id,
            reviewMode,
            status: 'PENDING',
            issuesSnapshot: [],
            provider,
            model,
            promptVersion: `${config.AI_PROMPT_VERSION}:sheet-graph-v1`
        },
        include: analysisInclude
    })

    await prisma.drawing.update({
        where: { id: drawing.id },
        data: { status: 'PENDING' }
    })

    return {
        analysis: serializeAnalysis(analysis),
        shouldStart: true,
        created: true
    }
}

const refreshDrawingStatus = async (drawingId) => {
    const activeRun = await prisma.analysis.findFirst({
        where: {
            drawingId,
            status: { in: ['PENDING', 'PROCESSING'] }
        },
        select: { id: true }
    })

    let status = 'PENDING'

    if (activeRun) {
        status = 'PROCESSING'
    } else {
        const latestDefaultRun = await prisma.analysis.findFirst({
            where: {
                drawingId,
                reviewMode: 'SUBMISSION_READINESS'
            },
            orderBy: { createdAt: 'desc' },
            select: { status: true }
        })

        status = latestDefaultRun?.status || 'PENDING'
    }

    await prisma.drawing.update({
        where: { id: drawingId },
        data: { status }
    }).catch((error) => {
        if (error?.code !== 'P2025') throw error
    })
}

export const processAnalysisRun = async ({ analysisId, userId }) => {
    const run = await prisma.analysis.findFirst({
        where: {
            id: analysisId,
            drawing: {
                project: { userId }
            }
        },
        include: { drawing: true }
    })

    if (!run) {
        throw new AppError('Analysis run not found', 404)
    }

    if (run.status === 'COMPLETED') {
        return run
    }

    const startedAt = Date.now()

    await prisma.analysis.update({
        where: { id: run.id },
        data: {
            status: 'PROCESSING',
            startedAt: new Date(),
            completedAt: null,
            errorCode: null,
            errorMessage: null,
            attempt: { increment: 1 }
        }
    })

    await refreshDrawingStatus(run.drawingId)

    try {
        const systemPrompt = buildReviewSystemPrompt(run.reviewMode)
        let pages = await renderPdfPages({
            drawingId: run.drawing.id,
            pdfPath: run.drawing.filePath
        })

        if (!pages.length) {
            throw new AppError('Could not render PDF pages', 500)
        }

        pages = await ensureNativePdfArtifacts({
            pdfPath: run.drawing.filePath,
            pages
        })
        pages = await ensureHighResolutionRegions({
            drawingId: run.drawing.id,
            pdfPath: run.drawing.filePath,
            pages
        })

        const pageResults = []

        for (const page of pages) {
            pageResults.push(await analyzeSinglePage({
                drawing: run.drawing,
                page,
                systemPrompt
            }))
        }

        const allIssues = pageResults.flatMap((page) => page.issues)
        const score = calculateOverallScore(allIssues)
        const summary = allIssues.length === 0
            ? 'No visible issues were identified in the reviewed pages. Human verification is still recommended.'
            : `The review found ${allIssues.length} issue(s) across ${pageResults.length} page(s). Review each finding before using this result for a submission or construction decision.`
        const durationMs = Date.now() - startedAt

        const completedAnalysis = await prisma.$transaction(async (tx) => {
            for (const pageResult of pageResults) {
                const page = pages.find((candidate) =>
                    candidate.pageNumber === pageResult.pageNumber
                )
                if (!page) continue

                const sheetData = extractionToSheetData(
                    pageResult.sheetMetadata
                )
                const existingSheet = await tx.sheet.findUnique({
                    where: { pageId: page.id },
                    select: { id: true, reviewStatus: true }
                })

                if (!existingSheet) {
                    await tx.sheet.create({
                        data: {
                            ...sheetData,
                            pageId: page.id
                        }
                    })
                } else if (shouldRefreshExtractedSheet(
                    existingSheet.reviewStatus
                )) {
                    await tx.sheet.update({
                        where: { id: existingSheet.id },
                        data: sheetData
                    })
                }
            }

            const indexedPages = await tx.drawingPage.findMany({
                where: { drawingId: run.drawingId },
                orderBy: { pageNumber: 'asc' },
                include: { sheet: true }
            })
            const resolvedReferences = resolveSheetReferences({
                pages: indexedPages,
                pageResults
            })

            await tx.sheetReference.deleteMany({
                where: {
                    sourcePage: { drawingId: run.drawingId }
                }
            })

            if (resolvedReferences.length > 0) {
                await tx.sheetReference.createMany({
                    data: resolvedReferences
                })
            }

            await tx.analysisIssue.deleteMany({
                where: { analysisId: run.id }
            })

            if (allIssues.length > 0) {
                await tx.analysisIssue.createMany({
                    data: allIssues.map((issue) => ({
                        ...issueToCreateInput(issue),
                        analysisId: run.id
                    }))
                })
            }

            return tx.analysis.update({
                where: { id: run.id },
                data: {
                    status: 'COMPLETED',
                    score,
                    summary,
                    issuesSnapshot: allIssues,
                    durationMs,
                    completedAt: new Date(),
                    rawOutput: {
                        pageResults,
                        reviewMode: run.reviewMode,
                        analysisMode: 'page-by-page-vision',
                        scoringVersion: 'confidence-weighted-v1',
                        durationMs
                    }
                },
                include: analysisInclude
            })
        })

        await refreshDrawingStatus(run.drawingId)
        return serializeAnalysis(completedAnalysis)
    } catch (error) {
        await prisma.analysis.update({
            where: { id: run.id },
            data: analysisFailureData(error, Date.now() - startedAt)
        }).catch((persistenceError) => {
            console.error('Could not persist analysis failure state', {
                analysisId: run.id,
                errorName: persistenceError?.name,
                errorCode: persistenceError?.code,
                message: persistenceError?.message
            })
        })

        await refreshDrawingStatus(run.drawingId)
        throw error
    }
}

export const getDrawingAnalysis = async ({
    userId,
    drawingId,
    reviewMode = 'SUBMISSION_READINESS'
}) => {
    await findOwnedDrawing({ userId, drawingId })

    const analysis = await prisma.analysis.findFirst({
        where: { drawingId, reviewMode },
        orderBy: { createdAt: 'desc' },
        include: analysisInclude
    })

    if (!analysis) {
        throw new AppError('Analysis not found for this review mode', 404)
    }

    return serializeAnalysis(analysis)
}

export const updateAnalysisIssueStatus = async ({
    userId,
    issueId,
    status,
    reason,
    note
}) => {
    const issue = await prisma.analysisIssue.findFirst({
        where: {
            id: issueId,
            analysis: {
                drawing: {
                    project: { userId }
                }
            }
        }
    })

    if (!issue) {
        throw new AppError('Analysis issue not found', 404)
    }

    const reviewChange = buildFindingReviewChange({
        issue,
        status,
        reason,
        note
    })

    const updatedIssue = await prisma.$transaction(async (tx) => {
        await tx.analysisIssueReviewEvent.create({
            data: {
                ...reviewChange.event,
                issueId: issue.id,
                reviewerId: userId
            }
        })

        return tx.analysisIssue.update({
            where: { id: issue.id },
            data: reviewChange.issueUpdate,
            include: { reviewEvents: reviewEventInclude }
        })
    })

    return serializeIssue(updatedIssue)
}
