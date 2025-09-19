import axios from 'axios';

export interface AdzunaJobResult {
  id: string;
  title: string;
  location?: { display_name?: string };
  company?: { display_name?: string };
  created?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  contract_time?: string;
  redirect_url?: string;
}

export interface FetchAdzunaParams {
  appId: string;
  appKey: string;
  country: string; // e.g. 'us'
  what: string;    // search query
  page: number;    // 1-based page index per Adzuna API
  resultsPerPage: number; // page size (max 50 per docs)
}

export interface AdzunaResponse {
  results: AdzunaJobResult[];
  count: number; // total results estimate
  mean?: number;
}

export async function fetchAdzunaPage(params: FetchAdzunaParams): Promise<AdzunaResponse> {
  const { appId, appKey, country, what, page, resultsPerPage } = params;
  const url = `https://api.adzuna.com/v1/api/jobs/${encodeURIComponent(country)}/search/${page}`;
  const response = await axios.get(url, {
    params: {
      app_id: appId,
      app_key: appKey,
      what,
      results_per_page: resultsPerPage,
      content_type: 'application/json'
    },
    timeout: 15000
  });
  const data = response.data;
  return {
    results: data.results || [],
    count: data.count || 0,
    mean: data.mean
  };
}
