import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmployerLandscape() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employer Landscape Mapping</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          This module will help users understand the ecosystem of companies
          hiring for their target roles. It provides insights into which
          companies are hiring most aggressively, the typical size and type of
          these employers (e.g., startup vs. enterprise), and reviews of their
          corporate culture, offering a strategic view of potential employers.
        </p>
      </CardContent>
    </Card>
  );
}