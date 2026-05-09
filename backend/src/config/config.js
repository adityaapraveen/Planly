import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
    PORT: z.string().default(3000).transform(Number).refine((n) => n > 0 & n < 8555),
    NODE_ENV: z.enum(['dev', 'prod', 'test']),
    CLIENT_URL: z
        .url()
        .default("http://localhost:5173"),
    DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required"),

    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters"),

})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error("Invalid ENV's")
    console.error(parsed.error.issues)
    process.exit(1)
}

export const config = {
    PORT: parsed.data.PORT,
    NODE_ENV: parsed.NODE_ENV,
    CLIENT_URL: parsed.CLIENT_URL,
    JWT_SECRET: parsed.JWT_SECRET,
    DATABASE_URL: parsed.DATABASE_URL
}