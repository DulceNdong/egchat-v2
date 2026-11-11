# Chat Stability Investigation Report

## Summary

Two bugs confirmed in `app/chat/[id].tsx`:

1. **List instability / jump** — `useEffect` fires `scrollToEnd({ animated: false })` every time `messagesBottomInset` or `inputBarHeight` change, and also on every `isTyping` toggle. On Android the keyboard events fire `keyboardDidShow` AND `keyboardWillShow` (iOS-only) is skipped but `keyboardBottomOffset` is set, yet `dockBottomOffset` is always `0` on Android — causing `messagesBottomInset` to change and re-triggering the scroll effect. Additionally `onContentSizeChange` fires a second `scrollToEnd` at the same moment. These two scroll calls happen simultaneously every time a message arrives, a reply is attached, or typing state changes — producing the visible jump.

2. **Last message hidden behind input bar on Android** — The `bottomDock` is `position: absolute, bottom: effectiveDockOffset`. On Android `effectiveDockOffset` is **always 0** (because `dockBottomOffset = Platform.OS === 'ios' ? keyboardBottomOffset : 0`). The FlatList spacer (`<View style={{ height: messagesBottomInset }} />`) therefore only accounts for `bottomDockHeight + 0 + 12`. If `bottomDockHeight` has not yet been measured (first render), or the measurement lags, the last message ends up behind the input bar.

---

## Evidence

### File: `app/chat/[id].tsx`

#### 1. FlatList component (lines ~2417–2460)

```tsx
<FlatList
  ref={flatListRef}
  data={displayMessages}
  contentContainerStyle={[
    styles.messagesList,
    {
      paddingBottom: 12,   // ← hardcoded, does not account for bottomDock height
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
  ]}
  onContentSizeChange={() => {
    if (!isLoadingMoreRef.current) {
      flatListRef.current?.scrollToEnd({ animated: false });  // ← scroll trigger #1
    }
  }}
  ...
  ListFooterComponent={(
    <>
      {isTyping && <TypingIndicator />}
      <View style={{ height: messagesBottomInset }} />  // ← spacer for the dock
    </>
  )}
/>
```

- **`paddingBottom: 12`** in `contentContainerStyle` is hardcoded and does not grow with the dock height.
- **`onContentSizeChange`** fires `scrollToEnd` imperatively every time content changes.

#### 2. useEffect scroll-to-bottom (lines 850–856)

```tsx
useEffect(() => {
  if (messages.length === 0) return;
  if (isLoadingMoreRef.current) return;
  const frame = requestAnimationFrame(() => scrollToBottom(false));  // ← scroll trigger #2
  return () => cancelAnimationFrame(frame);
}, [messages.length, messagesBottomInset, inputBarHeight, isTyping, replyTo?.id, scrollToBottom]);
```

**Dependencies that cause spurious scrolls:**
- `messagesBottomInset` — recalculated every time `bottomDockHeight` changes (layout measurement fires on mount and on any re-render of the dock).
- `inputBarHeight` — re-measured on mount, on reply preview appearing/disappearing, on multiSelectBar appearing.
- `isTyping` — toggles on every remote keystroke event. When it goes `false → true → false`, this useEffect fires **three** times.
- `replyTo?.id` — changes when the user taps reply, causing an extra scroll.

Combined with `onContentSizeChange`, a single incoming message triggers **two** simultaneous scroll-to-end calls with no animation, producing a visible snap/jump.

#### 3. Android keyboard offset (lines 435–437)

```tsx
const dockBottomOffset = Platform.OS === 'ios' ? keyboardBottomOffset : 0;
const effectiveDockOffset = anyPanelOpen && dockBottomOffset === 0 ? PANEL_HEIGHT : dockBottomOffset;
const messagesBottomInset = bottomDockHeight + effectiveDockOffset + 12;
```

On Android, `dockBottomOffset` is hardcoded to `0` regardless of keyboard state. When the keyboard opens:
- `messagesBottomInset` does **not** increase.
- The `bottomDock` stays at `bottom: 0` (physical bottom of screen), which is fine because Android handles keyboard avoidance via `android:windowSoftInputMode`.
- BUT if `android:windowSoftInputMode` is set to `adjustResize`, the FlatList shrinks but `messagesBottomInset` does not update, leaving the spacer **too small**, so the last message is obscured by the input bar.

#### 4. SafeAreaView edges (line 2356)

```tsx
<SafeAreaView style={...} edges={['left', 'right']}>
```

`top` and `bottom` safe area edges are **not** included. On Android devices with gesture navigation or on-screen buttons, the bottom inset is not automatically added, which means the input bar sits above the navigation bar correctly but the FlatList scroll area has no bottom padding from safe area.

#### 5. styles.messagesList (line ~3568)

```tsx
messagesList: { paddingHorizontal: Spacing.sm + 2, paddingTop: 4, paddingBottom: Spacing.sm, gap: 2 },
```

`paddingBottom: Spacing.sm` (likely 8px) applies **always**, but this is merged with the `contentContainerStyle` override of `paddingBottom: 12`, which wins. Neither value is large enough to clear the dock on its own.

#### 6. Multiple setMessages call sources causing re-renders

The following all call `setMessages` independently and in quick succession when a message arrives:

- `subscribeToChat` realtime subscription (line ~736)
- `useChatStream` SSE stream (line ~557)
- Optional polling fallback (line ~758)

Each `setMessages` call increments `messages.length`, firing the scroll `useEffect`. If both the SSE and Realtime subscription deliver the same message, `mergeMessages` deduplicates, but the two separate `setMessages` calls still each fire the effect, causing two scroll attempts within the same frame.

---

## Conclusions

| # | Issue | Root cause | Location |
|---|-------|-----------|----------|
| 1 | List jumps on new message | `useEffect` has `messagesBottomInset`, `inputBarHeight`, `isTyping`, `replyTo` as dependencies → scrolls on every layout change, not just new messages | Line 850 |
| 2 | Double scroll on new message | Both `useEffect` and `onContentSizeChange` call `scrollToEnd` simultaneously | Lines 850, 2436 |
| 3 | Last message hidden on Android | `messagesBottomInset` spacer does not account for Android keyboard (offset hardcoded to 0), and `SafeAreaView` excludes `bottom` edge | Lines 435–437, 2356 |
| 4 | Typing toggle causes scroll | `isTyping` is a dependency of the scroll `useEffect` | Line 856 |

---

## Recommended Fixes

> ⚠️ These fixes do NOT touch keyboard behavior, keyboard toolbar, or keyboard dismiss logic.

### Fix 1 — Remove spurious dependencies from the scroll useEffect

**Current:**
```tsx
}, [messages.length, messagesBottomInset, inputBarHeight, isTyping, replyTo?.id, scrollToBottom]);
```

**Fix:** Only scroll when `messages.length` actually increases (new message added):
```tsx
}, [messages.length, scrollToBottom]);
```

`messagesBottomInset`, `inputBarHeight`, `isTyping`, and `replyTo?.id` should not drive a scroll. The spacer already handles layout; the scroll is only needed when content is added.

### Fix 2 — Remove `onContentSizeChange` scroll (deduplicates the double-trigger)

**Current:**
```tsx
onContentSizeChange={() => {
  if (!isLoadingMoreRef.current) {
    flatListRef.current?.scrollToEnd({ animated: false });
  }
}}
```

**Fix:** Remove this prop entirely. The `useEffect` (after Fix 1) already handles scrolling when new messages arrive. `onContentSizeChange` fires on every size change (typing indicator, reactions, layout shifts) and is the second source of the jump.

### Fix 3 — Make the Android bottom spacer account for the dock height reliably

**Current:**
```tsx
const messagesBottomInset = bottomDockHeight + effectiveDockOffset + 12;
```

The spacer `<View style={{ height: messagesBottomInset }} />` is only correct once `bottomDockHeight` is measured. On first render it is `0`, leaving the last message partially hidden.

**Fix:** Add a minimum fallback for Android so the spacer is never zero:
```tsx
const ANDROID_INPUT_BAR_FALLBACK = 70; // px — approximate height of ChatInputBar
const messagesBottomInset =
  bottomDockHeight > 0
    ? bottomDockHeight + effectiveDockOffset + 12
    : (Platform.OS === 'android' ? ANDROID_INPUT_BAR_FALLBACK + 12 : 12);
```

This guarantees the last message is never clipped on first render on Android.

### Fix 4 — Add `bottom` to SafeAreaView edges on Android

**Current:**
```tsx
<SafeAreaView style={...} edges={['left', 'right']}>
```

**Fix:** On Android, add the `bottom` edge so gesture navigation bar is accounted for:
```tsx
<SafeAreaView
  style={[styles.container, { backgroundColor: C.bgPrimary }]}
  edges={Platform.OS === 'android' ? ['left', 'right', 'bottom'] : ['left', 'right']}
>
```

> Note: `top` is intentionally excluded because the `ChatHeader` handles its own top padding.

### Fix 5 — Prevent double-delivery scroll from SSE + Realtime

The SSE (`useChatStream`) and Supabase Realtime (`subscribeToChat`) can both deliver the same message. `mergeMessages` deduplicates the message from the array, but both `setMessages` calls still execute and still change `messages` reference, triggering two renders. This is harder to eliminate without touching the subscription logic, but Fixes 1 and 2 above prevent any visible effect because the scroll only fires once per `messages.length` increment — `mergeMessages` ensures the count only increases by 1 even if called twice.

---

## Summary of changes required (files to modify)

| File | Change |
|------|--------|
| `app/chat/[id].tsx` | Remove `messagesBottomInset`, `inputBarHeight`, `isTyping`, `replyTo?.id` from `useEffect` deps (Fix 1) |
| `app/chat/[id].tsx` | Remove `onContentSizeChange` prop from `FlatList` (Fix 2) |
| `app/chat/[id].tsx` | Add Android fallback to `messagesBottomInset` calc (Fix 3) |
| `app/chat/[id].tsx` | Add `bottom` to `SafeAreaView` edges on Android (Fix 4) |

All four changes are confined to `app/chat/[id].tsx` and none of them touch keyboard handling, the ChatInputBar component, or the keyboard toolbar.
