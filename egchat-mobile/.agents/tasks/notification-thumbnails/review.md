# Review — Notification Thumbnails

**Verdict: APPROVED**

---

## Scope

Three files changed against the plan in `plan.md`:

| File | Plan step |
|---|---|
| `src/store/appStore.ts` | Step 1 — add `imageUrl?` to `AppNotification` |
| `src/hooks/useNewContentIndicators.ts` | Step 2 — enrich story/moment notifications |
| `src/components/HeaderPanels.tsx` | Step 3 — conditional thumbnail render |

---

## Step 1 — `appStore.ts`

`imageUrl?: string` is present in the `AppNotification` interface after `momentId?: string`, with the comment `// Miniatura del media subido (story/moment) — si existe se muestra en vez del icono`. The `addNotification` signature is `Omit<AppNotification, 'id' | 'time' | 'read'>`, so it automatically accepts `imageUrl`. No other change was made to this file. ✅

---

## Step 2 — `useNewContentIndicators.ts`

### Helper functions

Both module-level helpers are present at the top of the file, outside the hook:

```ts
const firstMediaUrl = (media: any): string | undefined => { … }
const firstImageUrl = (images: any): string | undefined => { … }
```

`firstMediaUrl` handles: non-array → `undefined`; empty array → `undefined`; element is string → element; element is object → `f?.url`. Matches plan spec and the `/api/stories` `media: Array<{url,type,caption}|string>` shape.

`firstImageUrl` handles: non-array string → JSON.parse → fallback on error; non-array → `undefined`; empty array → `undefined`; element is string → element; element is object → `f?.url`. Matches plan spec and the `/api/moments` `images: string[]` shape.

### Stories block

- `newStories` pre-filter correctly uses `s.user_id !== currentUserId && !seenStories.has(s.id) && !notifiedStoryIds.has(s.id)`.
- The `/api/stories` enrichment fetch is guarded by `newStories.length > 0` — no extra HTTP call when there is nothing new.
- Map key is `fs.id` (matching the `contacts-new` `id` used for dedup); value guarded by `if (u)` before `storyThumb.set`.
- `addNotification` call passes `imageUrl: storyThumb.get(s.id)` — type is `string | undefined`, matching the interface.
- `catch {}` leaves the map empty → `storyThumb.get(s.id)` returns `undefined` → `imageUrl: undefined` → icon fallback. Graceful. ✅

### Moments block

- Identical pattern: `newMoments`, conditional `/api/moments` fetch, `momentThumb` map, `imageUrl: momentThumb.get(m.id)`.
- `/api/moments` is not contact-filtered server-side; however it is used ONLY as a thumbnail-by-id lookup, driven by the contact-filtered `contacts-new` ids — contact-filtering of triggers is fully preserved.
- `firstImageUrl` handles the `images` field (string[] or JSON-encoded string[] per plan). ✅

### Lives block

Unchanged. No `imageUrl` passed. ✅

### Edge cases

| Case | Behavior |
|---|---|
| Missing `imageUrl` (enrichment map miss) | `undefined` → icon fallback |
| Enrichment fetch network failure | `catch {}` → empty map → `undefined` → icon fallback |
| `images` field is JSON string | `JSON.parse` branch of `firstImageUrl` |
| `media` element is plain string URL | `typeof f === 'string' ? f` branch |
| `/api/stories` returns story the new-poll doesn't have (id mismatch) | Map lookup miss → `undefined` → icon fallback |
| Race between `contacts-new` and full fetch | `imageUrl` is `undefined` for that item; notification still fires |

---

## Step 3 — `HeaderPanels.tsx`

Conditional render in `NotificationsPanel` list item:

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

- Dimensions 40×40, `borderRadius: 8`: matches plan spec exactly.
- `Image` was already imported in this file (`import { …, Image, … } from 'react-native'`).
- `n.imageUrl` is falsy for `undefined`, empty string, and `null` → icon fallback in all those cases.
- Broken/non-200 URI: React Native `Image` renders a blank space; no crash, no JS error.
- `live`, `message`, `call`, `payment`, `system` types — `imageUrl` is never set by any caller → always take the icon path. ✅

---

## TypeScript verification

Narrow spot-check run per instructions (one articulable doubt: `Map.set` receiving narrowed-but-any-typed value):

```
cd egchat-mobile && npx tsc --noEmit 2>&1 | grep -E "HeaderPanels|appStore|useNewContent"
```

Output: empty (exit 1 = no matches). Zero type errors in all three changed files. ✅

---

## Summary

All three plan steps are correctly implemented. Fallback paths (missing `imageUrl`, network failure, broken URL) are sound. Live/message/call/payment/system notification types are untouched. Type-check passes. No blockers found.
