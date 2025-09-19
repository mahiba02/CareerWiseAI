'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Lazy import types for pdf only when needed (avoid SSR issues)
type GeneratedFormats = {
  markdown: string;
  plain: string;
  pdfBlob?: Blob;
};

const bulletSchema = z.object({ value: z.string().min(4) });
const datedRangeSchema = z.object({ start: z.string(), end: z.string().optional() });

const formSchema = z.object({
  // Contact Information
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(8, { message: "Please enter a valid phone number." }),
  location: z.string().min(2, { message: "Please enter your location." }),
  title: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),

  // Professional Summary
  // Relaxed min length from 50 to 20 to reduce friction generating quickly
  summary: z.string().min(20, { message: "Summary should be at least 20 characters." }).max(600, { message: 'Keep summary concise (<= 600 chars).' }),

  // Skills grouped
  skillGroups: z.object({
    languages: z.string().optional(),
    frameworks: z.string().optional(),
    databases: z.string().optional(),
    devops: z.string().optional(),
    tools: z.string().optional(),
    soft: z.string().optional(),
  }).optional(),
  // 'skills' can now be empty if grouped skills provided
  skills: z.string().optional(),

  // Experience
  experience: z.array(z.object({
    title: z.string().min(2),
    company: z.string().min(2),
    location: z.string().optional(),
    range: datedRangeSchema,
    bullets: z.array(bulletSchema).min(1, { message: 'At least 1 bullet.' }).max(8, { message: 'Max 8 bullets.' })
  })).optional(),

  // Projects
  projects: z.array(z.object({
    name: z.string().min(2),
    tagline: z.string().optional(),
    stack: z.string().optional(),
    link: z.string().url().optional(),
    bullets: z.array(bulletSchema).min(1).max(5)
  })).optional(),

  // Education
  education: z.array(z.object({
    institution: z.string().min(2),
    degree: z.string().min(2),
    location: z.string().optional(),
    range: datedRangeSchema.optional(),
    gpa: z.string().optional(),
    coursework: z.string().optional()
  })).optional(),

  // Certifications
  certifications: z.array(z.object({
    name: z.string().min(2),
    issuer: z.string().optional(),
    date: z.string().optional()
  })).optional(),

  // Achievements
  achievements: z.array(bulletSchema).optional(),

  // Languages (human)
  languages: z.array(z.object({ name: z.string(), level: z.string().optional() })).optional(),

  keywords: z.string().optional()
}) satisfies z.ZodType;

type FormData = z.infer<typeof formSchema>;

export default function ResumePage() {
  const { toast } = useToast();
  const debugId = React.useRef(`resume-debug-${Math.random().toString(36).slice(2)}`);
  React.useEffect(()=>{
    console.log('[ResumePage mount]', debugId.current);
  },[]);
  const [preview, setPreview] = React.useState<FormData | null>(null);
  const [generated, setGenerated] = React.useState<GeneratedFormats | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [generateClickCount, setGenerateClickCount] = React.useState(0);
  const [lastValidationErrors, setLastValidationErrors] = React.useState<string[] | null>(null);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      summary: "",
      title: "",
      linkedin: "",
      github: "",
      website: "",
      skills: "",
      skillGroups: { languages: '', frameworks: '', databases: '', devops: '', tools: '', soft: ''},
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      achievements: [],
      languages: [],
      keywords: "",
    },
  });

  // ----- Field Arrays -----
  const experienceArray = useFieldArray({ control: form.control, name: 'experience' as const });
  const projectsArray = useFieldArray({ control: form.control, name: 'projects' as const });
  const educationArray = useFieldArray({ control: form.control, name: 'education' as const });
  const certsArray = useFieldArray({ control: form.control, name: 'certifications' as const });
  const achievementsArray = useFieldArray({ control: form.control, name: 'achievements' as const });
  const languagesArray = useFieldArray({ control: form.control, name: 'languages' as const });

  // Components for nested bullets so hooks are not invoked inside loops
  const ExperienceBullets: React.FC<{ parentIndex: number }> = ({ parentIndex }) => {
    const bullets = useFieldArray({ control: form.control, name: `experience.${parentIndex}.bullets` as const });
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Bullets</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => bullets.append({ value: '' })}>Add Bullet</Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => experienceArray.remove(parentIndex)}>Remove Role</Button>
          </div>
        </div>
        {bullets.fields.map((b,i) => (
          <FormField key={b.id} control={form.control} name={`experience.${parentIndex}.bullets.${i}.value` as const} render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Improved X by Y% ..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        ))}
      </div>
    );
  };

  const ProjectBullets: React.FC<{ parentIndex: number }> = ({ parentIndex }) => {
    const bullets = useFieldArray({ control: form.control, name: `projects.${parentIndex}.bullets` as const });
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Bullets</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => bullets.append({ value: '' })}>Add Bullet</Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => projectsArray.remove(parentIndex)}>Remove Project</Button>
          </div>
        </div>
        {bullets.fields.map((b,i) => (
          <FormField key={b.id} control={form.control} name={`projects.${parentIndex}.bullets.${i}.value` as const} render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Implemented feature X ..." {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        ))}
      </div>
    );
  };

  const buildMarkdown = (data: FormData): string => {
    const lines: string[] = [];
    lines.push(`# ${data.fullName}`);
    if (data.title) lines.push(`**${data.title}**`);
    lines.push(`${data.location} | ${data.email} | ${data.phone}`);
    const linksLine = [data.linkedin, data.github, data.website].filter(Boolean).join(' | ');
    if (linksLine) lines.push(linksLine);
    lines.push('', '## Professional Summary', data.summary, '');
    const groups = data.skillGroups || {} as any;
    const skillSectionParts: string[] = [];
    Object.entries(groups).forEach(([k,v])=> { if (v) skillSectionParts.push(`**${k.toUpperCase()}**: ${v}`); });
    if (skillSectionParts.length) {
      lines.push('## Skills');
      lines.push(...skillSectionParts);
      lines.push('');
    } else if (data.skills) {
      lines.push('## Skills');
      data.skills.split(',').map(s=>s.trim()).forEach(s=> lines.push(`- ${s}`));
      lines.push('');
    }
    if (data.experience?.length) {
      lines.push('## Experience');
      data.experience.forEach(exp => {
        lines.push(`### ${exp.title} – ${exp.company}`);
        const range = `${exp.range.start}${exp.range.end ? ' – ' + exp.range.end : ''}`;
        lines.push(`${range}${exp.location ? ' | ' + exp.location : ''}`);
        exp.bullets.forEach(b=> lines.push(`- ${b.value}`));
        lines.push('');
      });
    }
    if (data.projects?.length) {
      lines.push('## Projects');
      data.projects.forEach(p => {
        lines.push(`### ${p.name}${p.tagline ? ' – ' + p.tagline : ''}`);
        if (p.stack) lines.push(`Stack: ${p.stack}`);
        if (p.link) lines.push(p.link);
        p.bullets.forEach(b=> lines.push(`- ${b.value}`));
        lines.push('');
      });
    }
    if (data.education?.length) {
      lines.push('## Education');
      data.education.forEach(e => {
        lines.push(`### ${e.degree} – ${e.institution}`);
        if (e.range) lines.push(`${e.range.start}${e.range.end ? ' – ' + e.range.end : ''}`);
        if (e.gpa) lines.push(`GPA: ${e.gpa}`);
        if (e.coursework) lines.push(`Coursework: ${e.coursework}`);
        lines.push('');
      });
    }
    if (data.certifications?.length) {
      lines.push('## Certifications');
      data.certifications.forEach(c => lines.push(`- ${c.name}${c.issuer? ' – ' + c.issuer : ''}${c.date? ' ('+c.date+')':''}`));
      lines.push('');
    }
    if (data.achievements?.length) {
      lines.push('## Achievements');
      data.achievements.forEach(a => lines.push(`- ${a.value}`));
      lines.push('');
    }
    if (data.languages?.length) {
      lines.push('## Languages');
      lines.push(data.languages.map(l=> `${l.name}${l.level? ' ('+l.level+')':''}`).join(', '));
      lines.push('');
    }
    if (data.keywords) {
      lines.push('## Keywords');
      lines.push(data.keywords);
    }
    return lines.join('\n');
  };

  const buildPlain = (data: FormData): string => buildMarkdown(data).replace(/^#+\s?/gm,'').replace(/\*/g,'');

  const generatePdf = async (data: FormData): Promise<Blob> => {
    // @ts-ignore - pdf-lib has no bundled types in this setup
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    let page = doc.addPage();
    let { width, height } = page.getSize();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const headingSize = 13;
    const bodySize = 10.5;
    const lineGap = 14;
    let y = height - 48;

    const newPage = () => {
      page = doc.addPage();
      ({ width, height } = page.getSize());
      y = height - 48;
    };
    const ensure = (min: number) => { if (y - min < 40) newPage(); };
    const wrapText = (t: string, maxWidth: number, size: number, fnt: any) => {
      const words = t.split(/\s+/);
      let line = '';
      const lines: string[] = [];
      words.forEach(w => {
        const test = line ? line + ' ' + w : w;
        const wWidth = fnt.widthOfTextAtSize(test, size);
        if (wWidth > maxWidth && line) {
          lines.push(line);
          line = w;
        } else {
          line = test;
        }
      });
      if (line) lines.push(line);
      return lines;
    };
    const text = (t: string, opts: { bold?: boolean; size?: number } = {}) => {
      const size = opts.size || bodySize;
      const fnt = opts.bold ? fontBold : font;
      const lines = wrapText(t, width - 108, size, fnt); // 54 left + 54 right margin
      lines.forEach(line => {
        ensure(size + 2);
        page.drawText(line, { x: 54, y, size, font: fnt, color: rgb(0,0,0) });
        y -= lineGap;
      });
    };
    const section = (title: string) => { y -= 4; text(title.toUpperCase(), { bold: true, size: headingSize }); };

    // Header
    text(data.fullName, { bold: true, size: 18 });
    if (data.title) text(data.title, { size: 11 });
    text(`${data.location} | ${data.email} | ${data.phone}`, { size: 9.5 });
    const links = [data.linkedin, data.github, data.website].filter(Boolean).join(' | ');
    if (links) text(links, { size: 9 });
    y -= 6;

    // Summary
    section('Professional Summary');
    data.summary.split(/\n+/).forEach(l => text(l));

    // Skills
    const groups = data.skillGroups || {} as any;
    const groupEntries = Object.entries(groups).filter(([_,v])=>v);
    if (groupEntries.length || data.skills) {
      section('Skills');
      if (groupEntries.length) {
        // render two columns for groups
        const colGap = 28;
        const colWidth = (width - 108 - colGap) / 2; // margins and gap
        const entries = groupEntries.map(([k,v]) => ({ label: k.toUpperCase(), value: v as string }));
        let col = 0;
        entries.forEach((e, idx) => {
          const lines = wrapText(`${e.label}: ${e.value}`, colWidth, bodySize, font);
          const startX = 54 + (col * (colWidth + colGap));
          lines.forEach((ln, li) => {
            ensure(bodySize + 2);
            page.drawText(ln, { x: startX, y, size: bodySize, font, color: rgb(0,0,0) });
            y -= lineGap;
          });
          if (col === 1) {
            col = 0;
            y -= 4; // space between row pairs
          } else {
            col = 1;
          }
          // new page safety
          if (y < 60) { newPage(); }
        });
        if (col === 1) { y -= 6; }
      } else if (data.skills) {
        data.skills.split(',').map(s=>s.trim()).filter(Boolean).forEach(s=> text(`• ${s}`));
      }
    }

    // Experience
    if (data.experience?.length) {
      section('Experience');
      data.experience.forEach(exp => {
        text(`${exp.title} – ${exp.company}`, { bold: true });
        const range = `${exp.range.start}${exp.range.end ? ' – ' + exp.range.end : ''}`;
        text(`${range}${exp.location ? ' | ' + exp.location : ''}`, { size: 9 });
        exp.bullets.forEach(b => text(`• ${b.value}`));
        y -= 4;
      });
    }

    // Projects
    if (data.projects?.length) {
      section('Projects');
      data.projects.forEach(p => {
        text(`${p.name}${p.tagline ? ' – ' + p.tagline : ''}`, { bold: true });
        if (p.stack) text(`Stack: ${p.stack}`, { size: 9 });
        if (p.link) text(p.link, { size: 9 });
        p.bullets.forEach(b => text(`• ${b.value}`));
        y -= 4;
      });
    }

    // Education
    if (data.education?.length) {
      section('Education');
      data.education.forEach(e => {
        text(`${e.degree} – ${e.institution}`, { bold: true });
        if (e.range) text(`${e.range.start}${e.range.end ? ' – ' + e.range.end : ''}`, { size: 9 });
        if (e.gpa) text(`GPA: ${e.gpa}`, { size: 9 });
        if (e.coursework) text(`Coursework: ${e.coursework}`, { size: 9 });
        y -= 4;
      });
    }

    if (data.certifications?.length) {
      section('Certifications');
      data.certifications.forEach(c => text(`${c.name}${c.issuer? ' – ' + c.issuer : ''}${c.date? ' ('+c.date+')':''}`));
    }

    if (data.achievements?.length) {
      section('Achievements');
      data.achievements.forEach(a => text(`• ${a.value}`));
    }

    if (data.languages?.length) {
      section('Languages');
      text(data.languages.map(l => `${l.name}${l.level? ' ('+l.level+')':''}`).join(', '));
    }

    if (data.keywords) {
      section('Keywords');
      text(data.keywords, { size: 9 });
    }

    const pdf = await doc.save();
    const uint8 = new Uint8Array(pdf);
    return new Blob([uint8], { type: 'application/pdf' });
  };

  const handleGenerate = async (values: FormData) => {
    // If plain skills empty but grouped skills present, synthesize a flat skills string for downstream usage
    if ((!values.skills || !values.skills.trim()) && values.skillGroups) {
      const flat = Object.values(values.skillGroups).filter(Boolean).join(', ');
      if (flat) {
        values.skills = flat; // mutate safe before use
      }
    }
    if ((!values.skills || !values.skills.trim())) {
      // still empty – provide a soft default to avoid validation friction
      values.skills = 'General Skills';
    }
    console.log('[Generate] handler invoked', { debug: debugId.current, valuesSnapshot: { fullName: values.fullName, summaryLen: values.summary?.length, experience: values.experience?.length, projects: values.projects?.length } });
    try {
      setIsGenerating(true);
      setLastValidationErrors(null);
      setPreview(values);
      const markdown = buildMarkdown(values);
      const plain = buildPlain(values);
      let pdfBlob: Blob | undefined;
      try { pdfBlob = await generatePdf(values); } catch (e) { console.warn('PDF generation failed', e); }
      setGenerated({ markdown, plain, pdfBlob });
      toast({ title: 'Resume Generated', description: 'You can now download your resume.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (values: FormData) => {
    try {
      setIsSaving(true);
      // Placeholder: localStorage; replace with API call later
      localStorage.setItem('careerwise.resume.latest', JSON.stringify(values));
      toast({ title: 'Resume Saved', description: 'Stored locally (replace with DB persistence).' });
    } finally { setIsSaving(false); }
  };

  const download = (kind: 'markdown' | 'plain' | 'pdf') => {
    if (!generated) return;
    if (kind === 'pdf') {
      if (!generated.pdfBlob) { toast({ title: 'PDF unavailable', description: 'Could not generate PDF.' }); return; }
      const url = URL.createObjectURL(generated.pdfBlob);
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.pdf'; a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const blob = new Blob([generated[kind]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = kind === 'markdown' ? 'resume.md' : 'resume.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Server-side PDF (ensures consistency, future advanced formatting like custom fonts)
  const downloadServerPdf = async () => {
    try {
      const values = form.getValues();
      const res = await fetch('/api/resume/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!res.ok) { toast({ title: 'Server PDF failed', description: 'Server responded with an error.' }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'resume.pdf'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast({ title: 'Server PDF error', description: 'Check console for details.' });
    }
  };

  // ATS Keyword suggestions panel state
  const [keywordSuggestions, setKeywordSuggestions] = React.useState<null | { suggestions: any[]; missing: string[]; roleSets: string[] }>(null);
  const [loadingKeywords, setLoadingKeywords] = React.useState(false);
  const fetchKeywordSuggestions = async () => {
    try {
      setLoadingKeywords(true);
      setKeywordSuggestions(null);
      const values = form.getValues();
      const res = await fetch('/api/resume/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!res.ok) { toast({ title: 'Keyword suggestion failed', description: 'Server responded with an error.' }); return; }
      const json = await res.json();
      setKeywordSuggestions(json);
    } catch (e) {
      console.error(e);
      toast({ title: 'Keyword error', description: 'Could not fetch suggestions.' });
    } finally { setLoadingKeywords(false); }
  };

  const addKeyword = (term: string) => {
    const current = form.getValues('keywords') || '';
    const list = current ? current.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!list.includes(term)) {
      list.push(term);
      form.setValue('keywords', list.join(', '));
      toast({ title: 'Keyword added', description: term });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Resume Builder</CardTitle>
            <CardDescription>
              Create your professional resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="resume-form" onSubmit={form.handleSubmit(handleGenerate, (errs)=> {
                console.warn('[Generate] validation errors', errs);
                // Focus first invalid field
                const firstKey = Object.keys(errs)[0];
                if (firstKey) {
                  const el = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
                  if (el && typeof el.focus === 'function') el.focus();
                }
                const first: any = Object.values(errs)[0];
                const messages = Object.values(errs).map((e:any)=> e?.message).filter(Boolean);
                setLastValidationErrors(messages.length? messages as string[] : ['Unknown validation error']);
                toast({ title: 'Please fix form errors', description: first?.message || 'Missing required fields.' });
              })} className="space-y-8 relative">
                {/* Debug overlay */}
                <div className="pointer-events-none select-none text-[10px] opacity-60 absolute -top-6 right-0 font-mono">{debugId.current}</div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(123) 456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="City, State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Software Engineer | React Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.linkedin.com/in/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://github.com/username" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio / Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourportfolio.com" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Professional Summary</h3>
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write a brief professional summary..."
                            className="min-h-[100px]"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <p className="text-[11px] text-muted-foreground">Min 20 chars, ideal 3-5 concise impact sentences.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Skills (Grouped)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['languages','frameworks','databases','devops','tools','soft'] as const).map(key => (
                      <FormField key={key}
                        control={form.control}
                        name={`skillGroups.${key}` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">{key}</FormLabel>
                            <FormControl>
                              <Input placeholder={key === 'soft' ? 'Communication, Leadership' : 'Comma separated'} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ATS Keywords (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="microservices, distributed systems, AWS, scalability" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Experience Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-between">Experience
                    <Button type="button" size="sm" variant="outline" onClick={() => experienceArray.append({ title: '', company: '', location: '', range: { start: '', end: '' }, bullets: [{ value: '' }] })}>Add</Button>
                  </h3>
                  <div className="space-y-6">
                    {experienceArray.fields.map((field, idx) => (
                      <div key={field.id} className="border rounded-md p-4 space-y-3 bg-muted/20">
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`experience.${idx}.title` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl><Input placeholder="Software Engineer" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`experience.${idx}.company` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl><Input placeholder="Company" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`experience.${idx}.location` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl><Input placeholder="City / Remote" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name={`experience.${idx}.range.start` as const} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start</FormLabel>
                                  <FormControl><Input placeholder="Jan 2023" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`experience.${idx}.range.end` as const} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End</FormLabel>
                                  <FormControl><Input placeholder="Present" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </div>
                          </div>
                          <ExperienceBullets parentIndex={idx} />
                        </div>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-between">Projects
                    <Button type="button" size="sm" variant="outline" onClick={() => projectsArray.append({ name: '', tagline: '', stack: '', link: '', bullets: [{ value: '' }] })}>Add</Button>
                  </h3>
                  <div className="space-y-6">
                    {projectsArray.fields.map((field, idx) => (
                      <div key={field.id} className="border rounded-md p-4 space-y-3 bg-muted/20">
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`projects.${idx}.name` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl><Input placeholder="Project Name" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`projects.${idx}.tagline` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tagline</FormLabel>
                                <FormControl><Input placeholder="Short description" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`projects.${idx}.stack` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stack</FormLabel>
                                <FormControl><Input placeholder="React, Node, PostgreSQL" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`projects.${idx}.link` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link</FormLabel>
                                <FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <ProjectBullets parentIndex={idx} />
                        </div>
                    ))}
                  </div>
                </div>

                {/* Education Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-between">Education
                    <Button type="button" size="sm" variant="outline" onClick={() => educationArray.append({ institution: '', degree: '', location: '', range: { start: '', end: '' }, gpa: '', coursework: '' })}>Add</Button>
                  </h3>
                  <div className="space-y-6">
                    {educationArray.fields.map((field, idx) => (
                      <div key={field.id} className="border rounded-md p-4 space-y-3 bg-muted/20">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField control={form.control} name={`education.${idx}.degree` as const} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Degree</FormLabel>
                              <FormControl><Input placeholder="B.Tech Computer Science" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`education.${idx}.institution` as const} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Institution</FormLabel>
                              <FormControl><Input placeholder="University" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`education.${idx}.location` as const} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl><Input placeholder="City" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name={`education.${idx}.range.start` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start</FormLabel>
                                <FormControl><Input placeholder="2021" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`education.${idx}.range.end` as const} render={({ field }) => (
                              <FormItem>
                                <FormLabel>End</FormLabel>
                                <FormControl><Input placeholder="2025" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name={`education.${idx}.gpa` as const} render={({ field }) => (
                            <FormItem>
                              <FormLabel>GPA</FormLabel>
                              <FormControl><Input placeholder="8.7/10" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`education.${idx}.coursework` as const} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coursework</FormLabel>
                              <FormControl><Input placeholder="DSA, OS, DBMS, ML" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" size="sm" variant="destructive" onClick={() => educationArray.remove(idx)}>Remove Education</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-between">Certifications
                    <Button type="button" size="sm" variant="outline" onClick={() => certsArray.append({ name: '', issuer: '', date: '' })}>Add</Button>
                  </h3>
                  <div className="space-y-4">
                    {certsArray.fields.map((field, idx) => (
                      <div key={field.id} className="grid md:grid-cols-3 gap-4 items-start">
                        <FormField control={form.control} name={`certifications.${idx}.name` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input placeholder="AWS Certified Developer" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`certifications.${idx}.issuer` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuer</FormLabel>
                            <FormControl><Input placeholder="Amazon" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex gap-2">
                          <FormField control={form.control} name={`certifications.${idx}.date` as const} render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Date</FormLabel>
                              <FormControl><Input placeholder="2024" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <Button type="button" size="sm" variant="destructive" onClick={() => certsArray.remove(idx)}>X</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-between">Achievements
                    <Button type="button" size="sm" variant="outline" onClick={() => achievementsArray.append({ value: '' })}>Add</Button>
                  </h3>
                  <div className="space-y-2">
                    {achievementsArray.fields.map((field, idx) => (
                      <div key={field.id} className="flex gap-2 items-start">
                        <FormField control={form.control} name={`achievements.${idx}.value` as const} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder="Placed 2nd in Hackathon with 150+ teams" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="button" size="sm" variant="destructive" onClick={() => achievementsArray.remove(idx)}>X</Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center justify-between">Languages
                    <Button type="button" size="sm" variant="outline" onClick={() => languagesArray.append({ name: '', level: '' })}>Add</Button>
                  </h3>
                  <div className="space-y-2">
                    {languagesArray.fields.map((field, idx) => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 items-start">
                        <FormField control={form.control} name={`languages.${idx}.name` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl><Input placeholder="English" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`languages.${idx}.level` as const} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level</FormLabel>
                            <FormControl><Input placeholder="Fluent / Native / Intermediate" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex items-end">
                          <Button type="button" size="sm" variant="destructive" onClick={() => languagesArray.remove(idx)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <Button type="submit" disabled={isGenerating} onClick={()=>{setGenerateClickCount(c=>c+1); console.log('Submitting resume generate', {click: generateClickCount+1, debug: debugId.current});}}>{isGenerating ? 'Generating...' : 'Generate Resume'}</Button>
                  <Button type="button" variant="secondary" onClick={form.handleSubmit(handleSave)} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
                  {generated && (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => download('pdf')} disabled={!generated.pdfBlob}>PDF</Button>
                      <Button type="button" variant="outline" onClick={() => download('markdown')}>Markdown</Button>
                      <Button type="button" variant="outline" onClick={() => download('plain')}>Text</Button>
                      <Button type="button" variant="outline" onClick={downloadServerPdf}>PDF (Server)</Button>
                      <Button type="button" variant="outline" onClick={fetchKeywordSuggestions} disabled={loadingKeywords}>{loadingKeywords ? 'Keywords...' : 'ATS Keywords'}</Button>
                    </div>
                  )}
                </div>
                {keywordSuggestions && (
                  <div className="mt-6 border rounded-md p-4 bg-muted/20">
                    <h4 className="font-semibold mb-2">ATS Keyword Suggestions</h4>
                    <p className="text-xs text-muted-foreground mb-2">Detected role sets: {keywordSuggestions.roleSets.join(', ')}</p>
                    <div className="space-y-4">
                      {keywordSuggestions.suggestions.map((s:any) => (
                        <div key={s.category} className="border rounded p-3 bg-background/60">
                          <p className="font-medium text-sm mb-1">{s.category.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground mb-2 leading-snug">{s.rationale}</p>
                          <div className="flex flex-wrap gap-2">
                            {s.terms.map((t:string) => (
                              <button key={t} type="button" onClick={() => addKeyword(t)} className="text-xs px-2 py-1 rounded border hover:bg-muted transition">
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] mt-3 text-muted-foreground">Click a term to add it to the Keywords field.</p>
                  </div>
                )}
                {preview && (
                  <div className="mt-8 border rounded-md p-6 bg-muted/30">
                    <h3 className="text-xl font-semibold mb-2">Preview</h3>
                    <div className="mb-4 text-xs text-muted-foreground font-mono flex flex-wrap gap-4">
                      <span>Clicks: {generateClickCount}</span>
                      {isGenerating && <span>status: generating...</span>}
                      {lastValidationErrors && lastValidationErrors.length > 0 && (
                        <span className="text-destructive">errors: {lastValidationErrors.slice(0,3).join(' | ')}{lastValidationErrors.length>3?' …':''}</span>
                      )}
                    </div>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-bold text-lg">{preview.fullName}</p>
                        <p className="text-muted-foreground">{preview.location} | {preview.email} | {preview.phone}</p>
                        {preview.title && <p className="text-muted-foreground text-xs mt-1">{preview.title}</p>}
                        {(preview.linkedin || preview.github || preview.website) && (
                          <p className="text-[11px] text-muted-foreground mt-1 space-x-2">
                            {preview.linkedin && <span>LinkedIn</span>}
                            {preview.github && <span>GitHub</span>}
                            {preview.website && <span>Portfolio</span>}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Professional Summary</p>
                        <p className="whitespace-pre-line leading-relaxed">{preview.summary}</p>
                      </div>
                      { (preview.skillGroups && Object.values(preview.skillGroups).some(v=>v)) ? (
                        <div>
                          <p className="font-semibold">Skills</p>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {Object.entries(preview.skillGroups || {}).filter(([_,v])=>v).map(([k,v]) => (
                              <div key={k}>
                                <p className="font-medium uppercase tracking-wide text-[10px] text-muted-foreground">{k}</p>
                                <p>{v}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : preview.skills ? (
                        <div>
                          <p className="font-semibold">Skills</p>
                          <ul className="list-disc list-inside columns-2 gap-4">
                            {preview.skills.split(',').map(s => <li key={s.trim()}>{s.trim()}</li>)}
                          </ul>
                        </div>
                      ) : null }
                      {preview.experience?.length ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Experience</p>
                          {preview.experience.map((exp, i) => (
                            <div key={i} className="space-y-1">
                              <p className="font-medium">{exp.title} – {exp.company}</p>
                              <p className="text-xs text-muted-foreground">{exp.range.start}{exp.range.end ? ' – ' + exp.range.end : ''}{exp.location ? ' | ' + exp.location : ''}</p>
                              <ul className="list-disc ml-5 text-xs space-y-0.5">
                                {exp.bullets.map((b,j)=><li key={j}>{b.value}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {preview.projects?.length ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Projects</p>
                          {preview.projects.map((p,i)=>(
                            <div key={i} className="space-y-1">
                              <p className="font-medium">{p.name}{p.tagline ? ' – ' + p.tagline : ''}</p>
                              {p.stack && <p className="text-xs text-muted-foreground">Stack: {p.stack}</p>}
                              <ul className="list-disc ml-5 text-xs space-y-0.5">
                                {p.bullets.map((b,j)=><li key={j}>{b.value}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {preview.education?.length ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Education</p>
                          {preview.education.map((e,i)=>(
                            <div key={i} className="space-y-1">
                              <p className="font-medium">{e.degree} – {e.institution}</p>
                              {e.range && <p className="text-xs text-muted-foreground">{e.range.start}{e.range.end ? ' – ' + e.range.end : ''}</p>}
                              {e.gpa && <p className="text-xs">GPA: {e.gpa}</p>}
                              {e.coursework && <p className="text-[11px] leading-snug">Coursework: {e.coursework}</p>}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {preview.certifications?.length ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Certifications</p>
                          <ul className="list-disc ml-5 text-xs space-y-0.5">
                            {preview.certifications.map((c,i)=>(<li key={i}>{c.name}{c.issuer? ' – ' + c.issuer : ''}{c.date? ' ('+c.date+')':''}</li>))}
                          </ul>
                        </div>
                      ) : null}
                      {preview.achievements?.length ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Achievements</p>
                          <ul className="list-disc ml-5 text-xs space-y-0.5">
                            {preview.achievements.map((a,i)=>(<li key={i}>{a.value}</li>))}
                          </ul>
                        </div>
                      ) : null}
                      {preview.languages?.length ? (
                        <div className="space-y-2">
                          <p className="font-semibold">Languages</p>
                          <p className="text-xs">{preview.languages.map(l=>`${l.name}${l.level? ' ('+l.level+')':''}`).join(', ')}</p>
                        </div>
                      ) : null}
                      {preview.keywords && (
                        <div className="space-y-1">
                          <p className="font-semibold">Keywords</p>
                          <p className="text-xs leading-relaxed">{preview.keywords}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}