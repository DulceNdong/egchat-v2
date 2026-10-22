# Implementation Plan — Notification bell thumbnails (real story/moment media)

Goal: in the notification bell (`NotificationsPanel`), show the actual media the
contact uploaded (story photo / moment image) instead of the emoji icons (📷 / ✨).
Live and message/call/payment notifications keep their icons (no static thumbnail).

All changes are inside `egchat-mobile/` only (workspace rule: never edit outside
`egchat-mobile/`). The backend on Render is NOT modified.

---

## Findings from the codebase (grounding)

- **Bell render** — `src/components/HeaderPanels.tsx` → `NotificationsPanel`. Each
  list item renders:
  ```tsx
  <View style={np.iconWrap}>
    <IconForType type={n.type} />
  </View>
  ```
  `np.iconWrap` = `{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, ... }`
  (a circle). `IconForType` returns emoji: `📷` (story), `✨` (moment), `🔴` (live),
  and SVGs for message/payment/call. `Image` is already imported in this file.

- **AppNotification interface** — `src/store/appStore.ts`:
  ```ts
  export interface AppNotification {
    id: string;
    type: 'message' | 'call' | 'system' | 'payment' | 'story' | 'moment' | 'live';
    title: string; body: string; time: string; read: boolean;
    chatId?: string; callId?: string; targetUserId?: string;
    callType?: 'audio' | 'video'; liveId?: string; storyId?: string; momentId?: string;
  }
  ```
  `addNotification(n: Omit<AppNotification, 'id' | 'time' | 'read'>)` — adding an
  optional field to the interface automatically permits callers to pass it; no
  change needed to the `addNotification` body.

- **Only one file adds story/moment/live notifications** —
  `src/hooks/useNewContentIndicators.ts` (verified: `app/_layout.tsx` only adds
  `call`/`message`, which have no uploaded media and correctly fall back to icon).
  So only this hook needs the media-enrichment change.

- **Backend (authoritative: `server/egchat-api/index.js` — the only server file
  containing the `contacts-new` routes, i.e. the deployed Render API):**
  - `GET /api/stories/contacts-new` → `[{ id, user_id, created_at, full_name, avatar_url }]`
    — **no `media` / `thumbnail_url`**.
  - `GET /api/moments/contacts-new` → `[{ id, user_id, created_at, full_name, avatar_url }]`
    — **no `images`**.
  - `GET /api/stories` (full) → `[{ id, userId, userName, avatarUrl,
    media: Array<{ url, type, caption } | string>, views, seen, publishedAt, expiresAt, isMe }]`
    — contact-filtered (contacts table + chat participants), **has `media`**.
  - `GET /api/moments` (full) → `[{ id, user_id, text, images, likes_count, created_at,
    user_name, user_avatar, liked_by_me, comments }]` — **NOT contact-filtered**
    (last 50 globally), **has `images` (string[])**.

  Note: the `contacts-new` endpoints DO return the contact's profile `avatar_url`,
  but the user explicitly wants "lo que ha subido el usuario" (the uploaded
  content), not the profile picture. So the thumbnail must come from the actual
  `media` / `images` of the full endpoints.

## Design decision

Lean client-side enrichment (bandwidth-optimal, zero behavior change):

- Keep the existing 3 light polls every 30s unchanged
  (`/api/stories/contacts-new`, `/api/moments/contacts-new`, `/api/live/active`).
  This preserves the exact contact-filtering and the existing dedup
  (`seenStories`/`seenMoments` AsyncStorage sets + module-level
  `notifiedStoryIds`/`notifiedMomentIds`/`notifiedLiveIds` sets).
- **Only when** a poll detects genuinely new (un-notified) story ids, fetch
  `/api/stories` **once** that poll and build `Map<storyId, firstMediaUrl>`.
  **Only when** it detects new moment ids, fetch `/api/moments` **once** and build
  `Map<momentId, firstImageUrl>`. No extra fetch on polls with no new content.
- Pass `imageUrl` (first uploaded media URL) to `addNotification` for story/moment.
  If the map lookup misses or the enrichment fetch fails, omit `imageUrl` → the
  existing icon renders (graceful fallback, no regression).
- Live keeps the icon (no static thumbnail; out of scope).

Rationale for this over alternatives: switching the stories source to
`/api/stories` would poll the heavier endpoint every 30s; switching the moments
source to `/api/moments` is not possible (it isn't contact-filtered → would notify
for non-contacts). The lean approach fetches the heavy endpoints only when new
content is detected, keeps exact contact-filtering, and is symmetric for both
stories and moments.

---

## Steps

- [ ] 1. Add `imageUrl?: string` to `AppNotification` in `src/store/appStore.ts`.
      In the `AppNotification` interface, add a new optional field after
      `momentId?: string;`:
      ```ts
      momentId?: string;
      imageUrl?: string;   // ← new: thumbnail of the uploaded story/moment media
      ```
      No other change in this file (the `addNotification` signature derives from
      the interface via `Omit<...>` so it now accepts `imageUrl`).
      Files: `src/store/appStore.ts`
      Verify: `cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile && npx tsc --noEmit 2>&1 | grep -E "appStore"` → empty output.

- [ ] 2. Enrich story & moment notifications with the uploaded media URL in
      `src/hooks/useNewContentIndicators.ts`.
      Files: `src/hooks/useNewContentIndicators.ts`

      (a) Add two module-level helpers (near the other module-level constants /
          after the `SEEN_*` keys), to normalize the media field shapes:
          ```ts
          // /api/stories `media` → first slide URL (element is {url,type,caption} or string)
          const firstMediaUrl = (media: any): string | undefined => {
            if (!Array.isArray(media) || media.length === 0) return undefined;
            const f = media[0];
            return typeof f === 'string' ? f : f?.url;
          };
          // /api/moments `images` → first image URL (string[] or JSON string)
          const firstImageUrl = (images: any): string | undefined => {
            let arr = images;
            if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { return undefined; } }
            if (!Array.isArray(arr) || arr.length === 0) return undefined;
            const f = arr[0];
            return typeof f === 'string' ? f : f?.url;
          };
          ```

      (b) In `fetchIndicators`, in the **"Stories nuevas"** block (currently
          `if (storiesRes.status === 'fulfilled' && storiesRes.value.ok) { ... }`),
          BEFORE the existing `for (const s of stories)` loop, build the thumbnail
          map only when there are new stories:
          ```ts
          const stories: Array<{ user_id: string; id: string }> = await storiesRes.value.json();
          const newStories = stories.filter(
            s => s.user_id !== currentUserId && !seenStories.has(s.id) && !notifiedStoryIds.has(s.id),
          );
          const storyThumb = new Map<string, string>();
          if (newStories.length > 0) {
            try {
              const fullRes = await fetch(`${BASE}/api/stories`, { headers: { Authorization: `Bearer ${token}` } });
              if (fullRes.ok) {
                const full: Array<{ id: string; media?: any }> = await fullRes.json();
                for (const fs of full) {
                  const u = firstMediaUrl(fs.media);
                  if (u) storyThumb.set(fs.id, u);
                }
              }
            } catch { /* leave map empty → icon fallback */ }
          }
          ```
          Then inside the existing `for` loop, in the `addNotification({ type: 'story', ... })`
          call, add `imageUrl: storyThumb.get(s.id)`. Keep the existing
          `(s as any).user_name || ... || 'Un contacto'` name logic unchanged.
          (Note: `/api/stories` uses camelCase `userId`/`userName` and a `media`
          array; the map is keyed by `id`, which matches the `contacts-new` `id`
          used for dedup, so the lookup is correct.)

      (c) In the **"Moments nuevos"** block, the same pattern:
          ```ts
          const moments: Array<{ user_id: string; id: string }> = await momentsRes.value.json();
          const newMoments = moments.filter(
            m => m.user_id !== currentUserId && !seenMoments.has(m.id) && !notifiedMomentIds.has(m.id),
          );
          const momentThumb = new Map<string, string>();
          if (newMoments.length > 0) {
            try {
              const fullRes = await fetch(`${BASE}/api/moments`, { headers: { Authorization: `Bearer ${token}` } });
              if (fullRes.ok) {
                const full: Array<{ id: string; images?: any }> = await fullRes.json();
                for (const fm of full) {
                  const u = firstImageUrl(fm.images);
                  if (u) momentThumb.set(fm.id, u);
                }
              }
            } catch { /* leave map empty → icon fallback */ }
          }
          ```
          Then in the existing `addNotification({ type: 'moment', ... })` call, add
          `imageUrl: momentThumb.get(m.id)`. (Note: `/api/moments` uses snake_case
          `user_id` and an `images` array; keyed by `id` to match dedup.)

      (d) Leave the **"Lives activos"** block unchanged (no thumbnail).
      Files: `src/hooks/useNewContentIndicators.ts`
      Verify: `cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile && npx tsc --noEmit 2>&1 | grep -E "useNewContent"` → empty output.

- [ ] 3. Render the thumbnail `Image` in `src/components/HeaderPanels.tsx` when
      `imageUrl` exists; keep the icon as fallback.
      In `NotificationsPanel`, the notification list item currently renders:
      ```tsx
      <View style={np.iconWrap}>
        <IconForType type={n.type} />
      </View>
      ```
      Replace it with a conditional (40x40, borderRadius 8 per spec; `Image` is
      already imported):
      ```tsx
      {n.imageUrl ? (
        <Image
          source={{ uri: n.imageUrl }}
          style={{ width: 40, height: 40, borderRadius: 8 }}
          resizeMode="cover"
        />
      ) : (
        <View style={np.iconWrap}>
          <IconForType type={n.type} />
        </View>
      )}
      ```
      No other render logic changes. Message/call/payment/live/system and any
      story/moment without `imageUrl` keep the existing icon automatically.
      Files: `src/components/HeaderPanels.tsx`
      Verify: `cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile && npx tsc --noEmit 2>&1 | grep -E "HeaderPanels"` → empty output.

- [ ] 4. Full typecheck of the three changed files.
      Run: `cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile && npx tsc --noEmit 2>&1 | grep -E "HeaderPanels|appStore|useNewContent"`
      Expected: empty output (no type errors in the changed files).
      (The project `tsconfig.json` extends `expo/tsconfig.base`, is `strict`, and
      excludes `node_modules`/`egchat-v2`/etc., so `tsc --noEmit` covers `src/` and
      `app/`. There is no `tsc` npm script, so invoke `npx tsc --noEmit` directly.)

---

## Notes / edge cases for the implementer

- `BASE` and `token` are already in scope at the top of `fetchIndicators`, so the
  enrichment fetches reuse them — no new auth wiring.
- `/api/stories` is contact-filtered server-side; `/api/moments` is NOT, but we do
  NOT use it as the trigger source — we only read `images` from it by `id`, so the
  contact-filtering of `contacts-new` is preserved exactly (zero behavior change).
- Race: a story/moment created between the `contacts-new` and the full fetch may
  be missing from the map → `imageUrl` is `undefined` → icon fallback. The
  notification still fires (driven by `contacts-new`). Acceptable.
- Dedup is unaffected: keyed by `id` (same DB ids in `contacts-new` and the full
  endpoints), and the existing `notifiedStoryIds`/`notifiedMomentIds` guards still
  prevent duplicate notifications.
- Do not pass `imageUrl` for `live` (keep icon) — lives have no static thumbnail
  and it's out of scope for this task.
