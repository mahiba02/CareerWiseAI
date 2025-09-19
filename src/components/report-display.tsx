"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, BrainCircuit, Check, Cloud, GraduationCap, Smartphone, Sparkles, Target } from "lucide-react";

import type { GeneratePersonalizedCareerReportOutput } from "@/ai/flows/generate-personalized-career-report";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SkillTree from "@/components/skill-tree";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap: { [key: string]: React.ElementType } = {
  "AI Engineer": BrainCircuit,
  "Data Analyst": AreaChart,
  "Cloud Solutions Architect": Cloud,
  "Mobile App Developer": Smartphone,
  "default": GraduationCap,
};

function ReportSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-12">
      <div className="text-center">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
      </div>
      <div>
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="grid gap-8 md:grid-cols-3">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
      <div>
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function ReportDisplay() {
  const [report, setReport] = useState<GeneratePersonalizedCareerReportOutput | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const storedReport = sessionStorage.getItem("careerReport");
    if (storedReport) {
      try {
        const parsedReport = JSON.parse(storedReport);
        setReport(parsedReport);
        if (parsedReport.learningPlans && parsedReport.learningPlans.length > 0) {
          setSelectedSkill(parsedReport.learningPlans[0].skill);
        }
      } catch (error) {
        console.error("Failed to parse report from session storage", error);
        router.replace("/profile");
      }
    } else {
      router.replace("/profile");
    }
  }, [router]);

  if (!report) {
    return <ReportSkeleton />;
  }

  const { careerRecommendations, fitReasoning, learningPlans, skillTree } = report as any;

  const selectedLearningPlan = learningPlans?.find((p: { skill: string; plan: Array<{ day: number; task: string }> }) => p.skill === selectedSkill);

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 space-y-16">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
          Your Personalized Career Report
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Crafted by AI to match your unique profile and aspirations.
        </p>
      </header>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><GraduationCap className="text-primary"/>Top Career Recommendations</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {careerRecommendations.map((rec: { title: string; description: string }, index: number) => {
            const Icon = iconMap[rec.title] || iconMap.default;
            return (
              <Card key={index} className="shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                       <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{rec.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{rec.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3"><Sparkles className="text-primary"/>Why It&apos;s a Fit for You</h2>
        <Accordion type="single" collapsible className="w-full" defaultValue={`item-${fitReasoning[0]?.title}`}>
          {fitReasoning.map((fit: { title: string; reason: string }, index: number) => (
            <AccordionItem key={index} value={`item-${fit.title}`}>
              <AccordionTrigger className="text-lg font-semibold">{fit.title}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {fit.reason}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-3"><Target className="text-primary"/>Your 7-Day Learning Plan</CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardDescription className="text-lg">Select a skill to see your personalized 7-day plan to get a head start on your journey.</CardDescription>
              {learningPlans && learningPlans.length > 0 && (
                <Select onValueChange={setSelectedSkill} value={selectedSkill}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {learningPlans.map((plan: { skill: string }, index: number) => (
                      <SelectItem key={plan.skill} value={plan.skill}>
                        {plan.skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedLearningPlan ? (
              <div className="relative pl-6">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
                {selectedLearningPlan.plan.map((day: { day: number; task: string }, index: number) => (
                   <div key={index} className="relative mb-8 pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center -translate-x-1/2">
                          <span className="text-primary font-bold text-xs">{day.day}</span>
                      </div>
                      <div className="p-4 rounded-lg bg-card border">
                          <p className="font-semibold text-foreground">{day.task}</p>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Select a skill to see your learning plan.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {skillTree && skillTree.root && (
        <section>
          <SkillTree tree={skillTree} />
        </section>
      )}
    </div>
  );
}
