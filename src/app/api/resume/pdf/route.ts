import { NextResponse } from 'next/server';

// Enhanced server-side PDF generation mirroring client-side layout parity.
// Accepts JSON body with the current resume form data.
// Adds: word wrapping, two-column skill groups, consistent spacing & bullet formatting.
export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Dynamic import to avoid bundling when unused
    // @ts-ignore
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
      const words = String(t).split(/\s+/);
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
      const lines = wrapText(t, width - 108, size, fnt); // 54 left/right margins
      lines.forEach(line => {
        ensure(size + 2);
        page.drawText(line, { x: 54, y, size, font: fnt, color: rgb(0,0,0) });
        y -= lineGap;
      });
    };
    const section = (title: string) => { y -= 4; text(title.toUpperCase(), { bold: true, size: headingSize }); };

    // Synthesize flat skills string if empty but groups provided (mirrors client pre-processing)
    if ((!data.skills || !String(data.skills).trim()) && data.skillGroups) {
      const flat = Object.values(data.skillGroups).filter(Boolean).join(', ');
      if (flat) data.skills = flat;
    }
    if (!data.skills) data.skills = '';

    // Header
    text(data.fullName || 'Name', { bold: true, size: 18 });
    if (data.title) text(data.title, { size: 11 });
    const contactLine = [data.location, data.email, data.phone].filter(Boolean).join(' | ');
    if (contactLine) text(contactLine, { size: 9.5 });
    const links = [data.linkedin, data.github, data.website].filter(Boolean).join(' | ');
    if (links) text(links, { size: 9 });
    y -= 6;

    // Summary
    if (data.summary) {
      section('Professional Summary');
      String(data.summary).split(/\n+/).forEach((l: string) => text(l));
    }

    // Skills (two-column groups parity)
    const groups = data.skillGroups || {} as any;
    const groupEntries = Object.entries(groups).filter(([_,v])=>v);
    if (groupEntries.length || data.skills) {
      section('Skills');
      if (groupEntries.length) {
        const colGap = 28;
        const colWidth = (width - 108 - colGap) / 2;
        const entries = groupEntries.map(([k,v]) => ({ label: k.toUpperCase(), value: v as string }));
        let col = 0;
        entries.forEach(e => {
          const lines = wrapText(`${e.label}: ${e.value}`, colWidth, bodySize, font);
          const startX = 54 + (col * (colWidth + colGap));
          lines.forEach(ln => {
            ensure(bodySize + 2);
            page.drawText(ln, { x: startX, y, size: bodySize, font, color: rgb(0,0,0) });
            y -= lineGap;
          });
          if (col === 1) { col = 0; y -= 4; } else { col = 1; }
          if (y < 60) { newPage(); }
        });
        if (col === 1) { y -= 6; }
      } else if (data.skills) {
        String(data.skills).split(',').map((s: string)=>s.trim()).filter(Boolean).forEach((s: string)=> text(`• ${s}`));
      }
    }

    if (Array.isArray(data.experience) && data.experience.length) {
      section('Experience');
      data.experience.forEach((exp: any) => {
        if (!exp) return;
        text(`${exp.title || ''} – ${exp.company || ''}`, { bold: true });
        if (exp.range) {
          const range = `${exp.range.start || ''}${exp.range.end ? ' – ' + exp.range.end : ''}`;
          text(`${range}${exp.location ? ' | ' + exp.location : ''}`, { size: 9 });
        } else if (exp.location) {
          text(exp.location, { size: 9 });
        }
        (exp.bullets || []).forEach((b: any) => b?.value && text(`• ${b.value}`));
        y -= 4;
      });
    }

    if (Array.isArray(data.projects) && data.projects.length) {
      section('Projects');
      data.projects.forEach((p: any) => {
        if (!p) return;
        text(`${p.name || ''}${p.tagline ? ' – ' + p.tagline : ''}`, { bold: true });
        if (p.stack) text(`Stack: ${p.stack}`, { size: 9 });
        if (p.link) text(p.link, { size: 9 });
        (p.bullets || []).forEach((b: any) => b?.value && text(`• ${b.value}`));
        y -= 4;
      });
    }

    if (Array.isArray(data.education) && data.education.length) {
      section('Education');
      data.education.forEach((e: any) => {
        text(`${e.degree || ''} – ${e.institution || ''}`, { bold: true });
        if (e.range) text(`${e.range.start || ''}${e.range.end ? ' – ' + e.range.end : ''}`, { size: 9 });
        if (e.gpa) text(`GPA: ${e.gpa}`, { size: 9 });
        if (e.coursework) text(`Coursework: ${e.coursework}`, { size: 9 });
        y -= 4;
      });
    }

    if (Array.isArray(data.certifications) && data.certifications.length) {
      section('Certifications');
      data.certifications.forEach((c: any) => text(`${c.name}${c.issuer? ' – ' + c.issuer : ''}${c.date? ' ('+c.date+')':''}`));
    }

    if (Array.isArray(data.achievements) && data.achievements.length) {
      section('Achievements');
      data.achievements.forEach((a: any) => a?.value && text(`• ${a.value}`));
    }

    if (Array.isArray(data.languages) && data.languages.length) {
      section('Languages');
      text(data.languages.map((l: any) => `${l.name}${l.level? ' ('+l.level+')':''}`).join(', '));
    }

    if (data.keywords) {
      section('Keywords');
      text(String(data.keywords), { size: 9 });
    }

    const pdf = await doc.save();
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"'
      }
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
