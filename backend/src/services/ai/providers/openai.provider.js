import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

import { config } from '../../../config/config.js'

let client

const getClient = () => {
    if (!client) {
        client = new OpenAI({
            apiKey: config.OPENAI_API_KEY,
            timeout: config.AI_REQUEST_TIMEOUT_MS,
            maxRetries: config.AI_MAX_RETRIES
        })
    }
    return client
}

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

    throw new Error('OpenAI returned no completion content')
}

export const openaiProvider = {
    generateEmbeddings: async ({ inputs }) => {
        const response = await getClient().embeddings.create({
            model: config.AI_EMBEDDING_MODEL,
            input: inputs,
            encoding_format: 'float',
            dimensions: config.AI_EMBEDDING_DIMENSIONS
        })

        return [...response.data]
            .sort((left, right) => left.index - right.index)
            .map((item) => item.embedding)
    },

    generateText: async ({
        systemPrompt,
        userPrompt,
        temperature = 0.2
    }) => {
        const response = await getClient().chat.completions.create({
            model: config.OPENAI_MODEL,
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

        const response = await getClient().chat.completions.create({
            model: config.OPENAI_MODEL,
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
