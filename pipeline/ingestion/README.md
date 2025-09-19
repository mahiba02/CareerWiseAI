# CareerWise Ingestion Service

Streaming ingestion microservice for job postings.

## Features (Incremental Build)
- Adzuna job fetcher (incremental pages)
- Env validation (Zod)
- Kafka producer abstraction (dev fallback to console)
- Normalization & dedupe placeholder
- Skill extraction placeholder

## Scripts
- `npm run dev` - Run with tsx (auto-reload)
- `npm run build` - TypeScript build
- `npm start` - Run compiled code

## Environment Variables
See `.env.example` for required values.

## Roadmap
1. Add additional sources (Jooble, JSearch)
2. Implement Redis-based dedupe cache
3. Add geocoding enrichment
4. Integrate skill embedding model service

