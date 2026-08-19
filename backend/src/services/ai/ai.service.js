import { config } from '../../config/config.js'

import { openaiProvider } from './providers/openai.provider.js'
import { openrouterProvider } from './providers/openrouter.provider.js'

const providers = {
    openai: openaiProvider,
    openrouter: openrouterProvider
}

const provider = providers[config.AI_PROVIDER]

if (!provider) {
    throw new Error(`Unsupported AI provider: ${config.AI_PROVIDER}`)
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
    available: config.AI_EMBEDDING_ENABLED && Boolean(provider.generateEmbeddings),
    provider: config.AI_PROVIDER,
    model: config.AI_EMBEDDING_MODEL,
    dimensions: config.AI_EMBEDDING_DIMENSIONS
})

export const generateEmbeddings = async (inputs) => {
    const capability = getEmbeddingCapability()

    if (!capability.enabled) {
        return { ...capability, vectors: [], reason: 'Semantic retrieval is disabled' }
    }

    if (!capability.available) {
        return {
            ...capability,
            vectors: [],
            reason: `${config.AI_PROVIDER} does not provide embeddings in this configuration`
        }
    }

    const normalizedInputs = inputs.map((value) => String(value || '').trim())
    const vectors = await provider.generateEmbeddings({ inputs: normalizedInputs })

    if (vectors.length !== normalizedInputs.length || vectors.some((vector) =>
        !Array.isArray(vector) || vector.length !== capability.dimensions ||
        vector.some((value) => !Number.isFinite(value)))) {
        throw new Error('Embedding provider returned an invalid vector batch')
    }

    return { ...capability, vectors, reason: null }
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
