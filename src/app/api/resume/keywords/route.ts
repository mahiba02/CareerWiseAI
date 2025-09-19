import { NextResponse } from 'next/server';

/*
  Simple ATS Keyword Suggestion Endpoint
  Input: JSON payload with (optional) fields: title, summary, skillGroups, skills, experience[], projects[]
  Output: { suggestions: { category: string; terms: string[]; rationale: string }[], missing: string[] }
  Strategy:
    1. Build a frequency map of existing tokens (normalized lowercase, stripped punctuation).
    2. Compare against curated baseline keyword sets for general tech + role-specific groups.
    3. Score and return keywords not present (or underrepresented) prioritized by role alignment & industry popularity.
*/

// Curated baseline sets (small heuristic set; extend as needed or replace with model call)
const BASE_SETS: Record<string, string[]> = {
  core: [
    'javascript','typescript','react','next.js','node.js','api','rest','graphql','testing','unit testing','integration','ci/cd','docker','kubernetes','cloud','aws','gcp','azure','microservices','performance','scalability','security','accessibility','responsive','ux','ui','agile','scrum','git'
  ],
  data: [
    'python','pandas','numpy','data analysis','data visualization','sql','etl','machine learning','modeling','predictive','statistics','a/b testing','feature engineering'
  ],
  product: [
    'roadmap','stakeholders','requirements','prioritization','kpi','metrics','user research','go-to-market','launch','experimentation'
  ],
  devops: [
    'infrastructure','terraform','ansible','monitoring','observability','logging','sre','incident response','automation'
  ]
};

// Map role/title hints to relevant sets
const ROLE_MAP: Record<string, string[]> = {
  developer: ['core'],
  engineer: ['core'],
  'software engineer': ['core'],
  'frontend': ['core'],
  'full stack': ['core','devops'],
  'devops': ['devops','core'],
  'data': ['data','core'],
  'product manager': ['product','core']
};

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+./\-\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && t.length < 30);
}

function extractExisting(data: any): Set<string> {
  const bag: string[] = [];
  const push = (v?: string) => { if (v) bag.push(v); };

  push(data.title);
  push(data.summary);
  if (data.skills) bag.push(data.skills);
  if (data.keywords) bag.push(data.keywords);

  if (data.skillGroups) {
    Object.values(data.skillGroups).forEach(v => push(String(v)));
  }
  (data.experience || []).forEach((e: any) => {
    push(e.title); push(e.company); (e.bullets||[]).forEach((b: any) => push(b.value));
  });
  (data.projects || []).forEach((p: any) => {
    push(p.name); push(p.tagline); push(p.stack); (p.bullets||[]).forEach((b: any) => push(b.value));
  });

  const tokens = bag.flatMap(normalizeTokens);
  return new Set(tokens);
}

function inferRoleSets(title: string | undefined): string[] {
  if (!title) return ['core'];
  const t = title.toLowerCase();
  const matched = Object.entries(ROLE_MAP)
    .filter(([k]) => t.includes(k))
    .flatMap(([, sets]) => sets);
  return matched.length ? Array.from(new Set(matched)) : ['core'];
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const existing = extractExisting(data);
    const roleSets = inferRoleSets(data.title);

    const candidateTerms: Record<string, string[]> = {};
    roleSets.forEach(setName => { candidateTerms[setName] = BASE_SETS[setName]; });

    // Always include a baseline core set
    if (!roleSets.includes('core')) candidateTerms.core = BASE_SETS.core;

    const suggestions: { category: string; terms: string[]; rationale: string }[] = [];
    const missingGlobal: Set<string> = new Set();

    Object.entries(candidateTerms).forEach(([category, terms]) => {
      const missing = terms.filter(term => !existing.has(term));
      if (missing.length) {
        missing.forEach(m => missingGlobal.add(m));
        suggestions.push({
          category,
          terms: missing.slice(0, 12), // limit to top 12 per category
          rationale: `These ${category} terms are common for roles similar to "${data.title || 'target role'}" and were not detected in your current content.`
        });
      }
    });

    return NextResponse.json({
      suggestions,
      missing: Array.from(missingGlobal).sort(),
      roleSets
    });
  } catch (err) {
    console.error('Keyword suggestion error:', err);
    return NextResponse.json({ error: 'Failed to generate keyword suggestions' }, { status: 500 });
  }
}
