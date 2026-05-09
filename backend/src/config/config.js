import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
    PORT: z.string().default('3000').transform(Number).refine((n) => n > 0 && n < 8555),
    NODE_ENV: z.enum(['dev', 'prod', 'test']),
    CLIENT_URL: z
        .url()
        .default('http://localhost:5173'),
    DATABASE_URL: z
        .string()
        .min(1, 'DATABASE_URL is required'),

    JWT_ACCESS_SECRET: z
        .string()
        .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    COOKIE_EXPIRES_IN: z.coerce.number().int().positive().default(7),
    AI_PROVIDER: z.enum([
        'openai',
        'anthropic',
        'openrouter'
    ]),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().optional(),

    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().optional(),

    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().optional(),

    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_URL: z.url()
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

    DATABASE_URL: parsed.data.DATABASE_URL,

    JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: parsed.data.JWT_ACCESS_EXPIRES_IN,
    JWT_REFRESH_EXPIRES_IN: parsed.data.JWT_REFRESH_EXPIRES_IN,
    COOKIE_EXPIRES_IN: parsed.data.COOKIE_EXPIRES_IN,

    AI_PROVIDER: parsed.data.AI_PROVIDER,
    OPENAI_MODEL: parsed.data.OPENAI_MODEL,
    OPENAI_API_KEY: parsed.data.OPENAI_API_KEY,
    OPENROUTER_API_KEY: parsed.data.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: parsed.data.OPENROUTER_MODEL,

    REDIS_HOST: parsed.data.REDIS_HOST,
    REDIS_URL: parsed.data.REDIS_URL,
    REDIS_PASSWORD: parsed.data.REDIS_PASSWORD,
    REDIS_PORT: parsed.data.REDIS_PORT

}
