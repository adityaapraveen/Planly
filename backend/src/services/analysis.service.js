import fs from 'fs'
import pdfParse from 'pdf-parse'

import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { generateAIResponse } from './ai/ai.service.js'
import { drawingReviewSystemPrompt } from '../prompts/drawingReview.prompt.js'

const extractPdfText = async (filePath) => {
    const buffer = fs.readFileSync(filePath)
    const data = await pdfParse(buffer)

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
    return {
        score: Number(analysis.score ?? 0),
        summary: analysis.summary ?? 'No summary generated.',
        issues: Array.isArray(analysis.issues) ? analysis.issues : []
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
        const extractedText = await extractPdfText(drawing.filePath)

        if (!extractedText.trim()) {
            throw new AppError('No readable text found in PDF', 400)
        }

        const aiResponse = await generateAIResponse({
            systemPrompt: drawingReviewSystemPrompt,
            userPrompt: `
Drawing file name: ${drawing.fileName}

Extracted PDF text:
${extractedText}
`,
            temperature: 0.2
        })

        const parsed = safeJsonParse(aiResponse)
        const normalized = normalizeAnalysis(parsed)

        const analysis = await prisma.analysis.create({
            data: {
                drawingId: drawing.id,
                score: normalized.score,
                summary: normalized.summary,
                issues: normalized.issues,
                rawOutput: parsed
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