"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

// Mock data and minimal projection logic (placeholder until data pipeline is wired)
const titles = ["Software Engineer", "Data Scientist", "Product Manager"]; 
const industries = ["Technology", "Finance", "Healthcare"]; 
const locations = ["Remote", "San Francisco, CA", "New York, NY", "London, UK"]; 
const experienceLevels = ["Entry", "Mid", "Senior"]; 

type Filters = {
  title: string;
  industry: string;
  location: string;
  experience: string;
};

type Recommendation = {
  id: string;
  title: string;
  company: string;
  location: string;
  industry: string;
  seniority: "Entry" | "Mid" | "Senior";
  minSalary: number;
  maxSalary: number;
  remote: boolean;
  match: number; // 0..100
  reason: string[];
};

const baseSalary = {
  "Software Engineer": 115000,
  "Data Scientist": 120000,
  "Product Manager": 130000,
} as const;

const geoAdjust = {
  Remote: 1.0,
  "San Francisco, CA": 1.35,
  "New York, NY": 1.25,
  "London, UK": 0.9,
} as const;

const expAdjust = { Entry: 0.8, Mid: 1.0, Senior: 1.25 } as const;

const skillPools: Record<string, { skill: string; demand: number }[]> = {
  "Software Engineer": [
    { skill: "TypeScript", demand: 88 },
    { skill: "React", demand: 91 },
    { skill: "Node.js", demand: 85 },
    { skill: "Cloud (AWS/GCP)", demand: 79 },
    { skill: "CI/CD", demand: 72 },
  ],
  "Data Scientist": [
    { skill: "Python", demand: 95 },
    { skill: "SQL", demand: 92 },
    { skill: "ML/Deep Learning", demand: 88 },
    { skill: "Experimentation", demand: 76 },
    { skill: "MLOps", demand: 70 },
  ],
  "Product Manager": [
    { skill: "Roadmapping", demand: 82 },
    { skill: "User Research", demand: 79 },
    { skill: "Analytics", demand: 77 },
    { skill: "Agile", demand: 74 },
    { skill: "Stakeholder Mgmt", demand: 72 },
  ],
};

function salarySeries(filters: Filters) {
  const base = baseSalary[filters.title as keyof typeof baseSalary] ?? 110000;
  const geo = geoAdjust[filters.location as keyof typeof geoAdjust] ?? 1.0;
  const exp = expAdjust[filters.experience as keyof typeof expAdjust] ?? 1.0;
  const mid = Math.round(base * geo * exp);
  return [
    { band: "P10", value: Math.round(mid * 0.7) },
    { band: "P25", value: Math.round(mid * 0.85) },
    { band: "P50", value: mid },
    { band: "P75", value: Math.round(mid * 1.15) },
    { band: "P90", value: Math.round(mid * 1.35) },
  ];
}

function growthProjection(filters: Filters) {
  // naive projection placeholder: 5y modest growth varying by title
  const baseIndex = { "Software Engineer": 1.08, "Data Scientist": 1.12, "Product Manager": 1.06 } as const;
  const factor = baseIndex[filters.title as keyof typeof baseIndex] ?? 1.07;
  const start = 100;
  return Array.from({ length: 6 }, (_, i) => ({ year: 2025 + i, index: Math.round(start * Math.pow(factor, i)) }));
}

function openingsSeries(filters: Filters) {
  const seed = filters.title.length + filters.location.length + filters.industry.length;
  return [
    { region: "Global", open: 25000 + (seed % 5000) },
    { region: "North America", open: 12000 + (seed % 2500) },
    { region: "Europe", open: 7000 + (seed % 2000) },
    { region: "APAC", open: 6000 + (seed % 1800) },
    { region: "India", open: 5000 + (seed % 1500) },
  ];
}

function companyOpenings(filters: Filters) {
  // Simple seeded mock by filters; replace with real API later
  const seed = (filters.title.charCodeAt(0) + filters.industry.charCodeAt(0) + filters.location.charCodeAt(0)) % 100;
  const base = 200 + seed;
  return [
    { company: "Google", open: base + 40 },
    { company: "Microsoft", open: base + 30 },
    { company: "Amazon", open: base + 20 },
    { company: "Meta", open: base + 15 },
    { company: "Apple", open: base + 10 },
    { company: "Infosys", open: base + 25 },
    { company: "TCS", open: base + 22 },
  ];
}

export default function InsightsPage() {
  const [filters, setFilters] = useState<Filters>({
    title: titles[0],
    industry: industries[0],
    location: locations[0],
    experience: experienceLevels[1],
  });

  const salaryData = useMemo(() => salarySeries(filters), [filters]);
  const growthData = useMemo(() => growthProjection(filters), [filters]);
  const openingsData = useMemo(() => openingsSeries(filters), [filters]);
  const skillsData = useMemo(() => skillPools[filters.title] ?? [], [filters.title]);
  const companyData = useMemo(() => companyOpenings(filters), [filters]);

  const [skillsText, setSkillsText] = useState<string>("");
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill skills from profile/resume or generated report if available
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const profileSkills = localStorage.getItem("profileSkills") || "";
      const resumeSkills = localStorage.getItem("resumeSkills") || "";
      let reportSkills = "";
      // Optional: parse generated report for skills if present
      const reportRaw = sessionStorage.getItem("careerReport");
      if (reportRaw) {
        try {
          const parsed = JSON.parse(reportRaw);
          // attempt common paths: parsed.profile?.skills or parsed.skills
          reportSkills = (parsed?.profile?.skills || parsed?.skills || "").toString();
        } catch {}
      }
      const merged = [profileSkills, resumeSkills, reportSkills]
        .filter(Boolean)
        .join(", ");
      if (!merged) return;
      const deduped = merged
        .split(",")
        .map((s) => s.trim())
        .filter((s) => !!s)
        .filter((s, i, arr) => arr.indexOf(s) === i)
        .join(", ");
      if (deduped && !skillsText) {
        setSkillsText(deduped);
      }
    } catch {}
    // Only run on mount; eslint disabled intentionally for dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRecommendations() {
    setLoading(true);
    setError(null);
    setRecs(null);
    try {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/jobs/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: filters.title,
          skills,
          location: filters.location,
          experience: filters.experience,
          industries: [filters.industry],
          topK: 10,
        }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as { results: Recommendation[] };
      setRecs(json.results);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Job Market Insights</h1>
        <p className="text-muted-foreground">
          In today's dynamic job market, professionals need comprehensive, data-driven insights to make informed career
          decisions across various industries and roles.
        </p>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Explore by role, industry, and location</CardTitle>
          <CardDescription>Adjust filters to personalize insights. Data sources will be transparently listed below.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Job Title</Label>
              <Select value={filters.title} onValueChange={(v) => setFilters({ ...filters, title: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select title" /></SelectTrigger>
                <SelectContent>
                  {titles.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={filters.industry} onValueChange={(v) => setFilters({ ...filters, industry: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {industries.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={filters.location} onValueChange={(v) => setFilters({ ...filters, location: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience</Label>
              <Select value={filters.experience} onValueChange={(v) => setFilters({ ...filters, experience: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Experience" /></SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary insights */}
      <Card>
        <CardHeader>
          <CardTitle>Salary insights</CardTitle>
          <CardDescription>Comprehensive compensation bands adjusted for location and experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ salary: { label: "Salary", color: "hsl(var(--primary))" } }}
            className="w-full"
          >
            <BarChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="band" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} width={60} />
              <ChartTooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-salary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <p className="text-sm text-muted-foreground mt-2">
            Bonus and equity vary by company stage and industry; expect 10-25% variance relative to P50.
          </p>
        </CardContent>
      </Card>

      {/* Skills landscape */}
      <Card>
        <CardHeader>
          <CardTitle>Skills landscape</CardTitle>
          <CardDescription>Current and emerging skills by job title with demand trajectory signals.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ demand: { label: "Demand", color: "hsl(var(--chart-2))" } }}
            className="w-full"
          >
            <BarChart data={skillsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" tickLine={false} axisLine={false} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="demand" fill="var(--color-demand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="text-sm mt-2">
            <span className="font-medium">Recommendations:</span> Prioritize 1-2 high-impact skills (P50→P75 salary delta),
            pair with one emerging skill aligned to your industry.
          </div>
        </CardContent>
      </Card>

      {/* Job market dynamics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>5-year growth projection</CardTitle>
            <CardDescription>Estimated role growth index (placeholder projection model).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ idx: { label: "Index", color: "hsl(var(--chart-3))" } }}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="index" stroke="var(--color-idx)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Openings by region</CardTitle>
            <CardDescription>Relative distribution of active job openings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ open: { label: "Openings", color: "hsl(var(--chart-4))" } }}>
              <BarChart data={openingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="open" fill="var(--color-open)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Openings by company */}
      <Card>
        <CardHeader>
          <CardTitle>Openings by company</CardTitle>
          <CardDescription>Top hiring companies based on current filters (mock data).</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ copen: { label: "Openings", color: "hsl(var(--chart-5))" } }}>
            <BarChart data={companyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="open" fill="var(--color-copen)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Job Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Job recommendations</CardTitle>
          <CardDescription>
            Get tailored job suggestions based on your selected title, industry, location, experience, and skills you provide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Label>Skills (comma separated)</Label>
              <Input
                className="mt-1"
                placeholder="e.g., TypeScript, React, SQL, Python, AWS"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={fetchRecommendations} disabled={loading}>
                {loading ? "Finding…" : "Find jobs"}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          {recs && (
            <div className="mt-6 space-y-3">
              {recs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches found. Try broadening your filters or skills.</p>
              ) : (
                recs.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <div className="font-medium">{r.title} — {r.company}</div>
                        <div className="text-muted-foreground text-sm">
                          {r.location} · {r.industry} · {r.seniority} · Match {r.match}%
                        </div>
                      </div>
                      <div className="text-sm font-mono">
                        ${""}{Math.round(r.minSalary).toLocaleString()} — ${""}{Math.round(r.maxSalary).toLocaleString()}
                      </div>
                    </div>
                    {r.reason?.length ? (
                      <ul className="mt-2 text-sm text-muted-foreground list-disc ml-4">
                        {r.reason.map((rs, i) => (
                          <li key={i}>{rs}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Executive summary removed per request */}
    </div>
  );
}
