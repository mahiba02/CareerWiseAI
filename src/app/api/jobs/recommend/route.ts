import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ReqSchema = z.object({
  title: z.string().min(2),
  skills: z.array(z.string()).default([]),
  location: z.string().optional(),
  experience: z.enum(["Entry", "Mid", "Senior"]).optional(),
  industries: z.array(z.string()).optional(),
  topK: z.number().int().positive().max(50).optional(),
});

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  seniority: "Entry" | "Mid" | "Senior";
  skills: string[];
  minSalary: number;
  maxSalary: number;
  remote?: boolean;
};

// Mock job corpus; replace with real-time postings from ingestion pipeline
const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Software Engineer (TypeScript/React)",
    company: "Acme Corp",
    location: "Remote",
    industry: "Technology",
    seniority: "Mid",
    skills: ["TypeScript", "React", "Node.js", "CI/CD"],
    minSalary: 110000,
    maxSalary: 140000,
    remote: true,
  },
  {
    id: "2",
    title: "Data Scientist",
    company: "DataWorks",
    location: "New York, NY",
    industry: "Finance",
    seniority: "Senior",
    skills: ["Python", "SQL", "Machine Learning", "Experimentation", "MLOps"],
    minSalary: 140000,
    maxSalary: 185000,
  },
  {
    id: "3",
    title: "Product Manager",
    company: "HealthPlus",
    location: "San Francisco, CA",
    industry: "Healthcare",
    seniority: "Mid",
    skills: ["Roadmapping", "User Research", "Analytics", "Agile"],
    minSalary: 135000,
    maxSalary: 170000,
  },
  {
    id: "4",
    title: "Software Engineer (Cloud)",
    company: "Nimbus",
    location: "Bengaluru, India",
    industry: "Technology",
    seniority: "Entry",
    skills: ["JavaScript", "AWS", "GCP", "CI/CD"],
    minSalary: 1800000,
    maxSalary: 2800000,
  },
  {
    id: "5",
    title: "ML Engineer",
    company: "VisionAI",
    location: "Remote",
    industry: "Technology",
    seniority: "Mid",
    skills: ["Python", "Deep Learning", "MLOps", "Docker"],
    minSalary: 125000,
    maxSalary: 165000,
    remote: true,
  },
];

function norm(s: string) {
  return s.toLowerCase();
}

function skillScore(userSkills: string[], jobSkills: string[]): { score: number; overlap: string[] } {
  if (!userSkills.length) return { score: 0.3, overlap: [] }; // modest baseline if unknown
  const u = new Set(userSkills.map(norm));
  const j = new Set(jobSkills.map(norm));
  const overlap: string[] = [];
  for (const sk of j) if (u.has(sk)) overlap.push(sk);
  const denom = new Set([...u, ...j]).size || 1;
  const jaccard = overlap.length / denom; // 0..1
  return { score: 0.3 + 0.7 * jaccard, overlap };
}

function titleScore(userTitle: string, jobTitle: string) {
  const u = norm(userTitle);
  const j = norm(jobTitle);
  if (j.includes(u) || u.includes(j)) return 1.0;
  const utoks = new Set(u.split(/[^a-z0-9]+/g).filter(Boolean));
  const jtoks = new Set(j.split(/[^a-z0-9]+/g).filter(Boolean));
  let match = 0;
  utoks.forEach((t) => { if (jtoks.has(t)) match++; });
  const denom = Math.max(utoks.size, 1);
  return Math.min(0.9, match / denom + 0.1);
}

function locationScore(userLoc?: string, jobLoc?: string) {
  if (!userLoc) return 0.6; // neutral if unknown
  if (!jobLoc) return 0.6;
  const u = norm(userLoc);
  const j = norm(jobLoc);
  if (u === "remote" && j.includes("remote")) return 1;
  if (u.includes("india") && j.includes("india")) return 0.9;
  if (u.includes("san francisco") && j.includes("san francisco")) return 0.9;
  if (u.includes("new york") && j.includes("new york")) return 0.9;
  if (u.split(",")[0] === j.split(",")[0]) return 0.8;
  return 0.5;
}

function seniorityScore(exp?: "Entry" | "Mid" | "Senior", job?: "Entry" | "Mid" | "Senior") {
  if (!exp || !job) return 0.6;
  if (exp === job) return 1.0;
  if (exp === "Mid" && job === "Entry") return 0.8;
  if (exp === "Senior" && job === "Mid") return 0.85;
  return 0.5;
}

function industryScore(userInd?: string[], jobInd?: string) {
  if (!userInd?.length || !jobInd) return 0.6;
  const j = norm(jobInd);
  const match = userInd.some((i) => norm(i) === j);
  return match ? 1.0 : 0.6;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { title, skills, location, experience, industries, topK = 10 } = ReqSchema.parse(json);

    const userSkills = skills.map((s) => s.trim()).filter(Boolean);

    const scored = MOCK_JOBS.map((job) => {
      const ts = titleScore(title, job.title);
      const { score: ss, overlap } = skillScore(userSkills, job.skills);
      const ls = locationScore(location, job.location);
      const es = seniorityScore(experience, job.seniority);
      const is = industryScore(industries, job.industry);
      const score = 0.35 * ss + 0.3 * ts + 0.2 * ls + 0.1 * es + 0.05 * is; // weighted blend
      const reason = [
        `Title match ${(ts * 100).toFixed(0)}%`,
        overlap.length ? `Skills overlap: ${overlap.join(", ")}` : undefined,
        location ? `Location match ${(ls * 100).toFixed(0)}%` : undefined,
        experience ? `Seniority match ${(es * 100).toFixed(0)}%` : undefined,
        industries?.length ? `Industry match ${(is * 100).toFixed(0)}%` : undefined,
      ].filter(Boolean);
      return { job, score, reason };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ job, score, reason }) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        industry: job.industry,
        seniority: job.seniority,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        remote: job.remote ?? false,
        match: Math.round(score * 100),
        reason,
      }));

    return NextResponse.json({ results: scored, count: scored.length }, { status: 200 });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
