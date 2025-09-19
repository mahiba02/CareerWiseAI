import 'dotenv/config';
import { logger } from './lib/logger.js';
import { loadConfig } from './lib/config.js';
import { fetchAdzunaPage } from './sources/adzuna.js';
import { stableHash } from './lib/hash.js';
import { createBus } from './lib/bus.js';

async function runAdzunaOnce() {
  const config = loadConfig();
  const bus = createBus({ KAFKA_BROKERS: process.env.KAFKA_BROKERS, KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID });
  const country = 'us';
  const what = 'software developer';
  const page = 1;
  const resultsPerPage = 20;
  const startTs = Date.now();
  const resp = await fetchAdzunaPage({
    appId: config.ADZUNA_APP_ID,
    appKey: config.ADZUNA_APP_KEY,
    country,
    what,
    page,
    resultsPerPage
  });
  const latencyMs = Date.now() - startTs;
  logger.info({ count: resp.results.length, latencyMs }, 'Adzuna fetch complete');
  const events = resp.results.map(r => ({
    id_native: r.id,
    source: 'adzuna',
    fetched_at_utc: new Date().toISOString(),
    payload: r,
    ingest_hash: stableHash([r.title, r.company?.display_name, r.location?.display_name, r.description?.slice(0,300)])
  }));
  logger.info({ sample: events[0] }, 'Sample raw job event');
  for (const evt of events) {
    await bus.produce({ topic: 'raw.jobs.adzuna', key: evt.id_native, value: evt });
  }
  await bus.disconnect();
}

async function main() {
  logger.info('Ingestion service starting (single-run demo)');
  try {
    await runAdzunaOnce();
  } catch (e) {
    logger.error({ err: e }, 'Adzuna fetch failed');
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Fatal start error', err);
  process.exit(1);
});
