import { config } from '../../config/config.js'

import { openaiProvider } from './providers/openai.provider.js'
import { openrouterProvider } from './providers/openrouter.provider.js'

const providers = {
    openai: openaiProvider,
    openrouter: openrouterProvider
}

const provider = providers[config.AI_PROVIDER]
const embeddingProvider = providers[config.AI_EMBEDDING_PROVIDER]
const rerankProvider = providers[config.AI_RERANK_PROVIDER]

if (!provider) {
    throw new Error(`Unsupported AI provider: ${config.AI_PROVIDER}`)
}
if (!embeddingProvider) {
    throw new Error(`Unsupported embedding provider: ${config.AI_EMBEDDING_PROVIDER}`)
}
if (!rerankProvider) {
    throw new Error(`Unsupported rerank provider: ${config.AI_RERANK_PROVIDER}`)
}

const providerModels = {
    openai: config.OPENAI_MODEL,
    openrouter: config.OPENROUTER_MODEL
}

export const getAIProviderMetadata = () => ({
    provider: config.AI_PROVIDER,
    model: providerModels[config.AI_PROVIDER] || 'provider-default'
})

export const getEmbeddingCapability = () => ({
    enabled: config.AI_EMBEDDING_ENABLED,
    available: config.AI_EMBEDDING_ENABLED && Boolean(embeddingProvider.generateEmbeddings),
    provider: config.AI_EMBEDDING_PROVIDER,
    model: config.AI_EMBEDDING_MODEL,
    dimensions: config.AI_EMBEDDING_DIMENSIONS
})

export const generateEmbeddings = async (inputs, { inputType = 'search_document' } = {}) => {
    const capability = getEmbeddingCapability()

    if (!capability.enabled) {
        return { ...capability, vectors: [], reason: 'Semantic retrieval is disabled' }
    }

    if (!capability.available) {
        return {
            ...capability,
            vectors: [],
            reason: `${config.AI_EMBEDDING_PROVIDER} does not provide embeddings in this configuration`
        }
    }

    const normalizedInputs = inputs.map((value) =>
        String(value || '').trim().slice(0, config.AI_EMBEDDING_INPUT_MAX_CHARS)
    )
    const vectors = await embeddingProvider.generateEmbeddings({
        inputs: normalizedInputs,
        inputType
    })

    if (vectors.length !== normalizedInputs.length || vectors.some((vector) =>
        !Array.isArray(vector) || vector.length !== capability.dimensions ||
        vector.some((value) => !Number.isFinite(value)))) {
        throw new Error('Embedding provider returned an invalid vector batch')
    }

    return { ...capability, vectors, reason: null }
}

export const getRerankCapability = () => ({
    enabled: config.AI_RERANK_ENABLED,
    available: config.AI_RERANK_ENABLED && Boolean(rerankProvider.rerank),
    provider: config.AI_RERANK_PROVIDER,
    model: config.AI_RERANK_MODEL,
    maxCandidates: config.AI_RERANK_MAX_CANDIDATES
})

export const rerankDocuments = async ({ query, documents }) => {
    const capability = getRerankCapability()
    if (!capability.enabled) {
        return { ...capability, results: [], reason: 'Reranking is disabled' }
    }
    if (!capability.available) {
        return { ...capability, results: [], reason: 'Reranking is unavailable' }
    }

    const boundedDocuments = documents
        .slice(0, capability.maxCandidates)
        .map((document) => String(document || '').trim().slice(0, 4000))
    if (boundedDocuments.length < 2) {
        return {
            ...capability,
            results: [],
            reason: 'Not enough retrieval candidates to rerank'
        }
    }

    const response = await rerankProvider.rerank({
        query: String(query || '').trim().slice(0, 1000),
        documents: boundedDocuments,
        topN: boundedDocuments.length
    })
    if (!Array.isArray(response?.results)) {
        throw new Error('Rerank provider returned an invalid response')
    }

    return {
        ...capability,
        model: response.model || capability.model,
        provider: response.provider || capability.provider,
        results: response.results,
        candidateCount: boundedDocuments.length,
        reason: null
    }
}

export const generateAIResponse = async ({
    systemPrompt,
    userPrompt,
    temperature = 0.2
}) => {
    return provider.generateText({
        systemPrompt,
        userPrompt,
        temperature
    })
}

export const generateVisionResponse = async ({
    systemPrompt,
    userPrompt,
    imagePaths,
    temperature = 0.2
}) => {
    if (!provider.generateVision) {
        throw new Error(
            `${config.AI_PROVIDER} provider does not support vision`
        )
    }

    return provider.generateVision({
        systemPrompt,
        userPrompt,
        imagePaths,
        temperature
    })
}
