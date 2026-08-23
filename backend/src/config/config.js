import { z } from 'zod'
import dotenv from 'dotenv'
import { validateOpenRouterModelPolicy } from './model-policy.js'

dotenv.config()

const envSchema = z.object({
    PORT: z.string().default('3000').transform(Number).refine((n) => n > 0 && n < 8555),
    NODE_ENV: z.enum(['dev', 'prod', 'test']),
    CLIENT_URL: z
        .url()
        .default('http://localhost:5173'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(2).default(0),
    DATABASE_URL: z
        .string()
        .min(1, 'DATABASE_URL is required'),

    JWT_ACCESS_SECRET: z
        .string()
        .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    ASSET_SIGNING_SECRET: z.string().min(32).optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    COOKIE_EXPIRES_IN: z.coerce.number().int().positive().default(7),
    AI_PROVIDER: z.enum([
        'openai',
        'openrouter'
    ]),
    AI_REQUIRE_FREE_MODELS: z.enum(['true', 'false']).default('false')
        .transform((value) => value === 'true'),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().optional(),

    AI_EMBEDDING_ENABLED: z.enum(['true', 'false']).default('true')
        .transform((value) => value === 'true'),
    AI_EMBEDDING_PROVIDER: z.enum(['openai', 'openrouter']).default('openrouter'),
    AI_EMBEDDING_MODEL: z.string().trim().min(1)
        .default('liquid/lfm-2.5-embedding-350m:free'),
    AI_EMBEDDING_DIMENSIONS: z.coerce.number().int().min(64).max(3072).default(1024),
    AI_EMBEDDING_INPUT_MAX_CHARS: z.coerce.number().int().min(256).max(32_000)
        .default(1600),
    AI_RERANK_ENABLED: z.enum(['true', 'false']).default('true')
        .transform((value) => value === 'true'),
    AI_RERANK_PROVIDER: z.literal('openrouter').default('openrouter'),
    AI_RERANK_MODEL: z.string().trim().min(1)
        .default('nvidia/llama-nemotron-rerank-vl-1b-v2:free'),
    AI_RERANK_MAX_CANDIDATES: z.coerce.number().int().min(2).max(100).default(40),

    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().trim().min(1)
        .default('dots-studio/dots-3-note-preview:free'),

    AI_REQUEST_TIMEOUT_MS: z.coerce
        .number()
        .int()
        .min(10_000)
        .max(600_000)
        .default(120_000),
    AI_MAX_RETRIES: z.coerce
        .number()
        .int()
        .min(0)
        .max(5)
        .default(0),
    AI_PROMPT_VERSION: z.string().trim().min(1).default('v1'),
    ANALYSIS_DAILY_LIMIT: z.coerce.number().int().positive().default(25),
    AI_QUESTION_DAILY_LIMIT: z.coerce.number().int().positive().default(50),
    ASSET_URL_TTL_SECONDS: z.coerce
        .number()
        .int()
        .min(60)
        .max(86_400)
        .default(900)
}).superRefine((env, context) => {
    const providerKey = env.AI_PROVIDER === 'openai'
        ? env.OPENAI_API_KEY
        : env.OPENROUTER_API_KEY
    const providerModel = env.AI_PROVIDER === 'openai'
        ? env.OPENAI_MODEL
        : env.OPENROUTER_MODEL

    if (!providerKey?.trim()) {
        context.addIssue({
            code: 'custom',
            path: [env.AI_PROVIDER === 'openai' ? 'OPENAI_API_KEY' : 'OPENROUTER_API_KEY'],
            message: `An API key is required for the ${env.AI_PROVIDER} provider`
        })
    }
    if (!providerModel?.trim()) {
        context.addIssue({
            code: 'custom',
            path: [env.AI_PROVIDER === 'openai' ? 'OPENAI_MODEL' : 'OPENROUTER_MODEL'],
            message: `A model is required for the ${env.AI_PROVIDER} provider`
        })
    }

    if (env.AI_EMBEDDING_ENABLED) {
        const embeddingKey = env.AI_EMBEDDING_PROVIDER === 'openrouter'
            ? env.OPENROUTER_API_KEY
            : env.OPENAI_API_KEY
        if (!embeddingKey?.trim()) {
            context.addIssue({
                code: 'custom',
                path: [env.AI_EMBEDDING_PROVIDER === 'openrouter'
                    ? 'OPENROUTER_API_KEY'
                    : 'OPENAI_API_KEY'],
                message: `An API key is required for the ${env.AI_EMBEDDING_PROVIDER} embedding provider`
            })
        }
        if (
            env.AI_EMBEDDING_MODEL === 'liquid/lfm-2.5-embedding-350m:free' &&
            env.AI_EMBEDDING_DIMENSIONS !== 1024
        ) {
            context.addIssue({
                code: 'custom',
                path: ['AI_EMBEDDING_DIMENSIONS'],
                message: 'The configured Liquid embedding model requires 1024 dimensions'
            })
        }
    }

    if (env.AI_RERANK_ENABLED && !env.OPENROUTER_API_KEY?.trim()) {
        context.addIssue({
            code: 'custom',
            path: ['OPENROUTER_API_KEY'],
            message: 'An OpenRouter API key is required when reranking is enabled'
        })
    }

    const modelPolicyViolations = validateOpenRouterModelPolicy({
        requireFree: env.AI_REQUIRE_FREE_MODELS,
        models: [
            env.AI_PROVIDER === 'openrouter' && {
                field: 'OPENROUTER_MODEL',
                model: env.OPENROUTER_MODEL
            },
            env.AI_EMBEDDING_ENABLED && env.AI_EMBEDDING_PROVIDER === 'openrouter' && {
                field: 'AI_EMBEDDING_MODEL',
                model: env.AI_EMBEDDING_MODEL
            },
            env.AI_RERANK_ENABLED && {
                field: 'AI_RERANK_MODEL',
                model: env.AI_RERANK_MODEL
            }
        ]
    })
    for (const violation of modelPolicyViolations) {
        context.addIssue({
            code: 'custom',
            path: [violation.field],
            message: violation.message
        })
    }
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error("Invalid ENV's")
    console.error(parsed.error.issues)
    process.exit(1)
}

export const config = {
    PORT: parsed.data.PORT,
    NODE_ENV: parsed.data.NODE_ENV,

    CLIENT_URL: parsed.data.CLIENT_URL,
    TRUST_PROXY_HOPS: parsed.data.TRUST_PROXY_HOPS,

    DATABASE_URL: parsed.data.DATABASE_URL,

    JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
    ASSET_SIGNING_SECRET: parsed.data.ASSET_SIGNING_SECRET || parsed.data.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN: parsed.data.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: parsed.data.JWT_REFRESH_EXPIRES_IN,
    COOKIE_EXPIRES_IN: parsed.data.COOKIE_EXPIRES_IN,

    AI_PROVIDER: parsed.data.AI_PROVIDER,
    AI_REQUIRE_FREE_MODELS: parsed.data.AI_REQUIRE_FREE_MODELS,
    OPENAI_MODEL: parsed.data.OPENAI_MODEL,
    OPENAI_API_KEY: parsed.data.OPENAI_API_KEY,
    AI_EMBEDDING_ENABLED: parsed.data.AI_EMBEDDING_ENABLED,
    AI_EMBEDDING_PROVIDER: parsed.data.AI_EMBEDDING_PROVIDER,
    AI_EMBEDDING_MODEL: parsed.data.AI_EMBEDDING_MODEL,
    AI_EMBEDDING_DIMENSIONS: parsed.data.AI_EMBEDDING_DIMENSIONS,
    AI_EMBEDDING_INPUT_MAX_CHARS: parsed.data.AI_EMBEDDING_INPUT_MAX_CHARS,
    AI_RERANK_ENABLED: parsed.data.AI_RERANK_ENABLED,
    AI_RERANK_PROVIDER: parsed.data.AI_RERANK_PROVIDER,
    AI_RERANK_MODEL: parsed.data.AI_RERANK_MODEL,
    AI_RERANK_MAX_CANDIDATES: parsed.data.AI_RERANK_MAX_CANDIDATES,
    OPENROUTER_API_KEY: parsed.data.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: parsed.data.OPENROUTER_MODEL,
    AI_REQUEST_TIMEOUT_MS: parsed.data.AI_REQUEST_TIMEOUT_MS,
    AI_MAX_RETRIES: parsed.data.AI_MAX_RETRIES,
    AI_PROMPT_VERSION: parsed.data.AI_PROMPT_VERSION,
    ANALYSIS_DAILY_LIMIT: parsed.data.ANALYSIS_DAILY_LIMIT,
    AI_QUESTION_DAILY_LIMIT: parsed.data.AI_QUESTION_DAILY_LIMIT,
    ASSET_URL_TTL_SECONDS: parsed.data.ASSET_URL_TTL_SECONDS

}
