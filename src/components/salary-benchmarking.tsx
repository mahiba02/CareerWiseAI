import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SalaryBenchmarking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comprehensive Salary Benchmarking</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          This module will provide detailed salary intelligence that is far more
          granular than traditional estimators. By factoring in role, industry,
          years of experience, specific skill sets, and geographic location, we
          provide a highly accurate salary range, empowering users to negotiate
          compensation with confidence.
        </p>
      </CardContent>
    </Card>
  );
}