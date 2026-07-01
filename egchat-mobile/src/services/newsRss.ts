import type { HomeNewsItem } from '../data/homeNews';
import { HOME_NEWS } from '../data/homeNews';

const RSS_FEEDS: { url: string; source: string }[] = [
  { url: 'https://lagacetadeguinea.com/feed/', source: 'La Gaceta de Guinea' },
  { url: 'https://www.guineaecuatorialpress.com/feed/', source: 'Guinea Ecuatorial Press' },
];

const CACHE_KEY = 'egchat_news_cache_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
}

function parseRssItems(xml: string, source: string): HomeNewsItem[] {
  const items: HomeNewsItem[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (let i = 0; i < blocks.length && items.length < 12; i++) {
    const block = blocks[i];
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const pubMatch =
      block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) ||
      block.match(/<dc:date>([\s\S]*?)<\/dc:date>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : '';
    if (!title || title.length < 4) continue;
    let time = 'Reciente';
    if (pubMatch) {
      const d = new Date(pubMatch[1].trim());
      if (!Number.isNaN(d.getTime())) {
        const diffH = Math.round((Date.now() - d.getTime()) / 3600000);
        time = diffH < 1 ? 'Hace un momento' : diffH < 24 ? `Hace ${diffH} h` : 'Ayer';
      }
    }
    items.push({
      id: `rss-${source}-${i}`,
      title,
      source,
      time,
      url: linkMatch ? stripHtml(linkMatch[1]) : undefined,
    });
  }
  return items;
}

async function fetchFeed(feed: { url: string; source: string }): Promise<HomeNewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, feed.source);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLiveHomeNews(): Promise<HomeNewsItem[]> {
  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const { at, items } = JSON.parse(cached);
      if (Date.now() - at < CACHE_TTL_MS && Array.isArray(items) && items.length > 0) {
        return items;
      }
    }
  } catch { /* ignore */ }

  const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
  const merged = results.flat().filter((n, i, arr) =>
    arr.findIndex(x => x.title === n.title) === i,
  );

  const items = merged.length > 0 ? merged.slice(0, 12) : [...HOME_NEWS];

  try {
    const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }));
  } catch { /* ignore */ }

  return items;
}
