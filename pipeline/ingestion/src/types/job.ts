export interface RawJobEvent {
  id_native: string;              // provider-specific ID
  source: string;                 // e.g. 'adzuna'
  fetched_at_utc: string;         // ISO timestamp
  payload: any;                   // original provider payload
  ingest_hash: string;            // dedupe hash (title|company|location|snippet)
  meta?: {
    status?: number;
    latency_ms?: number;
  };
}

export interface NormalizedJob {
  job_uid: string;                // internal UUID
  id_native: string;
  source: string;
  title_raw: string;
  title_std?: string;
  company_raw: string;
  company_std_id?: string;
  location_text?: string;
  geo?: { lat: number; lon: number; country?: string; region?: string; city?: string };
  remote_flag?: boolean;
  posted_date?: string;           // YYYY-MM-DD
  first_seen_at: string;          // ISO
  last_seen_at: string;           // ISO
  description_raw?: string;
  description_tokens?: number;
  skills_extracted?: string[];
  skills_normalized?: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  employment_type?: string;
  seniority?: string;
  demand_score?: number;
  meta?: Record<string, any>;
}
