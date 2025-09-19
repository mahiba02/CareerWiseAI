"use server";

/**
 * @fileOverview A resource recommendation AI agent.
 *
 * - getResourceRecommendations - A function that handles the resource recommendation process.
 * - GetResourceRecommendationsInput - The input type for the getResourceRecommendations function.
 * - GetResourceRecommendationsOutput - The return type for the getResourceRecommendations function.
 */

import { z } from 'genkit';

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

// ---------- Providers ----------
type YouTubeVideo = { title: string; url: string; views: number; likes: number };

async function fetchTopYouTubeVideos(query: string): Promise<Array<{ title: string; url: string }>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // No API key: return nothing to avoid generic search result pages
    return [];
  }
  try {
    const q = encodeURIComponent(`${query} tutorial`);
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${q}&key=${apiKey}`,
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
      };
    });
    // Rank by a combined score favoring high views and good like ratio
    const ranked = videos
      .map(v => ({ ...v, score: v.views * (1 + (v.likes && v.views ? Math.min(v.likes / v.views, 0.2) : 0)) }))
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, 3)
      .map(v => ({ title: v.title, url: v.url }));
    return ranked;
  } catch (err) {
    console.error('YouTube API failed:', err);
    return [];
  }
}

async function fetchTopCourses(query: string): Promise<Array<{ title: string; url: string }>> {
  const q = encodeURIComponent(query);
  // 1) Coursera catalog API (no key)
  try {
    const res = await fetch(
      `https://api.coursera.org/api/courses.v1?q=search&query=${q}&limit=10&fields=slug,name`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const json: any = await res.json();
      const items = (json?.elements || []).filter((c: any) => c?.slug);
      const courses = items.slice(0, 5).map((c: any) => ({
        title: c?.name || 'Course',
        url: `https://www.coursera.org/learn/${c.slug}`,
      }));
      if (courses.length > 0) return courses;
    }
  } catch (err) {
    console.error('Coursera API failed:', err);
  }

  // Removed edX discovery due to unreliable DNS/CORS in some environments

  // 3) Optional Google CSE (if configured) across popular course sites
  const googleKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (googleKey && cseId) {
    try {
      const queryStr = encodeURIComponent(
        `${query} (site:coursera.org/learn OR site:udemy.com/course OR site:edx.org/course)`
      );
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${cseId}&q=${queryStr}`,
        { cache: 'no-store' }
      );
  if (res.ok) {
        const json: any = await res.json();
        const items: any[] = json.items || [];
        const courses = items.slice(0, 5).map((it) => ({ title: it.title, url: it.link }));
        if (courses.length > 0) return courses;
      }
    } catch (err) {
  console.warn('Google CSE failed:', err);
    }
  }

  // 4) Fallback: platform search pages (ensures non-empty, user can pick specific course)
  return [
    { title: `Coursera: ${decodeURIComponent(q)}`, url: `https://www.coursera.org/search?query=${q}` },
    { title: `edX: ${decodeURIComponent(q)}`, url: `https://www.edx.org/search?q=${q}` },
    { title: `Udemy: ${decodeURIComponent(q)}`, url: `https://www.udemy.com/courses/search/?q=${q}` },
    { title: `Pluralsight: ${decodeURIComponent(q)}`, url: `https://www.pluralsight.com/search?q=${q}` },
    { title: `Class Central: ${decodeURIComponent(q)}`, url: `https://www.classcentral.com/search?q=${q}` },
  ];
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
