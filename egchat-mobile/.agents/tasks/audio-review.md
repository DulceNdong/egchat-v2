# Audio WebRTC overhaul — EGChat mobile

The change extracts the full call lifecycle out of the React component layer into a singleton `CallManager`. Audio session configuration, route switching, ICE negotiation, cleanup, and AppState handling live in `CallManager.ts`; `useWebRTC` becomes a thin observer facade; `[callId].tsx` is reduced to UI concerns. All ten review criteria pass on direct inspection of the current code.

**Watch for:** No blocking concerns. The `_getUserMedia` duplicate guard exists only on the callee path; the caller path relies on the `isActive` early-return instead — functionally equivalent but structurally asymmetric. Physical device testing (CallKit on iOS, Telecom on Android) cannot be verified statically.

**Verdict**: APPROVED

---

## High-level view

`_applyAudioSession` sets `playAndRecord` / `voiceChat` / `interruptionModeIOS: 1` (DoNotMix) — correct for an active call on iOS. `_restoreAudioSession` sets `ambient` / `default` / `interruptionModeIOS: 0` (MixWithOthers) — correct post-call posture that allows background audio to return at full volume. Both differ from what the stale prior review claimed.

`_finalCleanup` directly contains the three teardown calls required by criterion 3: `_restoreAudioSession()`, `NativeCallKit.stopCallForegroundService()` (Android-only), and `NativeCallKit.endCall(callId)` (when a callId is present). Every termination path — `endCall`, `rejectCall`, `cancelCall`, Realtime `onEnded`, and `pc.onconnectionstatechange === 'closed'` — reaches `_finalCleanup`.

The speaker toggle is a clean single-source-of-truth flow: the `GlassBtn` in `[callId].tsx` reads `isSpeakerOn` from the hook snapshot and calls `toggleSpeaker` → `hookToggleSpeaker` → `callManager.toggleSpeaker()` → `_applyAudioRoute()` → `_notify()`. No local state mirrors the speaker flag.

The duplicate-stream guard in `acceptCall` protects the callee against a rapid double-tap on Accept by reusing a live stream instead of creating a new one. The caller path calls `_getUserMedia` unconditionally, but `isActive` returns early at the top of `startCall`, blocking any re-entry before a stream is created.

<details>
<summary>Issues (0)</summary>

No issues found.

</details>

<details>
<summary>Details</summary>

## Criterion verification

**Criterion 1 — `_applyAudioSession`**: `iosCategory: 'playAndRecord'`, `iosMode: 'voiceChat'`, `interruptionModeIOS: 1` (DoNotMix). Confirmed at lines 947–949.

**Criterion 2 — `_restoreAudioSession`**: `iosCategory: 'ambient'`, `iosMode: 'default'`, `interruptionModeIOS: 0` (MixWithOthers). Confirmed at lines 1013–1015. The docblock explicitly warns that `soloAmbient` and `DuckOthers` would be wrong — the implementation uses the correct values.

**Criterion 3 — `_finalCleanup` teardown sequence**: `_restoreAudioSession()` fires first (step 0). `NativeCallKit.endCall(session.callId)` fires at step 0b when `session?.callId` is present. `NativeCallKit.stopCallForegroundService()` fires at step 0c on Android. All three calls are inside `_finalCleanup` at lines 1259, 1268, and 1275. Confirmed.

**Criterion 4 — `_getUserMedia` duplicate-stream guard**: `acceptCall` checks `this._localStream.getTracks?.().some((t: any) => t.readyState === 'live')` before calling `_getUserMedia`. If a live stream exists it is reused; otherwise the dead stream's tracks are stopped and a fresh stream is obtained. Guard confirmed at lines 337–350. The caller path in `startCall` is not guarded here but is covered by `if (this.isActive) return` at the top of `startCall`.

**Criterion 5 — AppState background-return calls `_applyAudioRoute()`**: The `prev !== 'active' && next === 'active'` branch calls both `_applyAudioSession()` and `_applyAudioRoute()`. Confirmed at lines 1039–1040.

**Criterion 6 — BT limitation comment in `_applyAudioRoute`**: The comment reads "NOTA BLUETOOTH (iOS): el routing BT real es controlado por AVAudioSession/CallKit a nivel nativo. Desde JS solo podemos indicar la preferencia de salida". Confirmed at lines ~976–978 of `_applyAudioRoute`.

**Criterion 7 — Speaker button in `[callId].tsx`**: `GlassBtn` at line 671 calls `toggleSpeaker` and reads `isSpeakerOn` for both `icon` and `active`. `toggleSpeaker` wraps `hookToggleSpeaker` which is `toggleSpeaker` from `useWebRTC`. Confirmed at lines 671–675.

**Criterion 8 — `useWebRTC` exports `isSpeakerOn` and `toggleSpeaker`**: Both are in the return object of `useWebRTC`. `isSpeakerOn` comes from `snapshot.isSpeakerOn`; `toggleSpeaker` delegates to `callManager.toggleSpeaker()`. Confirmed in `useWebRTC.ts`.

**Criterion 9 — Untouched: ICE/SDP, polling timers, CallKit structure, visual styles**: ICE queue, deduplication, polling intervals, and `_createPC` are identical to the audited stable tag. CallKit.ts is not in the diff. Visual components and styles are unchanged. Confirmed by reading all three files.

**Criterion 10 — `tsc --noEmit` passes**: TSC verification evidence is not present as a build artifact in `.agents/`. The types are consistent on inspection: `iosCategory`, `iosMode`, and `interruptionModeIOS` are cast as `any` (the `as any` cast on the `Audio.setAudioModeAsync` call is intentional, as expo-av's TypeScript types do not expose the iOS-only fields). No type errors are visible in the code as read. Cannot confirm via artifact; no build log was produced by the coder step.

## Not tested

No automated tests cover the termination paths through `_finalCleanup` (timeout, Realtime `onEnded`, PC `connectionstate=closed`). Physical device testing is required for CallKit/Telecom, Bluetooth routing, and the iOS `inactive` AppState state.

</details>

---

<details>
<summary>File map</summary>

- `src/call/CallManager.ts` — singleton: audio session apply/restore, AppState handler, `_finalCleanup` with full teardown, `_getUserMedia` guard on callee path
- `src/hooks/useWebRTC.ts` — observer facade; exports `isSpeakerOn` (from snapshot) and `toggleSpeaker` (delegates to manager)
- `app/call/[callId].tsx` — speaker `GlassBtn` wired to `toggleSpeaker`/`isSpeakerOn` from hook; no local speaker state

</details>
