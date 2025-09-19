import { z } from "zod";

export const profileFormSchema = z.object({
  degree: z.string().min(2, { message: "Degree must be at least 2 characters." }),
  year: z.string({ required_error: "Please select your year of study." }),
  skills: z.string().min(2, { message: "Please list at least one skill." }),
  q1: z.string({ required_error: "Please answer this question." }),
  q2: z.string({ required_error: "Please answer this question." }),
  q3: z.string({ required_error: "Please answer this question." }),
  q4: z.string({ required_error: "Please answer this question." }),
  q5: z.string({ required_error: "Please answer this question." }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const resourceFormSchema = z.object({
  skill: z.string().min(2, { message: "Skill must be at least 2 characters." }),
});

export type ResourceFormValues = z.infer<typeof resourceFormSchema>;
