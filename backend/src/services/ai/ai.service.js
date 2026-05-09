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

export const generateAIResponse =
    async ({
        systemPrompt,
        userPrompt,
        temperature
    }) => {
        return provider.generateText({
            systemPrompt,
            userPrompt,
            temperature
        })
    }
