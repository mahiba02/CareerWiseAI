"use server";

/**
 * @fileOverview An AI-powered resource recommendation system that uses Gemini to intelligently curate the best YouTube videos, courses, and books.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// AI-powered resource selection functions
async function selectBestYouTubeVideos(query: string, videos: YouTubeVideo[]): Promise<Array<{ title: string; url: string }>> {
  if (videos.length === 0) return [];
  
  try {
    const prompt = ai.definePrompt({
      name: 'selectBestYouTubeVideos',
      input: { 
        schema: z.object({
          query: z.string(),
          videos: z.array(z.object({
            title: z.string(),
            url: z.string(),
            views: z.number(),
            likes: z.number(),
            description: z.string(),
            channelTitle: z.string(),
          }))
        })
      },
      output: { 
        schema: z.object({
          selectedVideos: z.array(z.object({
            title: z.string(),
            url: z.string(),
            reason: z.string(),
          }))
        })
      },
      prompt: `You are an expert educator and content curator. Your task is to select the TOP 3 most valuable YouTube videos for learning "${query}".

Analyze each video based on:
1. Educational quality indicators (title clarity, channel reputation)
2. Engagement metrics (views, likes ratio)
3. Content relevance to the learning goal
4. Beginner-friendliness vs advanced content balance

Available videos:
{{{videos}}}

Select exactly 3 videos that would provide the best learning experience for someone wanting to learn "${query}". Prioritize:
- Clear, well-structured tutorials
- Reputable educational channels
- Comprehensive coverage of fundamentals
- Good engagement metrics

Provide a brief reason for each selection.`
    });

    const { output } = await prompt({ query, videos });
    return output?.selectedVideos?.map(v => ({ title: v.title, url: v.url })) || [];
  } catch (err) {
    console.error('AI video selection failed:', err);
    // Fallback to simple ranking
    return videos
      .map(v => ({ ...v, score: v.views * (1 + (v.likes && v.views ? Math.min(v.likes / v.views, 0.2) : 0)) }))
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, 3)
      .map(v => ({ title: v.title, url: v.url }));
  }
}

async function selectBestCourses(query: string, courses: Array<{ title: string; url: string; platform: string; description?: string }>): Promise<Array<{ title: string; url: string }>> {
  if (courses.length === 0) return [];
  
  try {
    const prompt = ai.definePrompt({
      name: 'selectBestCourses',
      input: { 
        schema: z.object({
          query: z.string(),
          courses: z.array(z.object({
            title: z.string(),
            url: z.string(),
            platform: z.string(),
            description: z.string().optional(),
          }))
        })
      },
      output: { 
        schema: z.object({
          selectedCourses: z.array(z.object({
            title: z.string(),
            url: z.string(),
            reason: z.string(),
          }))
        })
      },
      prompt: `You are an expert education consultant. Your task is to select the TOP 3 most valuable online courses for learning "${query}".

Analyze each course based on:
1. Course title relevance and comprehensiveness
2. Platform reputation (Coursera, edX, Udemy, Pluralsight)
3. Course description quality and content depth
4. Practical applicability for career development

Available courses:
{{{courses}}}

Select exactly 3 courses that would provide the best structured learning path for "${query}". Prioritize:
- Comprehensive curriculum coverage
- Reputable platforms and instructors  
- Practical, hands-on content
- Industry-relevant skills

Provide a brief reason for each selection.`
    });

    const { output } = await prompt({ query, courses });
    return output?.selectedCourses?.map(c => ({ title: c.title, url: c.url })) || [];
  } catch (err) {
    console.error('AI course selection failed:', err);
    // Fallback to platform priority
    const platformPriority = { 'Coursera': 4, 'edX': 3, 'Pluralsight': 2, 'Udemy': 1, 'Other': 0 };
    return courses
      .sort((a, b) => (platformPriority[b.platform as keyof typeof platformPriority] || 0) - (platformPriority[a.platform as keyof typeof platformPriority] || 0))
      .slice(0, 3)
      .map(c => ({ title: c.title, url: c.url }));
  }
}

async function generateCuratedCourseRecommendations(query: string): Promise<Array<{ title: string; url: string }>> {
  try {
    const prompt = ai.definePrompt({
      name: 'generateCuratedCourseRecommendations',
      input: { schema: z.object({ query: z.string() }) },
      output: { 
        schema: z.object({
          courses: z.array(z.object({
            title: z.string(),
            url: z.string(),
            platform: z.string(),
          }))
        })
      },
      prompt: `You are an expert education consultant. Generate the TOP 3 most recommended online courses for learning "${query}".

Based on your knowledge of the best educational resources, recommend specific, well-known courses that are highly regarded in the industry.

For each course, provide:
- The exact course title
- The most likely direct URL (construct realistic URLs for major platforms)
- The platform name

Prioritize courses from reputable platforms like Coursera, edX, Udemy, Pluralsight that are known for quality content in this subject area.

Focus on courses that provide comprehensive, practical knowledge for career development.`
    });

    const { output } = await prompt({ query });
    return output?.courses?.map(c => ({ title: c.title, url: c.url })) || [];
  } catch (err) {
    console.error('AI course generation failed:', err);
    // Final fallback
    const q = encodeURIComponent(query);
    return [
      { title: `Best ${query} Course on Coursera`, url: `https://www.coursera.org/search?query=${q}` },
      { title: `${query} Specialization on edX`, url: `https://www.edx.org/search?q=${q}` },
      { title: `Complete ${query} Bootcamp on Udemy`, url: `https://www.udemy.com/courses/search/?q=${q}` },
    ];
  }
}

// Minimal local search stub: crafts YouTube search URLs based on a query.
// Shape matches the previous expected return type.
async function search({ query }: { query: string; options?: { site?: string } }): Promise<{ results: Array<{ title: string; url: string }> }> {
  const q = encodeURIComponent(query);
  return {
    results: [
      { title: `Top results for ${query}`, url: `https://www.youtube.com/results?search_query=${q}` },
      { title: `${query} tutorial`, url: `https://www.youtube.com/results?search_query=${q}+tutorial` },
      { title: `${query} for beginners`, url: `https://www.youtube.com/results?search_query=${q}+for+beginners` },
    ],
  };
}

// ---------- AI-Enhanced Providers ----------
type YouTubeVideo = { title: string; url: string; views: number; likes: number; description: string; channelTitle: string };

async function fetchTopYouTubeVideos(query: string): Promise<Array<{ title: string; url: string }>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return [];
  }
  try {
    const q = encodeURIComponent(`${query} tutorial`);
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${q}&key=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!searchRes.ok) throw new Error(`YouTube search failed: ${searchRes.status}`);
    const searchJson: any = await searchRes.json();
    const ids: string[] = (searchJson.items || []).map((i: any) => i?.id?.videoId).filter(Boolean);
    if (ids.length === 0) return [];
    
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${ids.join(',')}&key=${apiKey}`,
      { cache: 'no-store' }
    );
    if (!statsRes.ok) throw new Error(`YouTube stats failed: ${statsRes.status}`);
    const statsJson: any = await statsRes.json();

    const videos: YouTubeVideo[] = (statsJson.items || []).map((v: any) => {
      const views = parseInt(v?.statistics?.viewCount || '0', 10);
      const likes = parseInt(v?.statistics?.likeCount || '0', 10);
      return {
        title: v?.snippet?.title || 'Untitled',
        url: `https://www.youtube.com/watch?v=${v?.id}`,
        views,
        likes,
        description: v?.snippet?.description || '',
        channelTitle: v?.snippet?.channelTitle || '',
      };
    });

    // Use AI to intelligently select the best videos
    const aiSelectedVideos = await selectBestYouTubeVideos(query, videos);
    return aiSelectedVideos;
  } catch (err) {
    console.error('YouTube API failed:', err);
    return [];
  }
}

async function fetchTopCourses(query: string): Promise<Array<{ title: string; url: string }>> {
  // Collect courses from multiple sources
  const allCourses: Array<{ title: string; url: string; platform: string; description?: string }> = [];

  // 1) Coursera
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://api.coursera.org/api/courses.v1?q=search&query=${q}&limit=10&fields=slug,name,description`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const json: any = await res.json();
      const items = (json?.elements || []).filter((c: any) => c?.slug);
      const courses = items.map((c: any) => ({
        title: c?.name || 'Course',
        url: `https://www.coursera.org/learn/${c.slug}`,
        platform: 'Coursera',
        description: c?.description || '',
      }));
      allCourses.push(...courses);
    }
  } catch (err) {
    console.error('Coursera API failed:', err);
  }

  // 2) Use Google CSE to find courses from major platforms
  const googleKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (googleKey && cseId) {
    try {
      const queryStr = encodeURIComponent(
        `${query} course (site:coursera.org OR site:udemy.com OR site:edx.org OR site:pluralsight.com)`
      );
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${cseId}&q=${queryStr}&num=10`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const json: any = await res.json();
        const items: any[] = json.items || [];
        const courses = items.map((it) => ({
          title: it.title,
          url: it.link,
          platform: it.displayLink?.includes('coursera') ? 'Coursera' : 
                   it.displayLink?.includes('udemy') ? 'Udemy' :
                   it.displayLink?.includes('edx') ? 'edX' :
                   it.displayLink?.includes('pluralsight') ? 'Pluralsight' : 'Other',
          description: it.snippet || '',
        }));
        allCourses.push(...courses);
      }
    } catch (err) {
      console.warn('Google CSE failed:', err);
    }
  }

  // Use AI to select the best courses if we have any
  if (allCourses.length > 0) {
    const aiSelectedCourses = await selectBestCourses(query, allCourses);
    return aiSelectedCourses;
  }

  // Fallback: curated recommendations based on query analysis
  return await generateCuratedCourseRecommendations(query);
}

async function fetchTopBooks(query: string): Promise<Array<{ title: string; author: string; url: string }>> {
  try {
    const q = encodeURIComponent(query);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&orderBy=relevance&maxResults=10`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`Books API failed: ${res.status}`);
    const json: any = await res.json();
    const items: any[] = json.items || [];
    const books = items
      .map((it: any) => {
        const info = it.volumeInfo || {};
        const title = info.title || 'Book';
        const authors: string[] = info.authors || [];
        const industryIds: Array<{ type: string; identifier: string }> = info.industryIdentifiers || [];
        const isbn13 = industryIds.find(x => x.type === 'ISBN_13')?.identifier || industryIds.find(x => x.type === 'ISBN_10')?.identifier;
        const author = authors[0] || 'Unknown';
        const url = isbn13 ? `https://www.amazon.in/s?k=${encodeURIComponent(isbn13)}` : (info.infoLink || info.canonicalVolumeLink || `https://www.amazon.in/s?k=${encodeURIComponent(title + ' ' + author)}`);
        return { title, author, url };
      })
      .filter((b: any) => b.title && b.author)
      .slice(0, 3);
    return books;
  } catch (err) {
    console.error('Google Books failed:', err);
    return [];
  }
}

const GetResourceRecommendationsInputSchema = z.object({
  skill: z.string().describe('The skill for which to recommend resources.'),
});
export type GetResourceRecommendationsInput = z.infer<typeof GetResourceRecommendationsInputSchema>;

const GetResourceRecommendationsOutputSchema = z.object({
  youtube: z.array(z.object({
    title: z.string().describe('The title of the YouTube video.'),
    url: z.string().url().describe('The URL of the YouTube video.'),
  })).optional().describe('A list of recommended YouTube videos.'),
  courses: z.array(z.object({
    title: z.string().describe('The title of the course.'),
    url: z.string().url().describe('The URL of the course.'),
  })).optional().describe('A list of recommended online courses.'),
  books: z.array(z.object({
    title: z.string().describe('The title of the book.'),
    author: z.string().describe('The author of the book.'),
    url: z.string().url().describe('The purchase/search URL for the book.'),
  })).optional().describe('A list of recommended books with purchase links.'),
});
export type GetResourceRecommendationsOutput = z.infer<typeof GetResourceRecommendationsOutputSchema>;

export async function getResourceRecommendations(input: GetResourceRecommendationsInput): Promise<GetResourceRecommendationsOutput> {
  const [youtube, courses, books] = await Promise.all([
    fetchTopYouTubeVideos(input.skill),
    fetchTopCourses(input.skill),
    fetchTopBooks(input.skill),
  ]);
  return { youtube, courses, books };
}

// Removed LLM-based flow for deterministic, API-backed results
