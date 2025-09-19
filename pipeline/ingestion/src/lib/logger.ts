import pino from 'pino';

const level = process.env.INGESTION_LOG_LEVEL || 'info';

export const logger = pino({
  level,
  base: { service: 'careerwise-ingestion' },
  timestamp: pino.stdTimeFunctions.isoTime
});
