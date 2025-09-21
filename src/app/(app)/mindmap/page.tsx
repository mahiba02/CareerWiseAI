"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Brain, Target, Map } from "lucide-react";

import { generateMindMapAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import SkillTreeVisualization from "@/components/skill-tree-visualization";
import type { GenerateSkillMindMapOutput } from "@/ai/flows/generate-skill-mindmap";

const mindMapFormSchema = z.object({
  skill: z.string().min(1, "Skill is required"),
  targetLevel: z.string().optional(),
  currentLevel: z.string().optional(),
});

type MindMapFormValues = z.infer<typeof mindMapFormSchema>;

export default function MindMapPage() {
  const [isPending, startTransition] = useTransition();
  const [mindMapData, setMindMapData] = useState<GenerateSkillMindMapOutput | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const form = useForm<MindMapFormValues>({
    resolver: zodResolver(mindMapFormSchema),
    defaultValues: {
      skill: "",
      targetLevel: "expert",
      currentLevel: "none",
    },
  });

  const onSubmit = (values: MindMapFormValues) => {
    setMindMapData(null);
    setProgress(5);
    
    startTransition(async () => {
      // Simulate progress while loading
      const progressInterval = setInterval(() => {
        setProgress((p) => (p < 90 ? Math.min(90, p + Math.random() * 15) : p));
      }, 300);

      try {
        const result = await generateMindMapAction(values);
        
        if (result.success && result.data) {
          setMindMapData(result.data);
          setProgress(100);
          toast({
            title: "Learning Tree Generated!",
            description: `Created a comprehensive tree structure for ${values.skill}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Generation Failed",
            description: result.error || "Failed to generate learning tree. Please try again.",
          });
          setProgress(0);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unexpected Error",
          description: "Something went wrong. Please try again.",
        });
        setProgress(0);
      } finally {
        clearInterval(progressInterval);
        // Hide progress bar after completion
        setTimeout(() => setProgress(0), 1000);
      }
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Skill Learning Tree Generator
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enter any skill and get a comprehensive, interactive tree structure that breaks it down from basics to mastery.
        </p>
      </div>

      {/* Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Generate Learning Tree
          </CardTitle>
          <CardDescription>
            Create a detailed tree structure for any skill with AI-powered breakdown and progression.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Progress bar */}
              {progress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Generating learning tree...</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Skill input */}
              <FormField
                control={form.control}
                name="skill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      What skill do you want to learn?
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., React, Python, Machine Learning, Digital Marketing, Photography"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Level selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your current level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Complete Beginner</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your target level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit button */}
              <Button 
                type="submit" 
                disabled={isPending} 
                className="w-full" 
                size="lg"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Learning Tree...
                  </>
                ) : (
                  <>
                    <Map className="mr-2 h-5 w-5" />
                    Generate Learning Tree
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>

      {/* Loading state */}
      {isPending && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 mb-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Creating Your Learning Tree</h3>
          <p className="text-muted-foreground">
            AI is analyzing the skill and creating a comprehensive tree structure with detailed breakdowns...
          </p>
        </div>
      )}

      {/* Tree Visualization Display */}
      {mindMapData && !isPending && (
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="h-1 w-24 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full" />
          </div>
          <SkillTreeVisualization mindMapData={mindMapData.mindMap} />
        </div>
      )}
    </div>
  );
}