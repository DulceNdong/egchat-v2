# Avatar ring tap navigation and notification bell improvements

Avatar rings now navigate to story/moment/live content on tap, and the notification bell emits in-app notifications for each new story, moment, and live stream. The store union was extended with three new types and three optional payload fields. The implementation is structurally complete, but the ring tap navigation does not pass `targetUserId` to the destination screen — unlike the notification bell, which does — so tapping the ring drops the user on the generic feed instead of the specific contact's content.

**Watch for:**
- **likely** — Ring tap for story, moment, and live does not pass `?userId=` to the destination route; the user lands on the generic feed, not the content belonging to that contact. `handleNotifNavigation` in `HeaderPanels.tsx` already does this correctly — the ring tap should match.
- **confirmed** — TSC artifact (`avatar-ring-nav-tsc.txt`) was not produced by any prior step. TypeScript correctness was assessed by reading source directly; errors that require full module resolution cannot be ruled out.

**Verdict**: NEEDS_CHANGES

---

## High-level view

`AvatarWithRing` receives `onPress` correctly in both the ring-present and ring-absent code paths. The `disabled={!onPress}` guard prevents phantom taps when no content is available. The animation and ring rendering are untouched.

The three new union members are present in `AppNotification['type']` and the dedup logic correctly uses the `targetUserId + type` branch (60 s window) for them — `undefined != null` evaluates to `false` in JavaScript's abstract equality, so the `chatId`-absent branch fires as intended.

`HeaderPanels.tsx` routes story and moment notifications to `?userId=`-qualified URLs and routes live to `/stories?userId=`. The ring tap in `ChatItem` routes to the same screens but without any `userId` query param, meaning the stories/moments screen has no way to surface the right contact's content on arrival.

The per-session `notifiedStoryIds/MomentIds/LiveIds` sets in `useNewContentIndicators` correctly gate notifications to one emission per item per app launch, and `addNotification` is imported and called correctly for all three types.

<details>
<summary>Issues (2)</summary>

1. **Ring tap drops userId** — `avatarOnPress` in `ChatItem` calls `router.push('/stories' as any)` and `router.push('/moments' as any)` without a `?userId=` param. `handleNotifNavigation` in `HeaderPanels.tsx` already does `router.push('/stories?userId=${n.targetUserId}')`. The ring tap should use `other.user_id` the same way; otherwise tapping the avatar ring and tapping the notification produce inconsistent behavior.

2. **TSC artifact missing** — `avatar-ring-nav-tsc.txt` was never written by any prior step. Type coverage for the new union members was confirmed by source reading. Full correctness under module resolution (route type narrowing, exhaustiveness under the `as any` casts) cannot be verified without a compiler run.

</details>

<details>
<summary>Details</summary>

### Ring tap routing asymmetry — `mensajeria.tsx` vs `HeaderPanels.tsx`

`ChatItem` computes `avatarOnPress`:

```ts
if (contentTypes.includes('live'))   return () => router.push('/stories' as any);
if (contentTypes.includes('story'))  return () => router.push('/stories' as any);
if (contentTypes.includes('moment')) return () => router.push('/moments' as any);
```

`handleNotifNavigation` in `HeaderPanels.tsx` for the same content types:

```ts
if (n.targetUserId) router.push(`/stories?userId=${n.targetUserId}` as any);
else router.push('/stories' as any);
```

The `other` variable is in scope inside `avatarOnPress` (via `useMemo` dependency), so passing `other.user_id` as a query param is straightforward. The fix is:

```ts
if (contentTypes.includes('live'))   return () => router.push(`/stories?userId=${other.user_id}` as any);
if (contentTypes.includes('story'))  return () => router.push(`/stories?userId=${other.user_id}` as any);
if (contentTypes.includes('moment')) return () => router.push(`/moments?userId=${other.user_id}` as any);
```

### Dedup logic — `appStore.ts`

`notif.chatId != null` uses abstract inequality. Since `undefined == null` is `true` in JavaScript, `undefined != null` is `false`, so a notification with no `chatId` set takes the `else` branch — the 60 s `targetUserId + type` window — which is the intended behavior for story/moment/live notifications. The dedup is correct.

### Notification emission — `useNewContentIndicators.ts`

Module-level sets persist for the app session, preventing re-emission on the 30 s polling cycle. They reset on app restart, but that is consistent with the notification list also not being persisted. `addNotification` is imported from `../store/appStore` and called with the correct shape for each type, including `storyId`, `momentId`, and `liveId` fields.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|---|---|
| `src/components/AvatarWithRing.tsx` | `onPress` prop wired through both render branches; `disabled={!onPress}` guard added |
| `src/store/appStore.ts` | `AppNotification.type` extended with `story`, `moment`, `live`; `storyId`, `momentId`, `liveId` optional fields added; dedup updated with two-branch strategy |
| `src/components/HeaderPanels.tsx` | `colorForType`, `IconForType`, `handleNotifNavigation` extended for the three new types |
| `src/hooks/useNewContentIndicators.ts` | `addNotification` import and calls added for story, moment, live with per-session dedup sets |
| `app/(tabs)/mensajeria.tsx` | `avatarOnPress` computed in `ChatItem` and passed to `AvatarWithRing` |

Full diff: `git diff main -- egchat-mobile/src egchat-mobile/app`

</details>
