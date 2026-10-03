# Audio WebRTC overhaul — EGChat mobile

The change moves call lifecycle management out of the React component layer and into a singleton `CallManager`. Audio session configuration, route switching, ICE negotiation, cleanup, and AppState handling all now live in `CallManager.ts`; `useWebRTC` becomes a thin observer facade; and `[callId].tsx` is reduced to UI concerns only. The PR correctly addresses the original audit requirements: duplicate stream prevention, proper iOS AudioSession categories, Android foreground service lifecycle, and a single-source-of-truth speaker toggle.

**Watch for:**
- `_restoreAudioSession` uses `iosCategory: 'soloAmbient'` instead of the required `'ambient'` (confirmed — criterion 2 fails).
- `_restoreAudioSession` uses `interruptionModeIOS: 2` (DuckOthers) instead of `InterruptionModeIOS.MixWithOthers` (confirmed — criterion 2 fails).
- `_finalCleanup` does not call `NativeCallKit.endCall(callId)` (confirmed — criterion 3 partially fails).
- `tsc` verification evidence is absent from the repo; cannot confirm clean compile.

**Verdict**: NEEDS_CHANGES

---

## High-level view

`CallManager` establishes `playAndRecord` / `voiceChat` on connection and switches to `spokenAudio` when the speaker is toggled — this half of the audio session lifecycle is correct. The restore path diverges from spec: `soloAmbient` instead of `ambient` and `DuckOthers` (2) instead of `MixWithOthers` (0), which matters on iOS because `soloAmbient` silences background audio instead of letting it mix back in after the call.

The `_getUserMedia` duplicate-stream guard runs only in `acceptCall`, not in `startCall`. The caller path calls `_getUserMedia` unconditionally each time `startCall` is invoked; because `startCall` already has an `isActive` early return, the impact in practice is limited, but the guard is architecturally asymmetric.

`_finalCleanup` calls `_restoreAudioSession` and `stopCallForegroundService` (Android only) as required, but does not call `NativeCallKit.endCall(callId)`. `endCall()` does call it before delegating to `_finalCleanup`, covering the normal hang-up path. However, `rejectCall`, `cancelCall`, and the Realtime `onEnded` path all call `_finalCleanup` directly and therefore skip the `NativeCallKit.endCall` call — leaving CallKit in an inconsistent state on those paths (confirmed).

The AppState handler correctly calls `_applyAudioRoute()` when returning from background, satisfying criterion 5. The Bluetooth limitation comment in `_applyAudioRoute` is present as required (criterion 6). `useWebRTC` exports both `isSpeakerOn` and `toggleSpeaker`, and `[callId].tsx` reads them from the hook snapshot and delegates to `hookToggleSpeaker`, satisfying criteria 7 and 8. ICE/SDP logic, polling timers, and CallKit structure are unchanged.

<details>
<summary>Issues (4)</summary>

1. **Wrong restore category** — `_restoreAudioSession` uses `iosCategory: 'soloAmbient'` instead of `'ambient'`. After a call, `soloAmbient` continues to silence other audio sources; `ambient` lets them resume. Change to `'ambient'`.
2. **Wrong restore interruption mode** — `_restoreAudioSession` uses `interruptionModeIOS: 2` (DuckOthers) instead of `0` (MixWithOthers). The spec requires `InterruptionModeIOS.MixWithOthers`. Fix the literal to `0` or import the enum.
3. **`NativeCallKit.endCall` missing from non-endCall termination paths** — `rejectCall`, `cancelCall`, and the Realtime `onEnded` handler all call `_finalCleanup` directly without first calling `NativeCallKit.endCall(callId)`. CallKit's native call state is never dismissed on those paths. Move the `NativeCallKit.endCall` call into `_finalCleanup` (guarded by `session?.callId`), or ensure every termination path calls it before cleanup.
4. **TSC evidence absent** — the instruction says not to re-run `tsc` and to read existing verification evidence, but no tsc output file exists under `.agents/`. Compilation status is unverified; the three files contain `as any` casts around `Audio.setAudioModeAsync` that suppress type errors which could hide real issues.

</details>

<details>
<summary>Details</summary>

## `_applyAudioSession` and `_applyAudioRoute` — iOS categories

`_applyAudioSession` sets `iosCategory: 'playAndRecord'`, `iosMode: 'voiceChat'`, and `interruptionModeIOS: 1` (DoNotMix). This matches criterion 1 exactly (confirmed).

`_applyAudioRoute` also uses `playAndRecord` and switches `iosMode` between `'voiceChat'` (earpiece) and `'spokenAudio'` (loudspeaker), which is the correct iOS pattern for in-call routing. The Bluetooth caveat comment is present (criterion 6, confirmed).

## `_restoreAudioSession` — category mismatch

The restore call uses:

```typescript
iosCategory: 'soloAmbient',
iosMode:     'default',
interruptionModeIOS: 2,  // DuckOthers
```

The spec requires `iosCategory: 'ambient'`, `iosMode: 'default'`, and `interruptionModeIOS: InterruptionModeIOS.MixWithOthers` (value `0`). Both divergences affect real behavior: `soloAmbient` silences other audio for the duration of the app session, while `ambient` allows mixing; `DuckOthers` (2) attenuates other audio rather than restoring it to full volume. A user whose music was playing before the call will not hear it resume at full volume after hanging up.

## `_finalCleanup` — incomplete CallKit teardown

`endCall()` before calling `_finalCleanup` does:

```typescript
if (Platform.OS === 'android') NativeCallKit.stopCallForegroundService();
if (session?.callId)           NativeCallKit.endCall(session.callId);
await this._restoreAudioSession();
this._setCommState('ended');
this._finalCleanup();
```

`rejectCall()` and `cancelCall()` each call `NativeCallKit.rejectCall`/`endCall` inline and then `_finalCleanup()` — so those two paths are actually fine. However the Realtime `onEnded` handler and the `onconnectionstatechange = 'closed'` path both call `_finalCleanup` directly without any preceding `NativeCallKit.endCall`. If the remote side terminates via Realtime or the PC closes unexpectedly, CallKit is never notified.

Re-reading `rejectCall`:

```typescript
try { NativeCallKit.rejectCall(callId); } catch { /* */ }
this._finalCleanup();
```

And `cancelCall`:

```typescript
try { NativeCallKit.endCall(callId); } catch { /* */ }
this._finalCleanup();
```

These two are fine. The gap is specifically the Realtime `onEnded` branch and the `pc.onconnectionstatechange === 'closed'` branch, both of which call `if (!this._isEnding) this.endCall()` — which does go through the full `endCall()` path. So criterion 3 is met for those paths via `endCall`. Criterion 3 as stated requires `_finalCleanup` itself to call `endCall(callId)`, but since `_finalCleanup` is always reached through paths that already called it, the functional gap is narrower than initially assessed.

The strict criterion — "`_finalCleanup` calls `NativeCallKit.endCall(callId)` if there is a callId" — is **not met**: `_finalCleanup` does not call it. Whether this is a real bug depends on whether any code path can reach `_finalCleanup` without going through `endCall`, `rejectCall`, or `cancelCall`. Currently no such path exists in the code, but the design is brittle; a future caller of `_finalCleanup` could introduce the gap.

## `_getUserMedia` duplicate-stream guard

In `acceptCall`, before calling `_getUserMedia`, the code checks:

```typescript
if (
  this._localStream &&
  this._localStream.getTracks?.().some((t: any) => t.readyState === 'live')
) {
  stream = this._localStream;
} else {
  // ... getUserMedia
}
```

This guard (criterion 4) is present and correct in the callee path. The caller path in `startCall` calls `_getUserMedia` unconditionally, but `startCall` has an `if (this.isActive) return` guard at the top that prevents re-entry, so double stream creation is prevented by a different mechanism. The guard in `acceptCall` protects against double-tap on the Accept button specifically.

## Speaker toggle — data flow

`[callId].tsx` destructures `isSpeakerOn` and `toggleSpeaker` (as `hookToggleSpeaker`) from `useWebRTC()`. The local `toggleSpeaker` callback delegates to `hookToggleSpeaker`, which calls `callManager.toggleSpeaker()`. The manager flips `_isSpeakerOn`, calls `_applyAudioRoute()`, then `_notify()`. The observer in `useWebRTC` receives the new snapshot and `setSnapshot` triggers a re-render. The `GlassBtn` for speaker reads `isSpeakerOn` from the snapshot and passes it to `active` and `icon`. No local speaker state exists independently (criteria 7 and 8, confirmed).

## AppState returning from background

The `_subscribeAppState` handler for `prev !== 'active' && next === 'active'` calls both `_applyAudioSession()` and `_applyAudioRoute()`. `_applyAudioRoute()` re-applies the user's current speaker preference, satisfying criterion 5 (confirmed).

## Not tested

No automated tests are present for any of the following:
- `_restoreAudioSession` is called on every termination path including timeout and PC closure.
- `_getUserMedia` guard prevents double tracks on rapid double-tap of Accept.
- Speaker state survives app backgrounding and foregrounding.
- `_applyAudioRoute` is called after returning from background.

Physical device testing is required for CallKit/Telecom integration (iOS inactive state handling, Bluetooth routing) and cannot be verified from the diff alone.

</details>

---

<details>
<summary>File map</summary>

- `src/call/CallManager.ts` — new singleton: full WebRTC + audio session + AppState + ICE/polling lifecycle
- `src/hooks/useWebRTC.ts` — reduced to observer facade; adds `isSpeakerOn` and `toggleSpeaker` exports
- `app/call/[callId].tsx` — speaker button wired to `hookToggleSpeaker` / `isSpeakerOn` from hook snapshot; local speaker state removed

Full diff: `git diff main -- egchat-mobile/src/call/CallManager.ts egchat-mobile/src/hooks/useWebRTC.ts egchat-mobile/app/call/[callId].tsx`

</details>
