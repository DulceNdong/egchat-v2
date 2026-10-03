// ══════════════════════════════════════════════════════════════════
// EGChat — CallManager (singleton global)
//
// ÚNICA instancia de RTCPeerConnection por sesión.
// Vive fuera de cualquier pantalla — la llamada sobrevive la navegación.
// La UI se suscribe via observer pattern; el manager nunca importa React.
//
// Flujo de estados:
//   Caller:  idle → calling → connecting → connected → ended
//   Callee:  idle → ringing → accepted → connecting → connected → ended
//   Fallo:   cualquiera → failed / missed / rejected
//   Reconex: connected → reconnecting → connected / failed
// ══════════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { callAPI } from '../api';
import { stopRingtone, stopDialingTone, startRingtone, startDialingTone } from '../hooks/useSounds';
import { NativeCallKit } from '../native/CallKit';
import { LiveActivity } from '../native/LiveActivity';
import type {
  CallCommState,
  CallUIState,
  CallSession,
  CallManagerState,
  CallStateObserver,
  IncomingCallPayload,
} from './types';

// ── WebRTC nativo (react-native-webrtc) ───────────────────────────
type NativeWebRTC = {
  RTCPeerConnection: new (config: object) => any;
  RTCIceCandidate: new (init: object) => any;
  RTCSessionDescription: new (init: object) => any;
  mediaDevices: { getUserMedia: (c: object) => Promise<any> };
  RTCView: any;
};

let NativeRTC: NativeWebRTC | null = null;
try {
  if (Platform.OS !== 'web') {
    NativeRTC = require('react-native-webrtc');
    (global as any).nativeCallMedia = true;
  }
} catch {
  NativeRTC = null;
}

export const HAS_NATIVE_MEDIA = !!NativeRTC && Platform.OS !== 'web';

// ── ICE servers (tomados del useWebRTC.ts original) ───────────────
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const TURN_SERVERS: object[] = process.env.EXPO_PUBLIC_TURN_SERVERS
  ? JSON.parse(process.env.EXPO_PUBLIC_TURN_SERVERS)
  : [
      { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:80?transport=tcp',  username: 'openrelayproject', credential: 'openrelayproject' },
    ];

const ICE_SERVERS = [...STUN_SERVERS, ...TURN_SERVERS];

// ── Timeouts ──────────────────────────────────────────────────────
const CALL_TIMEOUT_MS   = 90_000;  // 90s sin respuesta → missed
const RECONNECT_WAIT_MS =  3_000;  // 3s disconnected antes de intentar restart
const RECONNECT_MAX     = 3;       // máximo intentos de ICE restart

// ══════════════════════════════════════════════════════════════════
export class CallManager {

  // ── Singleton ─────────────────────────────────────────────────
  private static _instance: CallManager | null = null;

  static getInstance(): CallManager {
    if (!CallManager._instance) {
      CallManager._instance = new CallManager();
    }
    return CallManager._instance;
  }

  // ── Estado interno ─────────────────────────────────────────────
  private _commState: CallCommState = 'idle';
  private _uiState:   CallUIState   = 'hidden';
  private _session:   CallSession | null = null;
  private _localStream:  any | null = null;
  private _remoteStream: any | null = null;
  private _isMuted    = false;
  private _isCamOff   = false;
  private _isSpeakerOn = true;
  private _isSignalingOnly = !HAS_NATIVE_MEDIA;

  // ── Refs internos ──────────────────────────────────────────────
  private _pc:             any | null = null;
  private _pollingTimer:   ReturnType<typeof setInterval> | null = null;
  private _durationTimer:  ReturnType<typeof setInterval> | null = null;
  private _callTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectCount  = 0;
  private _iceSent         = new Set<string>();
  private _isEnding        = false;   // guard: evita double-end
  private _ringStopped     = false;   // guard: evita double-stop ringtone

  // ── Observers ─────────────────────────────────────────────────
  private _observers = new Set<CallStateObserver>();

  subscribe(observer: CallStateObserver): () => void {
    this._observers.add(observer);
    // Emitir estado actual inmediatamente al suscribirse
    observer(this._snapshot());
    return () => { this._observers.delete(observer); };
  }

  private _notify(): void {
    const snap = this._snapshot();
    this._observers.forEach(fn => {
      try { fn(snap); } catch { /* observer no debe romper el manager */ }
    });
  }

  private _snapshot(): CallManagerState {
    return {
      commState:       this._commState,
      uiState:         this._uiState,
      session:         this._session,
      localStream:     this._localStream,
      remoteStream:    this._remoteStream,
      isMuted:         this._isMuted,
      isCamOff:        this._isCamOff,
      isSpeakerOn:     this._isSpeakerOn,
      isSignalingOnly: this._isSignalingOnly,
    };
  }

  // ── Getters públicos ───────────────────────────────────────────
  get state(): CallManagerState  { return this._snapshot(); }
  get commState(): CallCommState { return this._commState; }
  get session(): CallSession | null { return this._session; }
  get isActive(): boolean {
    return !['idle', 'ended', 'failed', 'rejected', 'missed'].includes(this._commState);
  }

  // ══════════════════════════════════════════════════════════════
  // INICIAR LLAMADA (rol Caller)
  // ══════════════════════════════════════════════════════════════
  async startCall(
    callType: 'audio' | 'video',
    targetUserId: string,
    targetName: string,
    targetAvatar: string,
    callId: string,
    chatId?: string,
  ): Promise<void> {
    if (this.isActive) {
      console.warn('[CallManager] Ya existe una llamada activa');
      return;
    }

    this._reset();
    this._session = {
      callId, callType, role: 'caller',
      targetUserId, targetName, targetAvatar, chatId,
      duration: 0,
    };
    this._isEnding = false;
    this._ringStopped = false;

    if (!HAS_NATIVE_MEDIA) {
      // Modo señalización (Expo Go) — sin media real
      this._isSignalingOnly = true;
      this._setCommState('calling');
      await callAPI.offer({
        callId, offer: { type: 'offer', sdp: 'egchat-expo-go-signaling-only' },
        targetUserId, type: callType,
      });
      this._startSignalingPoll('caller');
      return;
    }

    const ok = await this._ensurePermissions(callType);
    if (!ok) throw new Error(
      callType === 'video'
        ? 'Permisos de cámara o micrófono denegados. Actívalos en Ajustes.'
        : 'Permiso de micrófono denegado. Actívalo en Ajustes.'
    );

    const stream = await this._getUserMedia(callType);
    this._localStream = stream;
    this._notify();

    const pc = this._createPC(callType);
    this._addTracks(pc, stream);
    pc.onicecandidate = (e: any) => { if (e.candidate) this._sendIce(e.candidate, 'caller'); };

    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);

    // Enviar VoIP push ANTES del offer para despertar al destinatario
    callAPI.sendVoipPush({ targetUserId, callId, callType, offer: pc.localDescription })
      .catch(() => { /* silencioso */ });

    await callAPI.offer({ callId, offer: pc.localDescription, targetUserId, type: callType });

    this._setCommState('calling');
    startDialingTone().catch(() => {});
    this._startCallTimeout();
    this._startPollingCaller();
  }

  // ══════════════════════════════════════════════════════════════
  // RECIBIR LLAMADA — registrar payload entrante (sin aceptar aún)
  // ══════════════════════════════════════════════════════════════
  registerIncoming(payload: IncomingCallPayload): void {
    if (this.isActive) {
      console.warn('[CallManager] Llamada entrante ignorada — ya hay una activa');
      return;
    }
    this._reset();
    this._isEnding = false;
    this._ringStopped = false;
    this._session = {
      callId:      payload.callId,
      callType:    payload.callType,
      role:        'callee',
      targetUserId: payload.targetUserId || '',
      targetName:  payload.callerName,
      targetAvatar: payload.callerAvatar,
      offer:       payload.offer,
      chatId:      payload.chatId,
      duration:    0,
    };
    this._setCommState('ringing');
    this._setUIState('full');
    startRingtone().catch(() => {});
  }

  // ══════════════════════════════════════════════════════════════
  // ACEPTAR LLAMADA (rol Callee)
  // ══════════════════════════════════════════════════════════════
  async acceptCall(): Promise<void> {
    if (this._commState !== 'ringing' || !this._session) {
      console.warn('[CallManager] acceptCall: estado incorrecto', this._commState);
      return;
    }

    this._setCommState('accepted');
    this._stopRingOnce();

    const { callId, callType, offer: rawOffer } = this._session;

    if (!HAS_NATIVE_MEDIA) {
      this._isSignalingOnly = true;
      await callAPI.answer({ callId, answer: { type: 'answer', sdp: 'egchat-expo-go-answer' } });
      this._setCommState('connected');
      this._startDurationTimer();
      return;
    }

    const ok = await this._ensurePermissions(callType);
    if (!ok) {
      await this.endCall();
      throw new Error('Permisos denegados. Actívalos en Ajustes.');
    }

    // Obtener offer válido — con reintentos para cold start de Render
    let offer = rawOffer;
    if (!this._isValidSdp(offer)) {
      offer = await this._fetchOfferWithRetry(callId);
    }
    if (!this._isValidSdp(offer)) {
      await this.endCall();
      throw new Error('No se pudo obtener los datos de la llamada.');
    }

    const stream = await this._getUserMedia(callType);
    this._localStream = stream;
    this._notify();

    const pc = this._createPC(callType);
    this._addTracks(pc, stream);
    pc.onicecandidate = (e: any) => { if (e.candidate) this._sendIce(e.candidate, 'callee'); };

    await pc.setRemoteDescription(new NativeRTC!.RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await callAPI.answer({ callId, answer: pc.localDescription });

    this._setCommState('connecting');
    this._startPollingCallee();
  }

  // ══════════════════════════════════════════════════════════════
  // RECHAZAR LLAMADA (rol Callee, antes de aceptar)
  // ══════════════════════════════════════════════════════════════
  async rejectCall(): Promise<void> {
    if (!this._session) return;
    const { callId } = this._session;
    this._stopRingOnce();
    this._setCommState('rejected');
    try { await callAPI.end(callId); } catch { /* ignorar */ }
    try { NativeCallKit.rejectCall(callId); } catch { /* módulo no disponible */ }
    this._finalCleanup();
    this._setCommState('idle');
  }

  // ══════════════════════════════════════════════════════════════
  // CANCELAR LLAMADA (rol Caller, antes de que contesten)
  // ══════════════════════════════════════════════════════════════
  async cancelCall(): Promise<void> {
    if (!this._session) return;
    const { callId } = this._session;
    stopDialingTone();
    this._setCommState('ended');
    try { await callAPI.end(callId); } catch { /* ignorar */ }
    try { NativeCallKit.endCall(callId); } catch { /* módulo no disponible */ }
    this._finalCleanup();
    this._setCommState('idle');
  }

  // ══════════════════════════════════════════════════════════════
  // FINALIZAR LLAMADA (cualquier rol, cualquier estado activo)
  // ══════════════════════════════════════════════════════════════
  async endCall(): Promise<void> {
    if (this._isEnding) return;
    this._isEnding = true;

    const session = this._session;
    stopDialingTone();
    this._stopRingOnce();
    LiveActivity.endCall();

    // Android: parar ForegroundService
    if (Platform.OS === 'android') {
      try { NativeCallKit.stopCallForegroundService(); } catch { /* ignorar */ }
    }

    if (session?.callId) {
      try { NativeCallKit.endCall(session.callId); } catch { /* ignorar */ }
      try { await callAPI.end(session.callId); } catch { /* ignorar */ }
    }

    this._setCommState('ended');
    this._finalCleanup();

    setTimeout(() => {
      this._setCommState('idle');
      this._session = null;
      this._notify();
    }, 600);
  }

  // ══════════════════════════════════════════════════════════════
  // CONTROLES DE MEDIA
  // ══════════════════════════════════════════════════════════════
  toggleMute(): void {
    this._localStream?.getAudioTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    this._isMuted = !this._isMuted;
    this._notify();
  }

  toggleCamera(): void {
    this._localStream?.getVideoTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    this._isCamOff = !this._isCamOff;
    this._notify();
  }

  async toggleSpeaker(): Promise<void> {
    const next = !this._isSpeakerOn;
    this._isSpeakerOn = next;
    if (Platform.OS !== 'web') {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: !next,
        });
      } catch { /* ignorar */ }
    }
    this._notify();
  }

  // ══════════════════════════════════════════════════════════════
  // UI STATE
  // ══════════════════════════════════════════════════════════════
  setUIState(state: CallUIState): void {
    this._setUIState(state);
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — WebRTC
  // ══════════════════════════════════════════════════════════════
  private _createPC(callType: 'audio' | 'video'): any {
    // Guard: destruir cualquier PC anterior antes de crear uno nuevo
    this._destroyPC();

    const pc = new NativeRTC!.RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (e: any) => {
      const stream = e.streams?.[0] || e.stream;
      if (stream) {
        this._remoteStream = stream;
        this._notify();
      }
    };

    pc.onconnectionstatechange = () => {
      const cs = pc.connectionState;
      if (cs === 'connected') {
        this._reconnectCount = 0;
        if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
        if (this._commState !== 'connected') {
          this._setCommState('connected');
          this._onCallConnected();
        }
      }
      if (cs === 'failed') {
        this._handleConnectionFailed();
      }
      if (cs === 'closed') {
        if (!this._isEnding) this.endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      const ics = pc.iceConnectionState;
      if (ics === 'connected' || ics === 'completed') {
        this._reconnectCount = 0;
        if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
        if (this._commState !== 'connected') {
          this._setCommState('connected');
          this._onCallConnected();
        }
      }
      if (ics === 'disconnected') {
        this._handleIceDisconnected();
      }
      if (ics === 'failed') {
        this._handleConnectionFailed();
      }
    };

    this._pc = pc;
    return pc;
  }

  private _destroyPC(): void {
    if (!this._pc) return;
    try {
      this._pc.ontrack               = null;
      this._pc.onicecandidate        = null;
      this._pc.onconnectionstatechange     = null;
      this._pc.oniceconnectionstatechange  = null;
      this._pc.close();
    } catch { /* ignorar */ }
    this._pc = null;
  }

  private _addTracks(pc: any, stream: any): void {
    try {
      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));
    } catch {
      if (pc.addStream) pc.addStream(stream);
    }
  }

  private async _sendIce(candidate: any, role: 'caller' | 'callee'): Promise<void> {
    const key = candidate?.candidate;
    if (!key || this._iceSent.has(key) || !this._session?.callId) return;
    this._iceSent.add(key);
    try {
      await callAPI.ice({
        callId: this._session.callId,
        candidate: candidate.toJSON ? candidate.toJSON() : candidate,
        role,
      });
    } catch { /* ignorar */ }
  }

  private async _getUserMedia(type: 'audio' | 'video'): Promise<any> {
    const constraints = type === 'video'
      ? { audio: true, video: { facingMode: 'user', width: 640, height: 480, frameRate: 24 } }
      : { audio: true, video: false };
    try {
      return await NativeRTC!.mediaDevices.getUserMedia(constraints);
    } catch {
      return await NativeRTC!.mediaDevices.getUserMedia(
        type === 'video' ? { audio: true, video: true } : { audio: true, video: false }
      );
    }
  }

  private async _ensurePermissions(type: 'audio' | 'video'): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      const mic = await Audio.getPermissionsAsync();
      if (mic.status !== 'granted') {
        const req = await Audio.requestPermissionsAsync();
        if (req.status !== 'granted') return false;
      }
      if (type === 'video') {
        const cam = await Camera.getCameraPermissionsAsync();
        if (cam.status !== 'granted') {
          const req = await Camera.requestCameraPermissionsAsync();
          if (req.status !== 'granted') return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private _isValidSdp(offer: any): boolean {
    return (
      offer != null &&
      typeof offer === 'object' &&
      typeof offer.sdp === 'string' &&
      offer.sdp.length > 10 &&
      offer.sdp !== 'egchat-expo-go-signaling-only'
    );
  }

  private async _fetchOfferWithRetry(callId: string): Promise<any> {
    for (let i = 0; i < 20; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 3000));
      try {
        const s = await callAPI.get(callId);
        if (this._isValidSdp(s?.offer)) return s.offer;
      } catch { /* reintenta */ }
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Polling
  // ══════════════════════════════════════════════════════════════
  private _stopPolling(): void {
    if (this._pollingTimer) { clearInterval(this._pollingTimer); this._pollingTimer = null; }
  }

  private _startPollingCaller(): void {
    this._stopPolling();
    const callId  = this._session!.callId;
    let answerSet = false;
    let calleeIce = 0;
    let polls     = 0;
    const FAST    = Platform.OS === 'android' ? 1500 : 1000;
    const SLOW    = Platform.OS === 'android' ? 3000 : 2000;

    this._pollingTimer = setInterval(async () => {
      if (this._isEnding || this._commState === 'idle') { this._stopPolling(); return; }
      polls++;
      if ((answerSet || polls > 30) && this._pollingTimer) {
        clearInterval(this._pollingTimer);
        this._pollingTimer = setInterval(async () => {
          if (this._isEnding) { this._stopPolling(); return; }
          try {
            const s = await callAPI.get(callId);
            if (s?.ended) { this.endCall(); }
          } catch { /* retry */ }
        }, SLOW);
        return;
      }
      try {
        const s = await callAPI.get(callId);
        if (s?.ended) { this.endCall(); return; }
        if (!answerSet && s?.answer && this._pc?.signalingState === 'have-local-offer') {
          await this._pc.setRemoteDescription(new NativeRTC!.RTCSessionDescription(s.answer));
          answerSet = true;
          this._setCommState('connecting');
          this._stopCallTimeout();
        }
        if (answerSet) {
          const cands = s.calleeCandidates || [];
          for (let i = calleeIce; i < cands.length; i++) {
            try { await this._pc!.addIceCandidate(new NativeRTC!.RTCIceCandidate(cands[i])); } catch { /* */ }
          }
          calleeIce = cands.length;
        }
        if (polls > 90 && !answerSet) { this._setCommState('missed'); this.endCall(); }
      } catch { /* retry */ }
    }, FAST);
  }

  private _startPollingCallee(): void {
    this._stopPolling();
    const callId  = this._session!.callId;
    let callerIce = 0;
    const POLL    = Platform.OS === 'android' ? 1500 : 800;

    this._pollingTimer = setInterval(async () => {
      if (this._isEnding || this._commState === 'idle') { this._stopPolling(); return; }
      try {
        const s = await callAPI.get(callId);
        if (s?.ended) { this.endCall(); return; }
        const cands = s?.callerCandidates || [];
        for (let i = callerIce; i < cands.length; i++) {
          try { await this._pc!.addIceCandidate(new NativeRTC!.RTCIceCandidate(cands[i])); } catch { /* */ }
        }
        callerIce = cands.length;
      } catch { /* retry */ }
    }, POLL);
  }

  /** Polling ligero para modo señalización (Expo Go) */
  private _startSignalingPoll(role: 'caller' | 'callee'): void {
    this._stopPolling();
    const callId = this._session!.callId;
    this._pollingTimer = setInterval(async () => {
      if (this._isEnding) { this._stopPolling(); return; }
      try {
        const s = await callAPI.get(callId);
        if (s?.ended) { this.endCall(); return; }
        if (role === 'caller' && s?.answer) {
          this._setCommState('connected');
          this._onCallConnected();
          this._stopPolling();
        }
      } catch { /* retry */ }
    }, 2000);
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Reconexión ICE
  // ══════════════════════════════════════════════════════════════
  private _handleIceDisconnected(): void {
    if (this._isEnding || this._commState === 'idle') return;
    if (this._reconnectTimer) return; // ya hay uno corriendo
    this._setCommState('reconnecting');
    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      if (this._isEnding || !this._pc) return;
      // Si ya se recuperó solo, no hacer nada
      const ics = this._pc.iceConnectionState;
      if (ics === 'connected' || ics === 'completed') return;

      if (this._reconnectCount >= RECONNECT_MAX) {
        this._handleConnectionFailed();
        return;
      }
      this._reconnectCount++;
      try {
        // ICE restart — solo el caller puede iniciar (es quien creó el offer)
        if (this._session?.role === 'caller') {
          const offer = await this._pc.createOffer({ iceRestart: true });
          await this._pc.setLocalDescription(offer);
          await callAPI.offer({
            callId: this._session.callId,
            offer: this._pc.localDescription,
            targetUserId: this._session.targetUserId,
            type: this._session.callType,
          });
        }
        // Si no se conecta en 10s más → failed
        this._reconnectTimer = setTimeout(() => {
          this._reconnectTimer = null;
          if (this._pc?.iceConnectionState !== 'connected' && !this._isEnding) {
            this._handleConnectionFailed();
          }
        }, 10_000);
      } catch {
        this._handleConnectionFailed();
      }
    }, RECONNECT_WAIT_MS);
  }

  private _handleConnectionFailed(): void {
    if (this._isEnding) return;
    this._setCommState('failed');
    this.endCall();
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Timers
  // ══════════════════════════════════════════════════════════════
  private _startCallTimeout(): void {
    this._stopCallTimeout();
    this._callTimeoutTimer = setTimeout(() => {
      if (this._commState === 'calling' || this._commState === 'ringing') {
        this._setCommState('missed');
        this.endCall();
      }
    }, CALL_TIMEOUT_MS);
  }

  private _stopCallTimeout(): void {
    if (this._callTimeoutTimer) { clearTimeout(this._callTimeoutTimer); this._callTimeoutTimer = null; }
  }

  private _startDurationTimer(): void {
    if (this._durationTimer) return; // ya corriendo
    this._durationTimer = setInterval(() => {
      if (!this._session) return;
      this._session = { ...this._session, duration: this._session.duration + 1 };
      this._notify();
    }, 1000);
  }

  private _stopDurationTimer(): void {
    if (this._durationTimer) { clearInterval(this._durationTimer); this._durationTimer = null; }
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Eventos de ciclo de vida
  // ══════════════════════════════════════════════════════════════
  private _onCallConnected(): void {
    stopDialingTone();
    this._stopRingOnce();
    this._stopCallTimeout();
    this._startDurationTimer();

    const session = this._session;
    if (session) {
      LiveActivity.startCall(session.callId, session.targetName, session.callType === 'video');
      try { NativeCallKit.dismissIncomingCall(); } catch { /* ignorar */ }

      // Android: iniciar ForegroundService para mantener el proceso vivo
      if (Platform.OS === 'android') {
        try {
          NativeCallKit.startCallForegroundService(
            session.callId,
            session.targetName,
            session.callType === 'video',
          );
        } catch { /* módulo no disponible en Expo Go */ }
      }
    }

    // Configurar audio para la llamada
    if (Platform.OS !== 'web') {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !this._isSpeakerOn,
        staysActiveInBackground: true,
      }).catch(() => {});
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Cleanup
  // ══════════════════════════════════════════════════════════════
  private _stopRingOnce(): void {
    if (this._ringStopped) return;
    this._ringStopped = true;
    stopRingtone().catch(() => {});
  }

  private _finalCleanup(): void {
    this._stopPolling();
    this._stopDurationTimer();
    this._stopCallTimeout();
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    this._destroyPC();
    if (this._localStream) {
      this._localStream.getTracks?.().forEach((t: any) => t.stop());
      this._localStream = null;
    }
    this._remoteStream = null;
    this._iceSent.clear();
    this._isMuted    = false;
    this._isCamOff   = false;
    this._reconnectCount = 0;
    this._notify();
  }

  private _reset(): void {
    this._finalCleanup();
    this._session        = null;
    this._isEnding       = false;
    this._ringStopped    = false;
    this._isSignalingOnly = !HAS_NATIVE_MEDIA;
    this._setUIState('hidden');
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Setters de estado con notify
  // ══════════════════════════════════════════════════════════════
  private _setCommState(s: CallCommState): void {
    this._commState = s;
    this._notify();
  }

  private _setUIState(s: CallUIState): void {
    this._uiState = s;
    this._notify();
  }
}

// ── Export de la instancia singleton ─────────────────────────────
export const callManager = CallManager.getInstance();
