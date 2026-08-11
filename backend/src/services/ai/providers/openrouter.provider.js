import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

import { config } from '../../../config/config.js'

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.OPENROUTER_API_KEY,
    timeout: config.AI_REQUEST_TIMEOUT_MS,
    maxRetries: config.AI_MAX_RETRIES
})

const imageToBase64 = async (imagePath) => {
    const buffer = await fs.readFile(imagePath)
    const ext = path.extname(imagePath).replace('.', '') || 'png'

    return `data:image/${ext};base64,${buffer.toString('base64')}`
}

const getResponseContent = (response) => {
    const content = response?.choices?.[0]?.message?.content

    if (typeof content === 'string' && content.trim()) {
        return content
    }

    const providerError = response?.error
    const error = new Error(
        providerError?.message ||
        'OpenRouter returned no completion content'
    )

    error.status = providerError?.code || 502
    error.code = providerError?.code || 'EMPTY_PROVIDER_RESPONSE'
    error.error = providerError

    throw error
}

export const openrouterProvider = {
    generateText: async ({
        systemPrompt,
        userPrompt,
        temperature = 0.2
    }) => {
        const response = await client.chat.completions.create({
            model: config.OPENROUTER_MODEL,
            temperature,
            response_format: {
                type: 'json_object'
            },
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        })

        return getResponseContent(response)
    },

    generateVision: async ({
        systemPrompt,
        userPrompt,
        imagePaths,
        temperature = 0.2
    }) => {
        const imageInputs = await Promise.all(
            imagePaths.map(async (imagePath) => ({
                type: 'image_url',
                image_url: {
                    url: await imageToBase64(imagePath)
                }
            }))
        )

        const response = await client.chat.completions.create({
            model: config.OPENROUTER_MODEL,
            temperature,
            response_format: {
                type: 'json_object'
            },
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: userPrompt
                        },
                        ...imageInputs
                    ]
                }
            ]
        })

        return getResponseContent(response)
    }
}
