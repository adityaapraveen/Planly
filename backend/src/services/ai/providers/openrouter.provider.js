import OpenAI from 'openai'

import { config } from '../../../config/config.js'

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',

    apiKey: config.OPENROUTER_API_KEY
})

export const openrouterProvider = {
    generateText: async ({
        systemPrompt,
        userPrompt,
        temperature = 0.2
    }) => {
        const response =
            await client.chat.completions.create({
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

        return response.choices[0].message.content
    }
}