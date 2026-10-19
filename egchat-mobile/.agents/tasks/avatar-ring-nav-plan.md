# Implementation Plan — Avatar Ring Tap Navigation & Notification Bell

## Findings from codebase investigation

### Routes that exist
- `/broadcast` → `app/broadcast.tsx` — **does NOT accept params** (it is a broadcast message composer, not a live viewer). Navigation to live streams currently happens inside `app/stories.tsx` which starts and hosts the live feature internally. See step 2 for the correct approach.
- `/stories` → `app/stories.tsx` — does NOT read `userId` from params (no `useLocalSearchParams` import). Navigate to `/stories` with no param; the user can pick the right person from the stories feed.
- `/moments` → `app/moments.tsx` — does NOT read `userId` from params. Navigate to `/moments` with no param.

**Consequence for mensajeria:** Send users to `/stories`, `/moments`, or `/stories` (for live, since stories.tsx hosts the live viewer too) without deep-link params. The screen will load the feed and the user taps in. See step 2 for details.

### API response shape — user names
- `GET /api/stories/contacts-new` → returns `Array<{ user_id: string; id: string }>`. **No user name in response.** The stories list API (`/api/stories`) returns a richer `ApiStoryRow` shape with `userName`, but `contacts-new` only returns ids.
- `GET /api/moments/contacts-new` → returns `Array<{ user_id: string; id: string }>`. The full moments API returns `user_name`, but the contacts-new endpoint does not.
- `GET /api/live/active` → returns `Array<{ host_id: string; live_id: string }>`. No name field.

**Decision:** Fall back to `'Un contacto'` as display name in notifications. Do not make a separate fetch for names.

### Auto-dismiss on open — CONFIRMED
In `app/(tabs)/mensajeria.tsx` line ~1170-1174, `onNotifPress` already calls `markNotificationRead(n.id)` before calling `handleNotifNavigation(n)`. No change needed.

### `AvatarWithRing.tsx` — onPress prop ignored
The component signature includes `onPress?: () => void` in `Props` but the destructure line reads `{ src, name, size, contentTypes = [] }` — `onPress` is omitted entirely. Both the `ringColor` branch (renders a `View`) and the no-ring branch (renders bare `EGAvatar`) are unwrapped.

### `appStore.ts` — dedup logic flaw
`addNotification` checks `x.chatId === notif.chatId`. For story/moment/live notifications `chatId` is always `undefined`, so the check becomes `undefined === undefined` → every notification with no chatId is a duplicate of every other. The 5-second window doesn't help since multiple content-types can fire in the same poll cycle.

### `HeaderPanels.tsx` — missing story/moment/live cases
`colorForType`, `handleNotifNavigation`, and `IconForType` only handle `'message' | 'call' | 'system' | 'payment'`. New types will fall through to the grey default color, no navigation, and the generic info SVG icon.

---

## Implementation order

- [ ] 1. Extend `AppNotification` type and fix dedup logic in `src/store/appStore.ts`
      Add `'story' | 'moment' | 'live'` to the `type` union and add optional `liveId`, `storyId`, `momentId` fields. Fix `addNotification` dedup: keep the existing `chatId` check, but also add a second guard — for types `story | moment | live`, check for a matching `targetUserId + type` pair within a 60-second window.
      Files: `src/store/appStore.ts`
      Verify: TypeScript compiles — run `npx tsc --noEmit` from `egchat-mobile/`.

- [ ] 2. Wire `onPress` into `AvatarWithRing.tsx`
      Import `TouchableOpacity` from `react-native`. Destructure `onPress` from Props. Wrap both the ring-present path (currently a bare `View`) and the no-ring path (currently a bare `EGAvatar`) in `TouchableOpacity` with `onPress={onPress}` and `activeOpacity={0.75}`. When `onPress` is undefined, `TouchableOpacity` is still rendered but does nothing on tap — this is acceptable (no extra state needed). Pass `disabled={!onPress}` to avoid a visual tap highlight when there's nothing to do.
      Files: `src/components/AvatarWithRing.tsx`
      Verify: `npx tsc --noEmit` passes.

- [ ] 3. Add story/moment/live cases to `HeaderPanels.tsx`
      a. In `colorForType`: add `if (type === 'story') return '#00C8A0'; if (type === 'moment') return '#af52de'; if (type === 'live') return '#ff3b30';` before the `return '#6b7280'` fallback.
      b. In `handleNotifNavigation`: add three cases before the final `chatId` check:
         - `story` → `router.push('/stories' as any)`
         - `moment` → `router.push('/moments' as any)`
         - `live` → `router.push('/stories' as any)` (live viewer lives inside stories.tsx; there is no standalone live-watch route)
      c. In `IconForType`: add three `if` branches returning a `<Text style={{ fontSize: 14 }}>` emoji node for the new types:
         - `story`: `📷`
         - `moment`: `✨`
         - `live`: `🔴`
         Use `<Text style={{ fontSize: 14, color: colorForType(type) }}>` pattern and wrap in the same `iconWrap` container the caller uses.
      Files: `src/components/HeaderPanels.tsx`
      Verify: `npx tsc --noEmit` passes.

- [ ] 4. Emit notifications from `useNewContentIndicators.ts`
      At the top of the file, add three module-level `Set<string>` variables:
      ```typescript
      const notifiedStories  = new Set<string>();
      const notifiedMoments  = new Set<string>();
      const notifiedLives    = new Set<string>();
      ```
      Import `addNotification` from `'../store/appStore'`.
      Inside `fetchIndicators`, after each item is checked and `addIndicator` is called, also call `addNotification` when the content ID has not been notified yet this session, using `'Un contacto'` as the display name (the API does not return names on the contacts-new endpoints).
      - **Stories**: after `addIndicator(s.user_id, 'story')`, add:
        ```typescript
        if (!notifiedStories.has(s.id)) {
          notifiedStories.add(s.id);
          addNotification({ type: 'story', title: 'Un contacto publicó un estado', body: 'Toca para verlo', targetUserId: s.user_id, storyId: s.id });
        }
        ```
      - **Moments**: same pattern with `notifiedMoments` and `{ type: 'moment', ..., momentId: m.id }`.
      - **Lives**: after `addIndicator(l.host_id, 'live')`, add:
        ```typescript
        if (!notifiedLives.has(l.live_id)) {
          notifiedLives.add(l.live_id);
          addNotification({ type: 'live', title: 'Un contacto está en directo', body: 'Toca para unirte', targetUserId: l.host_id, liveId: l.live_id });
        }
        ```
      Files: `src/hooks/useNewContentIndicators.ts`
      Verify: `npx tsc --noEmit` passes.

- [ ] 5. Add `onPress` to `AvatarWithRing` in `ChatItem` inside `mensajeria.tsx`
      In `ChatItem`, `other` is already computed at the top of the component. Build an `avatarOnPress` variable:
      ```typescript
      const avatarOnPress = useMemo(() => {
        if (chat.type !== 'private' || !other || !contentTypes || contentTypes.length === 0) return undefined;
        const participantId = other.user_id;
        if (contentTypes.includes('live'))   return () => router.push('/stories' as any);
        if (contentTypes.includes('story'))  return () => router.push('/stories' as any);
        if (contentTypes.includes('moment')) return () => router.push('/moments' as any);
        return undefined;
      }, [chat.type, other, contentTypes]);
      ```
      Pass `onPress={avatarOnPress}` to the `<AvatarWithRing>` render inside `ChatItem`.
      `useMemo` is already imported in the file. `router` is already imported. `ContentType` is already imported.
      **Note:** Live routes to `/stories` (same screen hosts the live viewer). Story routes to `/stories`. Both `/stories` and `/moments` don't accept a `userId` deep-link param (confirmed by investigation), so we just navigate to the tab and let the user see the feed.
      Files: `app/(tabs)/mensajeria.tsx`
      Verify: `npx tsc --noEmit` passes; tap the ring on a chat item with a story/moment/live indicator and confirm navigation to the correct screen.

- [ ] 6. Final build verification
      Run `npx tsc --noEmit` from `egchat-mobile/` to confirm no TypeScript errors across all changed files. Then run `npx expo start --web` briefly to confirm the app boots without runtime errors.
      Files: none (verification only)
      Verify: TypeScript exits 0; Expo starts without red-screen crash.

---

## Edge cases noted

1. **`ChatItem` is a `React.memo` component** — `avatarOnPress` must be a stable reference to avoid defeating memoization on every render. Using `useMemo` (not `useCallback`) is correct here because the deps array already includes all values that affect the result.

2. **`onPress` on `AvatarWithRing` when `contentTypes` is empty** — the component will render `TouchableOpacity` with `disabled={true}`, which is a no-op. The visual press highlight is suppressed by `disabled`.

3. **Notification dedup for live** — lives are polled every 30s. A live stream can be active for a long time. The `notifiedLives` set prevents re-firing the notification on every poll as long as the app session is active. When the app restarts the set resets — acceptable since a new session should still alert the user.

4. **`appStore.ts` dedup window for story/moment/live** — use 60s (not 5s) because these content-type notifications have `chatId = undefined` and only differ by `targetUserId + type`. If the same user posts two stories within 60s only one notification fires — acceptable tradeoff vs. flooding.

5. **Broadcast route** — `app/broadcast.tsx` is a message composer (send a message to multiple contacts at once), not a live-stream viewer. The live-watch UI is embedded inside `app/stories.tsx`. Navigating live notifications to `/broadcast` would be wrong; route to `/stories` instead.

6. **Auto-dismiss** — confirmed present and correct at `mensajeria.tsx` line ~1170. No change needed.
