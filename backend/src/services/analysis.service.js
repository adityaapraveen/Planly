import fs from 'fs'
import { PDFParse } from 'pdf-parse'
import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { generateAIResponse } from './ai/ai.service.js'
import { drawingReviewSystemPrompt } from '../prompts/drawingReview.prompt.js'

const AI_TIMEOUT_MS = 60_000

const extractPdfText = async (filePath) => {
    const buffer = fs.readFileSync(filePath)
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    await parser.destroy()

    return data.text
}

const safeJsonParse = (value) => {
    try {
        return JSON.parse(value)
    } catch {
        throw new AppError('AI returned invalid JSON', 502)
    }
}

const normalizeAnalysis = (analysis) => {
    if (!analysis || typeof analysis !== 'object') {
        throw new AppError('AI returned empty or invalid analysis payload', 502)
    }

    return {
        score: Number(analysis.score ?? 0),
        summary: analysis.summary ?? 'No summary generated.',
        issues: Array.isArray(analysis.issues) ? analysis.issues : []
    }
}

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
    let timeoutId

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new AppError(timeoutMessage, 504))
        }, timeoutMs)
    })

    try {
        return await Promise.race([promise, timeoutPromise])
    } finally {
        clearTimeout(timeoutId)
    }
}

export const analyzeDrawing = async ({ userId, drawingId }) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: {
                userId
            }
        },
        include: {
            analysis: true
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    if (drawing.analysis) {
        return drawing.analysis
    }

    await prisma.drawing.update({
        where: { id: drawing.id },
        data: { status: 'PROCESSING' }
    })

    try {
        const drawingPath = drawing.fileUrl || drawing.filePath
        if (!drawingPath) {
            throw new AppError('Drawing file location is missing', 500)
        }

        const extractedText = await extractPdfText(drawingPath)

        if (!extractedText.trim()) {
            throw new AppError('No readable text found in PDF', 400)
        }

        const aiResponse = await withTimeout(
            generateAIResponse({
                systemPrompt: drawingReviewSystemPrompt,
                userPrompt: `
Drawing file name: ${drawing.fileName}

Extracted PDF text:
${extractedText}
`,
                temperature: 0.2
            }),
            AI_TIMEOUT_MS,
            'AI analysis timed out. Please try again.'
        )

        const parsed = safeJsonParse(aiResponse)
        const normalized = normalizeAnalysis(parsed)

        const analysis = await prisma.analysis.create({
            data: {
                drawingId: drawing.id,
                score: normalized.score,
                summary: normalized.summary,
                issues: normalized.issues
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

export const getDrawingAnalysis = async ({ userId, drawingId }) => {
    const drawing = await prisma.drawing.findFirst({
        where: {
            id: drawingId,
            project: {
                userId
            }
        },
        include: {
            analysis: true
        }
    })

    if (!drawing) {
        throw new AppError('Drawing not found', 404)
    }

    if (!drawing.analysis) {
        throw new AppError('Analysis not found for this drawing', 404)
    }

    return drawing.analysis
}
