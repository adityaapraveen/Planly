import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

import { config } from '../../../config/config.js'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

let client

const getClient = () => {
    if (!client) {
        client = new OpenAI({
            baseURL: OPENROUTER_API_URL,
            apiKey: config.OPENROUTER_API_KEY,
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
    generateEmbeddings: async ({ inputs, inputType }) => {
        const response = await getClient().embeddings.create({
            model: config.AI_EMBEDDING_MODEL,
            input: inputs,
            encoding_format: 'float',
            dimensions: config.AI_EMBEDDING_DIMENSIONS,
            input_type: inputType
        })

        return [...response.data]
            .sort((left, right) => left.index - right.index)
            .map((item) => item.embedding)
    },

    rerank: async ({ query, documents, topN }) => {
        const response = await fetch(`${OPENROUTER_API_URL}/rerank`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.AI_RERANK_MODEL,
                query,
                documents,
                top_n: topN
            }),
            signal: AbortSignal.timeout(config.AI_REQUEST_TIMEOUT_MS)
        })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
            const error = new Error(
                payload?.error?.message || `OpenRouter rerank failed with HTTP ${response.status}`
            )
            error.status = response.status
            error.code = payload?.error?.code || 'OPENROUTER_RERANK_FAILED'
            throw error
        }

        return {
            model: payload?.model || config.AI_RERANK_MODEL,
            provider: payload?.provider || 'openrouter',
            results: payload?.results
        }
    },

    generateText: async ({
        systemPrompt,
        userPrompt,
        temperature = 0.2
    }) => {
        const response = await getClient().chat.completions.create({
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

        const response = await getClient().chat.completions.create({
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
