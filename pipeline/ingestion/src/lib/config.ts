import { z } from 'zod';

const schema = z.object({
  ADZUNA_APP_ID: z.string().min(1),
  ADZUNA_APP_KEY: z.string().min(1),
  KAFKA_BROKERS: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().default('careerwise-ingestion'),
  FETCH_INTERVAL_SECONDS: z.coerce.number().int().positive().default(300)
});

export type IngestionConfig = z.infer<typeof schema>;

export function loadConfig(): IngestionConfig {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error('Config validation failed: ' + msg);
  }
  return parsed.data;
}
