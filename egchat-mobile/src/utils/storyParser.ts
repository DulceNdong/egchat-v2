export interface StorySlide {
  id: string;
  media_url: string;
  type: 'image' | 'video' | 'text';
  caption?: string;
  created_at: string;
}

export interface StoryGroup {
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  avatarColor: string;
  stories: StorySlide[];
  seen: boolean;
  views: number;
  isMe?: boolean;
}

type ApiStoryRow = {
  id: string;
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  media?: Array<{ url?: string; type?: string; caption?: string } | string>;
  seen?: boolean;
  isMe?: boolean;
  publishedAt?: number;
  views?: number;
};

const AVATAR_COLORS = ['#ec4899', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

export function avatarColorFor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = userId.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initialsFor(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export function parseStoriesResponse(rows: unknown[], meId: string): {
  myGroup: StoryGroup | null;
  groups: StoryGroup[];
} {
  if (!Array.isArray(rows)) return { myGroup: null, groups: [] };

  const map = new Map<string, StoryGroup>();

  rows.forEach((row) => {
    const raw = row as ApiStoryRow;
    const uid = raw.userId || 'unknown';
    const mediaArr = Array.isArray(raw.media) ? raw.media : [];
    const slides: StorySlide[] = mediaArr.map((m, idx) => {
      const item = typeof m === 'string' ? { url: m, type: 'image' } : m;
      return {
        id: `${raw.id}-${idx}`,
        media_url: item?.url || '',
        type: (item?.type === 'video' ? 'video' : 'image') as StorySlide['type'],
        caption: item?.caption,
        created_at: raw.publishedAt
          ? new Date(raw.publishedAt).toISOString()
          : new Date().toISOString(),
      };
    }).filter(s => s.media_url);

    if (!slides.length) return;

    if (!map.has(uid)) {
      map.set(uid, {
        storyId: raw.id,
        userId: uid,
        userName: raw.userName || 'Usuario',
        userAvatar: raw.avatarUrl,
        avatarColor: avatarColorFor(uid),
        stories: [],
        seen: !!raw.seen,
        views: raw.views || 0,
        isMe: !!raw.isMe || uid === meId,
      });
    }
    const g = map.get(uid)!;
    g.stories.push(...slides);
    if (raw.seen) g.seen = true;
  });

  const all = Array.from(map.values());
  const myGroup = all.find(g => g.isMe || g.userId === meId) || null;
  const groups = all.filter(g => g.userId !== meId && !g.isMe);
  return { myGroup, groups };
}
