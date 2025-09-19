"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, GraduationCap, Wrench, Lightbulb } from "lucide-react";

import { generateReportAction } from "@/app/actions";
import { profileFormSchema, type ProfileFormValues } from "@/lib/schemas";
import { quizQuestions } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function ProfileForm() {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      degree: "",
      skills: "",
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    setProgress(5);
    startTransition(async () => {
      // advance progress periodically up to 90% while waiting
      const timer = setInterval(() => {
        setProgress((p: number) => (p < 90 ? Math.min(90, p + Math.random() * 10) : p));
      }, 200);
      const result = await generateReportAction(values);

      if (result.success && result.data) {
        toast({
          title: "Success!",
          description: "Your personalized report has been generated.",
        });
        setProgress(100);
        sessionStorage.setItem("careerReport", JSON.stringify(result.data));
        router.push("/report");
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error || "There was a problem with your request.",
        });
        setProgress(0);
      }
      clearInterval(timer);
      setTimeout(() => setProgress(0), 600);
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold flex items-center gap-2"><Lightbulb className="w-8 h-8 text-primary"/> Tell Us About Yourself</CardTitle>
        <CardDescription>
          This information helps our AI craft your personalized career path.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {progress > 0 && (
              <div className="mb-2">
                <Progress value={progress} />
              </div>
            )}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><GraduationCap/> Academic Profile</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree/Major</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                          <SelectItem value="Final Year">Final Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Wrench/> Technical Skills</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List your skills, separated by commas (e.g., Python, React, SQL)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Personality Quick-Quiz</h3>
              {quizQuestions.map((question) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={question.id}
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{question.text}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          {question.options.map((option) => (
                            <FormItem
                              key={option.value}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={option.value} />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isPending} className="w-full" size="lg">
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate My Path
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
