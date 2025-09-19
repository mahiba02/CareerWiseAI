import ProfileForm from "@/components/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Route } from "lucide-react";

export default function RoadmapPage() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Build Your Roadmap</h1>
        <p className="mt-2 text-muted-foreground">Answer a few questions and we’ll generate your personalized career roadmap and skill tree.</p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Route className="text-primary"/> Roadmap Provider</CardTitle>
          <CardDescription>Provide your profile to create a tailored path.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
