import crypto from 'crypto'

import { prisma } from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import {
    generateEmbeddings,
    getEmbeddingCapability
} from './ai/ai.service.js'
import { loadProjectEvidence } from './project-evidence.service.js'
import { rankEvidenceChunks } from './retrieval-ranking.js'

const EMBEDDING_BATCH_SIZE = 64
const MAX_INDEXED_EVIDENCE = 3000

const hashEvidence = (evidence) => crypto
    .createHash('sha256')
    .update(JSON.stringify(evidence))
    .digest('hex')

const evidenceContent = (evidence) => [
    `Type: ${evidence.type}`,
    `Title: ${evidence.title}`,
    evidence.snippet,
    evidence.sheetNumber && `Sheet: ${evidence.sheetNumber}`,
    `Page: ${evidence.pageNumber}`,
    `Drawing: ${evidence.drawingName}`
].filter(Boolean).join('\n')

const toDocument = (evidence) => ({
    sourceId: evidence.id,
    evidenceType: evidence.type,
    title: evidence.title,
    content: evidenceContent(evidence),
    contentHash: hashEvidence(evidence),
    metadata: evidence
})

const verifyProject = async ({ userId, projectId }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true }
    })
    if (!project) throw new AppError('Project not found', 404)
}

const runBatches = async (items, size, callback) => {
    for (let index = 0; index < items.length; index += size) {
        await callback(items.slice(index, index + size))
    }
}

const summarizeIndex = ({
    chunks,
    sourceCount,
    staleCount = 0,
    capability,
    reason = null
}) => {
    const embedded = chunks.filter((chunk) => Array.isArray(chunk.embedding)).length
    const latest = chunks.reduce((value, chunk) => {
        const updatedAt = new Date(chunk.updatedAt)
        return !value || updatedAt > value ? updatedAt : value
    }, null)
    const semanticStatus = chunks.length === 0
        ? 'EMPTY'
        : !capability.enabled
            ? 'DISABLED'
            : !capability.available
                ? 'UNAVAILABLE'
                : embedded === 0 && chunks.length > 0
                    ? 'UNAVAILABLE'
                    : embedded < chunks.length
                        ? 'PARTIAL'
                        : 'READY'

    return {
        status: sourceCount === 0 && chunks.length === 0
            ? 'EMPTY'
            : staleCount > 0 || chunks.length !== sourceCount
                ? 'STALE'
                : 'READY',
        sourceEvidence: sourceCount,
        indexedEvidence: chunks.length,
        embeddedEvidence: embedded,
        staleEvidence: staleCount,
        retrievalMode: ['READY', 'PARTIAL'].includes(semanticStatus) ? 'HYBRID' : 'LEXICAL',
        lastIndexedAt: latest,
        semantic: {
            status: semanticStatus,
            provider: capability.provider,
            model: capability.model,
            dimensions: capability.dimensions,
            reason: reason || (!capability.enabled
                ? 'Semantic retrieval is disabled by configuration'
                : chunks.length === 0
                    ? 'No project evidence is indexed yet'
                    : !capability.available
                        ? 'Embedding capability is unavailable for the configured provider'
                        : null)
        }
    }
}

export const getEvidenceIndexStatus = async ({ userId, projectId }) => {
    await verifyProject({ userId, projectId })
    const documents = (await loadProjectEvidence(projectId))
        .slice(0, MAX_INDEXED_EVIDENCE)
        .map(toDocument)
    const chunks = await prisma.projectEvidenceChunk.findMany({
        where: { projectId },
        select: {
            sourceId: true,
            contentHash: true,
            embedding: true,
            updatedAt: true
        }
    })
    const capability = getEmbeddingCapability()
    const expectedBySource = new Map(documents.map((document) => [
        document.sourceId,
        document.contentHash
    ]))
    const chunksBySource = new Map(chunks.map((chunk) => [chunk.sourceId, chunk]))
    const staleCount = documents.filter((document) => {
        const chunk = chunksBySource.get(document.sourceId)
        return !chunk || chunk.contentHash !== document.contentHash
    }).length + chunks.filter((chunk) => !expectedBySource.has(chunk.sourceId)).length

    return summarizeIndex({
        chunks,
        sourceCount: documents.length,
        staleCount,
        capability
    })
}

export const syncProjectEvidenceIndex = async ({ userId, projectId }) => {
    await verifyProject({ userId, projectId })
    const evidence = (await loadProjectEvidence(projectId)).slice(0, MAX_INDEXED_EVIDENCE)
    const documents = evidence.map(toDocument)
    const existing = await prisma.projectEvidenceChunk.findMany({
        where: { projectId },
        select: {
            sourceId: true,
            contentHash: true,
            embedding: true,
            embeddingModel: true,
            embeddingDimensions: true
        }
    })
    const existingBySource = new Map(existing.map((chunk) => [chunk.sourceId, chunk]))
    const currentSourceIds = new Set(documents.map((document) => document.sourceId))
    const capability = getEmbeddingCapability()
    const needsEmbedding = []

    await prisma.projectEvidenceChunk.deleteMany({
        where: documents.length === 0
            ? { projectId }
            : {
                projectId,
                sourceId: { notIn: [...currentSourceIds] }
            }
    })

    await runBatches(documents, EMBEDDING_BATCH_SIZE, async (batch) => {
        await Promise.all(batch.map(async (document) => {
            const prior = existingBySource.get(document.sourceId)
            const contentChanged = prior?.contentHash !== document.contentHash
            const embeddingOutdated = prior?.embeddingModel !== capability.model ||
                prior?.embeddingDimensions !== capability.dimensions
            const shouldEmbed = capability.available && (
                contentChanged || embeddingOutdated || !Array.isArray(prior?.embedding)
            )

            if (shouldEmbed) needsEmbedding.push(document)

            await prisma.projectEvidenceChunk.upsert({
                where: {
                    projectId_sourceId: {
                        projectId,
                        sourceId: document.sourceId
                    }
                },
                create: {
                    projectId,
                    ...document
                },
                update: {
                    ...document,
                    ...(contentChanged || embeddingOutdated
                        ? {
                            embedding: null,
                            embeddingModel: null,
                            embeddingDimensions: null
                        }
                        : {})
                }
            })
        }))
    })

    let degradedReason = null
    if (needsEmbedding.length > 0) {
        try {
            await runBatches(needsEmbedding, EMBEDDING_BATCH_SIZE, async (batch) => {
                const response = await generateEmbeddings(batch.map((item) => item.content))
                if (!response.available) {
                    degradedReason = response.reason
                    return
                }
                await Promise.all(batch.map((document, index) =>
                    prisma.projectEvidenceChunk.update({
                        where: {
                            projectId_sourceId: {
                                projectId,
                                sourceId: document.sourceId
                            }
                        },
                        data: {
                            embedding: response.vectors[index],
                            embeddingModel: response.model,
                            embeddingDimensions: response.dimensions
                        }
                    })
                ))
            })
        } catch (error) {
            degradedReason = 'Semantic indexing failed; lexical retrieval remains available'
            console.warn(JSON.stringify({
                level: 'warn',
                event: 'evidence_embedding_failed',
                projectId,
                errorName: error?.name,
                errorCode: error?.code,
                message: error?.message
            }))
        }
    }

    const chunks = await prisma.projectEvidenceChunk.findMany({
        where: { projectId },
        select: { embedding: true, updatedAt: true }
    })

    return summarizeIndex({
        chunks,
        sourceCount: documents.length,
        capability,
        reason: degradedReason
    })
}

const queryEmbedding = async (query) => {
    try {
        const response = await generateEmbeddings([query])
        return {
            vector: response.available ? response.vectors[0] : null,
            reason: response.reason || null
        }
    } catch (error) {
        console.warn(JSON.stringify({
            level: 'warn',
            event: 'query_embedding_failed',
            errorName: error?.name,
            errorCode: error?.code,
            message: error?.message
        }))
        return {
            vector: null,
            reason: 'Query embedding failed; lexical retrieval was used'
        }
    }
}

export const retrieveProjectEvidence = async ({
    userId,
    projectId,
    query,
    tokens,
    limit = 50
}) => {
    const index = await syncProjectEvidenceIndex({ userId, projectId })
    const chunks = await prisma.projectEvidenceChunk.findMany({
        where: { projectId },
        take: MAX_INDEXED_EVIDENCE,
        select: {
            sourceId: true,
            title: true,
            content: true,
            metadata: true,
            embedding: true
        }
    })
    const semantic = index.semantic.status === 'READY' || index.semantic.status === 'PARTIAL'
        ? await queryEmbedding(query)
        : { vector: null, reason: index.semantic.reason }
    const ranking = rankEvidenceChunks({
        chunks,
        query,
        tokens,
        queryEmbedding: semantic.vector,
        limit
    })
    const results = ranking.results.map((item) => ({
        ...item.metadata,
        relevance: item.relevance,
        retrieval: item.retrieval
    }))

    return {
        results,
        index,
        trace: {
            version: 'hybrid-rag-v1',
            query,
            mode: ranking.mode,
            indexedEvidence: chunks.length,
            candidateCount: ranking.candidates,
            returnedCount: results.length,
            semanticFallbackReason: semantic.vector ? null : semantic.reason,
            topCandidates: results.slice(0, 10).map((item) => ({
                id: item.id,
                type: item.type,
                rank: item.retrieval.rank,
                lexicalScore: item.retrieval.lexicalScore,
                semanticScore: item.retrieval.semanticScore
            }))
        }
    }
}
