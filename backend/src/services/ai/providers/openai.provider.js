import OpenAI from 'openai'

import { config } from '../../../config/config.js'

const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY
})

export const openaiProvider = {
    generateText: async ({
        systemPrompt,
        userPrompt,
        temperature = 0.2
    }) => {
        const response = await client.chat.completions.create({
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
                },
            ]
        })
        return response.choices[0].message.content
    }
}