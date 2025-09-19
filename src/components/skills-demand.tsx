import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SkillsDemand() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Demand Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          This module will identify the most in-demand hard and soft skills for
          any given career path. Users can benchmark their own skill set against
          market requirements, identify critical skills to acquire, and tailor
          their resumes to align with what employers are actively seeking.
        </p>
      </CardContent>
    </Card>
  );
}