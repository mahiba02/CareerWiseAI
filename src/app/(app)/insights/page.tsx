import { EmployerLandscape } from "@/components/employer-landscape";
import { JobTrends } from "@/components/job-trends";
import { SalaryBenchmarking } from "@/components/salary-benchmarking";
import { SkillsDemand } from "@/components/skills-demand";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InsightsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
      <JobTrends />
      <SkillsDemand />
      <SalaryBenchmarking />
      <EmployerLandscape />
    </div>
  );
}