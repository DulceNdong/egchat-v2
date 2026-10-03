# Audio WebRTC overhaul — EGChat mobile

The change extracts the full call lifecycle out of the React component layer into a singleton `CallManager`. Audio session configuration, route switching, ICE negotiation, cleanup, and AppState handling live in `CallManager.ts`; `useWebRTC` becomes a thin observer facade; `[callId].tsx` is reduced to UI concerns. The implementation correctly addresses most of the original audit requirements: duplicate stream prevention, proper iOS AudioSession categories on the active-call path, Android foreground service lifecycle, and a single-source-of-truth speaker toggle.

**Watch for:**
- `_restoreAudioSession` uses `iosCategory: 'soloAmbient'` instead of `'ambient'` (confirmed — criterion 2 fails).
- `_restoreAudioSession` uses `interruptionModeIOS: 2` (DuckOthers) instead of `0` (MixWithOthers) (confirmed — criterion 2 fails).
- `_finalCleanup` does not directly call `NativeCallKit.endCall(callId)` (criterion 3 partially satisfied via call site delegation, but spec requires it inside `_finalCleanup`).
- TSC verification evidence (`tsc --noEmit` output) is absent from `.agents/`; compile status unverified (low severity).

**Verdict**: NEEDS_CHANGES

---

## High-level view

`_applyAudioSession` and `_applyAudioRoute` are correct: the active-call path sets `playAndRecord` / `voiceChat` with `interruptionModeIOS: 1` (DoNotMix), and route switching correctly alternates between `voiceChat` (earpiece) and `spokenAudio` (loudspeaker). The restore path is wrong on both diverging fields — `soloAmbient` instead of `ambient` means other audio sources remain silenced after the call ends; `DuckOthers` (2) instead of `MixWithOthers` (0) prevents background audio from returning to full volume.

The `_getUserMedia` duplicate-stream guard exists in `acceptCall` (double-tap protection on Accept). The caller path in `startCall` omits this guard but is protected instead by the `isActive` early return at the top of `startCall`, making the asymmetry low-risk in practice.

`_finalCleanup` calls `_restoreAudioSession` and `stopCallForegroundService` (Android) as required. It does not call `NativeCallKit.endCall(callId)`, but every current path that reaches `_finalCleanup` has already called it upstream (`endCall`, `rejectCall`, `cancelCall`). Criterion 3 as written requires the call to be inside `_finalCleanup`; that is not met, though no functional bug exists today.

AppState returning-from-background calls both `_applyAudioSession()` and `_applyAudioRoute()` (criterion 5, confirmed). The Bluetooth limitation comment is present in `_applyAudioRoute` (criterion 6, confirmed). `useWebRTC` exports `isSpeakerOn` and `toggleSpeaker` (criterion 8, confirmed). The speaker button in `[callId].tsx` reads `isSpeakerOn` from the hook snapshot and delegates to `hookToggleSpeaker` (criterion 7, confirmed). ICE/SDP logic, polling timers, and CallKit structure are unchanged (criterion 9, confirmed).

<details>
<summary>Issues (3)</summary>

1. **Wrong restore category** — `_restoreAudioSession` uses `iosCategory: 'soloAmbient'` instead of `'ambient'`. After a call, `soloAmbient` continues to silence other audio sources for the duration of the app session; `ambient` allows mixing. Change to `'ambient'`.
2. **Wrong restore interruption mode** — `_restoreAudioSession` uses `interruptionModeIOS: 2` (DuckOthers) instead of `0` (MixWithOthers). Music playing before the call will not return to full volume after hang-up. Change the literal to `0`.
3. **`NativeCallKit.endCall` not inside `_finalCleanup`** — criterion 3 requires `_finalCleanup` to call `NativeCallKit.endCall(callId)` when a callId is present. Currently the call happens upstream in `endCall`/`rejectCall`/`cancelCall` and `_finalCleanup` skips it. No active bug today, but any future direct caller of `_finalCleanup` will silently leave CallKit in an active state. Add `if (session?.callId) { try { NativeCallKit.endCall(session.callId); } catch {} }` inside `_finalCleanup`.

</details>

<details>
<summary>Details</summary>

## Active-call audio session (`_applyAudioSession`, `_applyAudioRoute`)

`_applyAudioSession` sets `iosCategory: 'playAndRecord'`, `iosMode: 'voiceChat'`, `interruptionModeIOS: 1` (DoNotMix). This matches criterion 1 exactly (confirmed).

`_applyAudioRoute` also uses `playAndRecord` and switches `iosMode` between `'voiceChat'` (earpiece) and `'spokenAudio'` (loudspeaker) based on `useEarpiece`. The Bluetooth iOS caveat comment is present (criterion 6, confirmed).

## `_restoreAudioSession` — category and interruption mode mismatch

The current restore call:

```typescript
iosCategory:         'soloAmbient',
iosMode:             'default',
interruptionModeIOS: 2,  // comment says DuckOthers
```

Criterion 2 requires:

```typescript
iosCategory:         'ambient',
iosMode:             'default',
interruptionModeIOS: InterruptionModeIOS.MixWithOthers  // value 0
```

`soloAmbient` deactivates other audio sessions and keeps them suppressed. `ambient` allows mixing, which is the correct post-call posture. `DuckOthers` (2) attenuates competing audio; `MixWithOthers` (0) returns all audio to its prior level. Both divergences affect observable user behavior on iOS: music or podcasts playing before the call will not resume correctly after hang-up.

## `_getUserMedia` duplicate-stream guard

In `acceptCall`, before `_getUserMedia`, the code checks whether a live stream already exists:

```typescript
if (
  this._localStream &&
  this._localStream.getTracks?.().some((t: any) => t.readyState === 'live')
) {
  stream = this._localStream;
} else {
  stream = await this._getUserMedia(callType);
}
```

This satisfies criterion 4 for the callee path (rapid double-tap on Accept). The caller path in `startCall` calls `_getUserMedia` unconditionally, but the `if (this.isActive) return` guard at the top of `startCall` prevents re-entry, so double track creation is blocked by a different mechanism.

## `_finalCleanup` — CallKit endCall

`endCall()` calls `NativeCallKit.endCall(callId)` before delegating to `_finalCleanup`. `rejectCall()` and `cancelCall()` each call their respective native teardown before `_finalCleanup`. The Realtime `onEnded` handler and the `pc.onconnectionstatechange === 'closed'` handler both arrive at `_finalCleanup` via `this.endCall()`, so they inherit the `NativeCallKit.endCall` call.

Criterion 3 as written requires `_finalCleanup` itself to contain the call. It does not. The functional gap is currently zero, but the criterion is not met by the code structure.

## Speaker toggle data flow

`[callId].tsx` destructures `isSpeakerOn` and `hookToggleSpeaker` (as `toggleSpeaker` from `useWebRTC`). The local `toggleSpeaker` callback wraps `hookToggleSpeaker`, which calls `callManager.toggleSpeaker()`. The manager flips `_isSpeakerOn`, calls `_applyAudioRoute()`, then `_notify()`. The observer in `useWebRTC` receives the snapshot and triggers re-render. The `GlassBtn` for speaker reads `isSpeakerOn` from the snapshot for both `active` and `icon`. No independent local speaker state exists (criteria 7 and 8, confirmed).

## AppState returning from background

The handler for `prev !== 'active' && next === 'active'` calls both `_applyAudioSession()` and `_applyAudioRoute()`. `_applyAudioRoute()` re-applies the user's current speaker preference, satisfying criterion 5 (confirmed).

## Not tested

No automated tests cover:
- `_restoreAudioSession` called on every termination path (timeout, PC closure).
- `_getUserMedia` guard against rapid double-tap on Accept.
- Speaker state surviving background/foreground transitions.

Physical device testing is required for CallKit/Telecom integration (iOS inactive state, Bluetooth routing) and cannot be verified statically.

</details>

---

<details>
<summary>File map</summary>

- `src/call/CallManager.ts` — singleton: full WebRTC + audio session + AppState + ICE/polling lifecycle
- `src/hooks/useWebRTC.ts` — observer facade; exports `isSpeakerOn` and `toggleSpeaker`
- `app/call/[callId].tsx` — speaker button wired to `hookToggleSpeaker` / `isSpeakerOn` from hook snapshot; no local speaker state

</details>
