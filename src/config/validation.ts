import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3555),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
  UPLOADTHING_SECRET: z.string().optional(),
});

export const validate = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error(z.prettifyError(result.error));
    throw new Error('Invalid environment configuration');
  }

  return result.data;
};
