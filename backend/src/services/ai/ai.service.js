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
