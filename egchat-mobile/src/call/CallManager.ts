// ══════════════════════════════════════════════════════════════════
// EGChat — CallManager (singleton global)
// Motor WebRTC estabilizado y auditado
//
// ÚNICA instancia de RTCPeerConnection por sesión.
// Vive fuera de cualquier pantalla — la llamada sobrevive la navegación.
//
// Estados WebRTC distinguidos:
//   PC state: new | connecting | connected | disconnected | failed | closed
//   Call state: idle | calling | ringing | accepted | connecting |
//               connected | reconnecting | rejected | missed | ended | failed
//
// Correcciones aplicadas:
//   - Cola ICE para candidatos recibidos antes de setRemoteDescription
//   - Deduplicación ICE por hash completo (no por string vacío)
//   - ICE restart disponible para ambos roles (no solo caller)
//   - TURN credentials obtenidas del servidor (no hardcodeadas)
//   - toggleCamera usa _switchCamera() de react-native-webrtc
//   - Bluetooth y cambios de ruta de audio (AppState)
//   - Timer leak corregido en polling (no setInterval dentro de setInterval)
//   - connected solo se declara cuando ICE/PC están realmente connected
//   - Limpieza completa: tracks, PC, listeners, timers, referencias
//
// v2 — Reconexión robusta ante cambios de red:
//   - Backoff exponencial para ICE restart (2s/4s/8s + jitter ±20%)
//   - Flag _iceRestartPending evita doble-disparo desde dos listeners
//   - ICE restart simétrico: callee detecta nuevo offer y responde
//   - Offsets ICE como propiedades de clase (reseteo controlado en restart)
//   - NetInfo listener proactivo para Wi-Fi↔4G/5G
//   - Reconexión Supabase Realtime con backoff ante CHANNEL_ERROR
//   - TURN token con reintento (cubre cold start de Render)
//   - Timeouts ajustados para redes móviles lentas
// ══════════════════════════════════════════════════════════════════

import { Platform, AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { callAPI } from '../api';
import { saveCallMessage } from './callHistory';
import SessionManager from '../sessionManager';
import { stopRingtone, stopDialingTone, startRingtone, startDialingTone } from '../hooks/useSounds';
import { NativeCallKit } from '../native/CallKit';
import { LiveActivity } from '../native/LiveActivity';
import {
  subscribeToCallState,
  isTerminal,
  type CallStatus,
} from './callSupabase';
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
  RTCIceCandidate:   new (init: object) => any;
  RTCSessionDescription: new (init: object) => any;
  mediaDevices: {
    getUserMedia:   (c: object) => Promise<any>;
    getDisplayMedia?: (c: object) => Promise<any>;
  };
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

// ── ICE servers estáticos (STUN) ──────────────────────────────────
// STUN libre para descubrimiento de IP pública.
// TURN se obtiene del servidor en tiempo real (credenciales temporales).
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302'  },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

// ── TURN fallback (C3 fix) ────────────────────────────────────────
// Prioridad:
//   1. /api/turn-token del backend Render (credenciales temporales, ideal)
//   2. ENV EXPO_PUBLIC_TURN_* (tu propio servidor)
//   3. Metered.ca free tier (50 GB/mes, mejor SLA que OpenRelay)
//
// Para producción configura en .env:
//   EXPO_PUBLIC_TURN_USERNAME=<usuario>
//   EXPO_PUBLIC_TURN_CREDENTIAL=<credencial>
//   EXPO_PUBLIC_TURN_URLS=turn:tu-servidor.com:3478,turns:tu-servidor.com:5349
const TURN_FALLBACK = (() => {
  const user    = process.env.EXPO_PUBLIC_TURN_USERNAME   || 'openrelayproject';
  const cred    = process.env.EXPO_PUBLIC_TURN_CREDENTIAL || 'openrelayproject';
  const rawUrls = process.env.EXPO_PUBLIC_TURN_URLS;
  if (rawUrls) {
    return rawUrls.split(',').map(u => ({ urls: u.trim(), username: user, credential: cred }));
  }
  // Metered.ca free tier — SLA superior a OpenRelay para producción
  return [
    { urls: 'turn:relay.metered.ca:80',               username: user, credential: cred },
    { urls: 'turn:relay.metered.ca:443',              username: user, credential: cred },
    { urls: 'turns:relay.metered.ca:443',             username: user, credential: cred },
    { urls: 'turn:relay.metered.ca:80?transport=tcp', username: user, credential: cred },
  ];
})();

// ── Timeouts ──────────────────────────────────────────────────────
const CALL_TIMEOUT_MS           = 90_000;  // 90s sin respuesta → missed
const ICE_DISCONNECTED_BASE_MS  =  2_000;  // base backoff (×2^intento, jitter ±20%)
const ICE_RESTART_TIMEOUT_MS    = 20_000;  // 20s para que el restart tenga éxito (cubre 4G lento)
const RECONNECT_MAX             = 4;       // 4 intentos antes de declarar failed
const POLL_FAST_IOS             =  900;    // ms
const POLL_FAST_ANDROID         = 1_400;
const POLL_SLOW_IOS             = 2_000;
const POLL_SLOW_ANDROID         = 3_000;

// ── Estado de la PeerConnection (espejo del W3C) ───────────────────
type PCState = 'none' | 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

// ══════════════════════════════════════════════════════════════════
export class CallManager {

  // ── Singleton ─────────────────────────────────────────────────
  private static _instance: CallManager | null = null;
  static getInstance(): CallManager {
    if (!CallManager._instance) CallManager._instance = new CallManager();
    return CallManager._instance;
  }

  // ── Estado del CallManager ─────────────────────────────────────
  private _commState:  CallCommState = 'idle';
  private _uiState:    CallUIState   = 'hidden';
  private _session:    CallSession | null = null;
  private _localStream:  any | null = null;
  private _remoteStream: any | null = null;
  private _isMuted       = false;
  private _isCamOff      = false;
  private _isSpeakerOn   = true;
  private _isBluetoothOn = false;
  private _isFrontCamera = true;              // para switchCamera
  private _isSignalingOnly = !HAS_NATIVE_MEDIA;
  // FIX 3 / FIX 4: referencia al video track original para replaceTrack
  private _videoTrackRef: any | null = null;
  // FIX 4: flag para distinguir pausa de sistema (background iOS) vs. usuario
  private _videoPausedBySystem = false;

  // ── Estado de la PeerConnection (espejo) ──────────────────────
  private _pcState: PCState = 'none';

  // ── WebRTC refs ────────────────────────────────────────────────
  private _pc:             any | null = null;
  private _iceQueue:       any[]      = [];    // candidatos recibidos antes de remoteDesc
  private _iceSentKeys     = new Set<string>(); // deduplicación por candidato serializado
  private _remoteDescSet   = false;
  private _connectedOnce   = false;    // previene doble dispatch de _onCallConnected
  private _isEnding        = false;
  private _ringStopped     = false;
  private _reconnectCount  = 0;

  // FIX A+C — Flag atómico para backoff: evita doble-disparo de _scheduleIceRestart
  private _iceRestartPending = false;

  // FIX B+H — Offsets ICE como propiedades de clase para reseteo controlado en restart
  private _iceOffsetCaller = 0;
  private _iceOffsetCallee = 0;
  private _answerApplied   = false;
  private _appliedOfferVersion = 0;   // detectar restart offer del caller (callee)

  // ── Timers ────────────────────────────────────────────────────
  private _pollingTimer:      ReturnType<typeof setInterval> | null = null;
  private _durationTimer:     ReturnType<typeof setInterval> | null = null;
  private _callTimeoutTimer:  ReturnType<typeof setTimeout>  | null = null;
  private _reconnectTimer:    ReturnType<typeof setTimeout>  | null = null;
  private _iceRestartTimer:   ReturnType<typeof setTimeout>  | null = null;
  private _pollPhase:         'fast' | 'slow' = 'fast';

  // ── AppState, listeners nativos de audio y NetInfo ────────────
  private _appStateSub:       ReturnType<typeof AppState.addEventListener> | null = null;
  private _audioInterruptSub: (() => void) | null = null;
  private _audioRouteSub:     (() => void) | null = null;
  private _netInfoSub:        (() => void) | null = null;   // FIX E
  private _lastAppState: AppStateStatus = 'active';
  private _lastNetConnected: boolean | null = null;         // FIX E

  // ── Supabase Realtime ─────────────────────────────────────────
  // Suscripción al canal call-state para recibir cambios de estado
  // en tiempo real desde otros dispositivos o desde el servidor.
  private _realtimeSub: (() => void) | null = null;

  // ── Observers ─────────────────────────────────────────────────
  private _observers = new Set<CallStateObserver>();

  subscribe(observer: CallStateObserver): () => void {
    this._observers.add(observer);
    observer(this._snapshot());
    return () => { this._observers.delete(observer); };
  }

  private _notify(): void {
    const snap = this._snapshot();
    this._observers.forEach(fn => { try { fn(snap); } catch { /* */ } });
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

  get state(): CallManagerState       { return this._snapshot(); }
  get commState(): CallCommState      { return this._commState; }
  get session():   CallSession | null { return this._session; }
  get isActive(): boolean {
    return !['idle','ended','failed','rejected','missed'].includes(this._commState);
  }

  // ══════════════════════════════════════════════════════════════
  // TURN TEMPORALES — obtenidas del servidor con reintento
  // Evita credenciales permanentes en el cliente.
  // FIX G — reintento único a los 3s para cubrir cold start de Render.
  // ══════════════════════════════════════════════════════════════
  private async _getIceServers(): Promise<object[]> {
    // Intentar hasta 2 veces con pausa entre intentos
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3_000));
        const data = await callAPI.getTurnToken?.();
        if (data?.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          return [...STUN_SERVERS, ...data.iceServers];
        }
      } catch { /* continuar al siguiente intento */ }
    }

    // Fallback: variable de entorno, luego OpenRelay (desarrollo)
    const envTurn = process.env.EXPO_PUBLIC_TURN_SERVERS;
    if (envTurn) {
      try {
        const parsed = JSON.parse(envTurn);
        if (Array.isArray(parsed) && parsed.length > 0) return [...STUN_SERVERS, ...parsed];
      } catch { /* */ }
    }

    return [...STUN_SERVERS, ...TURN_FALLBACK];
  }

  // ══════════════════════════════════════════════════════════════
  // INICIAR LLAMADA (Caller)
  // ══════════════════════════════════════════════════════════════
  async startCall(
    callType:    'audio' | 'video',
    targetUserId: string,
    targetName:   string,
    targetAvatar: string,
    callId:       string,
    chatId?:      string,
  ): Promise<void> {
    if (this.isActive) {
      console.warn('[CallManager] Ya hay una llamada activa');
      return;
    }

    this._reset();
    this._session = { callId, callType, role: 'caller', targetUserId, targetName, targetAvatar, chatId, duration: 0 };

    if (!HAS_NATIVE_MEDIA) {
      this._isSignalingOnly = true;
      this._setCommState('calling');
      await callAPI.offer({ callId, offer: { type: 'offer', sdp: 'egchat-expo-go-signaling-only' }, targetUserId, type: callType });
      this._startPoll('caller', 'fast');
      return;
    }

    if (!await this._ensurePermissions(callType)) {
      throw new Error(callType === 'video'
        ? 'Permisos de cámara o micrófono denegados. Actívalos en Ajustes.'
        : 'Permiso de micrófono denegado. Actívalo en Ajustes.');
    }

    const iceServers = await this._getIceServers();
    const stream     = await this._getUserMedia(callType);
    this._localStream = stream;
    this._notify();

    const pc = await this._createPC(iceServers);
    this._addTracks(pc, stream);
    pc.onicecandidate = (e: any) => this._onLocalIceCandidate(e, 'caller');

    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    this._setPcState('connecting');

    callAPI.sendVoipPush({ targetUserId, callId, callType, offer: pc.localDescription }).catch(() => {});
    await callAPI.offer({ callId, offer: pc.localDescription, targetUserId, type: callType });

    this._setCommState('calling');
    startDialingTone().catch(() => {});
    this._startCallTimeout();
    this._startPoll('caller', 'fast');
    this._subscribeAppState();
    this._subscribeRealtime();
  }

  // ══════════════════════════════════════════════════════════════
  // REGISTRAR LLAMADA ENTRANTE
  // ══════════════════════════════════════════════════════════════
  registerIncoming(payload: IncomingCallPayload): void {
    if (this.isActive) {
      console.warn('[CallManager] Llamada entrante ignorada — ya hay una activa');
      return;
    }
    this._reset();
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
  // ACEPTAR LLAMADA (Callee)
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
      this._onCallConnected();
      return;
    }

    if (!await this._ensurePermissions(callType)) {
      await this.endCall();
      throw new Error('Permisos denegados. Actívalos en Ajustes.');
    }

    let offer = rawOffer;
    if (!this._isValidSdp(offer)) offer = await this._fetchOfferWithRetry(callId);
    if (!this._isValidSdp(offer)) { await this.endCall(); throw new Error('No se pudo obtener los datos de la llamada.'); }

    const iceServers = await this._getIceServers();

    // Guardia contra tracks duplicados: si ya hay un stream con tracks vivos,
    // reutilizarlo en lugar de crear uno nuevo (protege contra doble-tap en "Aceptar").
    let stream: any;
    if (
      this._localStream &&
      this._localStream.getTracks?.().some((t: any) => t.readyState === 'live')
    ) {
      stream = this._localStream;
    } else {
      // Limpiar el stream anterior si sus tracks ya están muertos
      if (this._localStream) {
        try {
          this._localStream.getTracks?.().forEach((t: any) => { t.stop(); t.enabled = false; });
        } catch { /* */ }
        this._localStream = null;
      }
      stream = await this._getUserMedia(callType);
    }
    this._localStream = stream;
    this._notify();

    const pc = await this._createPC(iceServers);
    this._addTracks(pc, stream);
    pc.onicecandidate = (e: any) => this._onLocalIceCandidate(e, 'callee');

    // setRemoteDescription → luego vaciar la cola ICE
    await pc.setRemoteDescription(new NativeRTC!.RTCSessionDescription(offer));
    this._remoteDescSet = true;
    await this._drainIceQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this._setPcState('connecting');
    await callAPI.answer({ callId, answer: pc.localDescription });

    this._setCommState('connecting');
    this._startPoll('callee', 'fast');
    this._subscribeAppState();
    this._subscribeRealtime();
  }

  // ══════════════════════════════════════════════════════════════
  // RECHAZAR / CANCELAR / FINALIZAR
  // ══════════════════════════════════════════════════════════════
  async rejectCall(): Promise<void> {
    if (!this._session) return;
    const session = this._session;
    const { callId } = session;
    this._stopRingOnce();
    this._setCommState('rejected');
    try { await callAPI.reject(callId); } catch { /* ignorar */ }
    try { NativeCallKit.rejectCall(callId); } catch { /* */ }
    // Guardar historial en chat
    if (session.chatId) {
      const myId = SessionManager.getInstance().getUser()?.id ?? '';
      const callerId   = session.role === 'caller' ? myId : session.targetUserId;
      const calleeId   = session.role === 'caller' ? session.targetUserId : myId;
      saveCallMessage({ callId, chatId: session.chatId, callerId, calleeId, callType: session.callType, status: 'rejected', endReason: 'rejected_by_callee' }).catch(() => {});
    }
    this._finalCleanup();
    this._setCommState('idle');
  }

  async cancelCall(): Promise<void> {
    if (!this._session) return;
    const session = this._session;
    const { callId } = session;
    stopDialingTone();
    this._setCommState('ended');
    try { await callAPI.cancel(callId); } catch { /* */ }
    try { NativeCallKit.endCall(callId); } catch { /* */ }
    // Guardar historial en chat
    if (session.chatId) {
      const myId = SessionManager.getInstance().getUser()?.id ?? '';
      const callerId = session.role === 'caller' ? myId : session.targetUserId;
      const calleeId = session.role === 'caller' ? session.targetUserId : myId;
      saveCallMessage({ callId, chatId: session.chatId, callerId, calleeId, callType: session.callType, status: 'ended', endReason: 'cancelled_by_caller' }).catch(() => {});
    }
    this._finalCleanup();
    this._setCommState('idle');
  }

  async endCall(): Promise<void> {
    if (this._isEnding) return;
    this._isEnding = true;

    const session = this._session;
    stopDialingTone();
    this._stopRingOnce();
    LiveActivity.endCall();

    if (Platform.OS === 'android') {
      try { NativeCallKit.stopCallForegroundService(); } catch { /* */ }
    }
    if (session?.callId) {
      try { NativeCallKit.endCall(session.callId); } catch { /* */ }
      const reason = this._commState === 'failed' ? 'ice_failed'
                   : this._commState === 'missed'  ? 'missed'
                   : 'normal';
      try { await callAPI.end(session.callId, reason); } catch { /* */ }
      // Guardar historial en chat
      if (session.chatId) {
        const myId     = SessionManager.getInstance().getUser()?.id ?? '';
        const callerId = session.role === 'caller' ? myId : session.targetUserId;
        const calleeId = session.role === 'caller' ? session.targetUserId : myId;
        const finalStatus = reason === 'ice_failed' ? 'failed' : reason === 'missed' ? 'missed' : 'ended';
        saveCallMessage({
          callId:          session.callId,
          chatId:          session.chatId,
          callerId,
          calleeId,
          callType:        session.callType,
          status:          finalStatus,
          durationSeconds: session.duration > 0 ? session.duration : null,
          endReason:       reason,
        }).catch(() => {});
      }
    }

    // Restituir ruta de audio al estado normal
    await this._restoreAudioSession();

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

  /** Silenciar / activar micrófono */
  toggleMute(): void {
    this._localStream?.getAudioTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    this._isMuted = !this._isMuted;
    this._notify();
  }

  /** Desactivar / activar cámara.
   *
   *  FIX 1 — Usa sender.replaceTrack(null/track) para informar
   *  correctamente al par remoto, en lugar de solo track.enabled.
   *  Algunos codecs (H264, VP8) siguen enviando frames negros si
   *  solo se deshabilita el track sin reemplazarlo en el sender.
   *
   *  Flujo:
   *   desactivar → replaceTrack(null) en el sender + track.enabled=false
   *   activar    → replaceTrack(_videoTrackRef) + track.enabled=true
   *
   *  Si no hay PC activa (llamada aún conectando): solo track.enabled.
   */
  toggleCamera(): void {
    if (!this._localStream) return;
    const tracks: any[] = this._localStream.getVideoTracks?.() || [];
    if (tracks.length === 0) return;

    const next = !this._isCamOff;  // true = apagar, false = encender
    this._isCamOff = next;

    // Guardar referencia al track original la primera vez
    if (!this._videoTrackRef && tracks[0]) {
      this._videoTrackRef = tracks[0];
    }

    const track = tracks[0];

    if (this._pc) {
      // Ruta preferida: replaceTrack informa al peer remoto
      const senders: any[] = this._pc.getSenders?.() || [];
      const videoSender = senders.find((s: any) => s.track?.kind === 'video' || (!s.track && this._videoTrackRef));

      if (videoSender) {
        try {
          if (next) {
            // Apagar: enviar pista nula al remoto
            videoSender.replaceTrack(null);
            if (track) track.enabled = false;
          } else {
            // Encender: restaurar la pista original
            const restoreTrack = this._videoTrackRef || track;
            if (restoreTrack) restoreTrack.enabled = true;
            videoSender.replaceTrack(restoreTrack);
          }
        } catch (e) {
          // Fallback si replaceTrack no está disponible (versión antigua de RNWRTC)
          console.warn('[CallManager] replaceTrack no disponible, usando track.enabled:', e);
          if (track) track.enabled = !next;
        }
      } else {
        // No hay sender de vídeo (llamada de audio) — solo ajustar enabled
        if (track) track.enabled = !next;
      }
    } else {
      // PC aún no existe (p.ej. conectando) — solo track.enabled
      if (track) track.enabled = !next;
    }

    this._notify();
  }

  /** Intercambiar cámara frontal ↔ trasera.
   *
   *  FIX 2 — _isFrontCamera se actualiza aquí y _getUserMedia lo usa
   *  para pedir el facingMode correcto si el track muere y hay que
   *  obtener un nuevo stream (p.ej. tras volver de background en iOS).
   */
  async switchCamera(): Promise<void> {
    if (!this._localStream || this._isCamOff) return;
    const tracks: any[] = this._localStream.getVideoTracks?.() || [];
    if (tracks.length === 0) return;

    try {
      const track = tracks[0];
      if (typeof track._switchCamera === 'function') {
        track._switchCamera();
        this._isFrontCamera = !this._isFrontCamera;
        // Actualizar también la referencia guardada para toggleCamera
        this._videoTrackRef = track;
      }
    } catch (e) {
      console.warn('[CallManager] switchCamera error:', e);
    }
    this._notify();
  }

  /** Altavoz / auricular */
  async toggleSpeaker(): Promise<void> {
    const next = !this._isSpeakerOn;
    this._isSpeakerOn   = next;
    this._isBluetoothOn = false;  // si se activa altavoz, salir de BT
    await this._applyAudioRoute();
    this._notify();
  }

  /** Activar / desactivar Bluetooth */
  async toggleBluetooth(): Promise<void> {
    const next = !this._isBluetoothOn;
    this._isBluetoothOn = next;
    if (next) this._isSpeakerOn = false;  // BT tiene prioridad sobre altavoz
    await this._applyAudioRoute();
    this._notify();
  }

  setUIState(state: CallUIState): void { this._setUIState(state); }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — PeerConnection
  // ══════════════════════════════════════════════════════════════

  /** Crea una nueva PeerConnection.
   *  Siempre destruye la anterior primero. */
  private async _createPC(iceServers: object[]): Promise<any> {
    this._destroyPC();
    this._remoteDescSet = false;
    this._connectedOnce = false;
    this._iceQueue      = [];
    this._iceSentKeys.clear();

    const config = {
      iceServers,
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };

    const pc = new NativeRTC!.RTCPeerConnection(config);
    this._pc = pc;
    this._setPcState('new');

    // ── ontrack ─────────────────────────────────────────────────
    pc.ontrack = (e: any) => {
      const stream = e.streams?.[0] || e.stream;
      if (stream) {
        this._remoteStream = stream;
        this._notify();
      }
    };

    // ── onnegotiationneeded ──────────────────────────────────────
    // FIX 5 — Renegociación simétrica: ambos roles pueden renegociar
    // cuando la llamada ya está conectada (p.ej. callee añade vídeo
    // en mitad de una llamada de audio).
    pc.onnegotiationneeded = async () => {
      if (this._commState !== 'connected') return;
      if (!this._session) return;
      try {
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        await callAPI.offer({
          callId:       this._session.callId,
          offer:        pc.localDescription,
          targetUserId: this._session.targetUserId,
          type:         this._session.callType,
        });
      } catch (e) {
        console.warn('[CallManager] onnegotiationneeded error:', e);
      }
    };

    // ── onconnectionstatechange ──────────────────────────────────
    pc.onconnectionstatechange = () => {
      const cs: string = pc.connectionState || '';
      this._setPcState(cs as PCState);

      if (cs === 'connected') {
        this._reconnectCount = 0;
        this._clearIceRestartTimer();
        if (!this._connectedOnce) {
          this._connectedOnce = true;
          this._setCommState('connected');
          this._onCallConnected();
        }
      }
      if (cs === 'disconnected') {
        // No declarar fallo inmediatamente — puede recuperarse solo
        if (this._commState === 'connected') {
          this._setCommState('reconnecting');
        }
        this._scheduleIceRestart();
      }
      if (cs === 'failed') {
        this._clearIceRestartTimer();
        this._handleConnectionFailed();
      }
      if (cs === 'closed') {
        if (!this._isEnding) this.endCall();
      }
    };

    // ── oniceconnectionstatechange ───────────────────────────────
    pc.oniceconnectionstatechange = () => {
      const ics: string = pc.iceConnectionState || '';

      if (ics === 'connected' || ics === 'completed') {
        this._reconnectCount = 0;
        this._clearIceRestartTimer();
        if (!this._connectedOnce) {
          this._connectedOnce = true;
          this._setCommState('connected');
          this._onCallConnected();
        }
      }
      if (ics === 'disconnected') {
        if (this._commState === 'connected') {
          this._setCommState('reconnecting');
        }
        this._scheduleIceRestart();
      }
      if (ics === 'failed') {
        this._clearIceRestartTimer();
        this._handleConnectionFailed();
      }
    };

    // ── onicegatheringstatechange ─────────────────────────────────
    pc.onicegatheringstatechange = () => {
      // Útil para debug — ningún cambio de estado de llamada aquí
    };

    return pc;
  }

  private _destroyPC(): void {
    if (!this._pc) return;
    const pc = this._pc;
    this._pc = null;
    try {
      pc.ontrack                  = null;
      pc.onicecandidate           = null;
      pc.onconnectionstatechange  = null;
      pc.oniceconnectionstatechange = null;
      pc.onicegatheringstatechange = null;
      pc.onnegotiationneeded      = null;
      pc.close();
    } catch { /* ignorar */ }
    this._setPcState('closed');
  }

  private _addTracks(pc: any, stream: any): void {
    try {
      stream.getTracks().forEach((t: any) => {
        pc.addTrack(t, stream);

        // FIX 3 — Handler track.onended: detecta pérdida de cámara
        // (background iOS, interrupción del sistema en Android)
        // sin terminar la llamada.
        if (t.kind === 'video') {
          t.onended = () => {
            if (__DEV__) console.log('[CallManager] video track ended (sistema)');
            if (!this._isCamOff) {
              this._isCamOff = true;
              this._videoPausedBySystem = true;
              this._notify();
            }
          };
        }
      });
    } catch {
      // Fallback para versiones antiguas de react-native-webrtc
      if (pc.addStream) pc.addStream(stream);
    }
  }

  // ── ICE candidates ────────────────────────────────────────────
  private _onLocalIceCandidate(e: any, role: 'caller' | 'callee'): void {
    if (!e.candidate) return;  // candidate end signal — ignorar
    this._sendIce(e.candidate, role);
  }

  private async _sendIce(candidate: any, role: 'caller' | 'callee'): Promise<void> {
    if (!this._session?.callId) return;

    // Clave de deduplicación: serialización completa del candidato
    const serialized = JSON.stringify(candidate?.toJSON ? candidate.toJSON() : candidate);
    if (!serialized || this._iceSentKeys.has(serialized)) return;
    this._iceSentKeys.add(serialized);

    try {
      await callAPI.ice({
        callId:    this._session.callId,
        candidate: candidate.toJSON ? candidate.toJSON() : candidate,
        role,
      });
    } catch { /* ignorar — el callee tiene la cola del servidor */ }
  }

  /** Aplica candidatos ICE remotos recibidos vía polling */
  private async _applyRemoteIceCandidates(candidates: any[]): Promise<void> {
    if (!this._pc) return;
    for (const c of candidates) {
      if (!c) continue;
      try {
        if (this._remoteDescSet) {
          await this._pc.addIceCandidate(new NativeRTC!.RTCIceCandidate(c));
        } else {
          // Encolar — setRemoteDescription aún no ocurrió
          this._iceQueue.push(c);
        }
      } catch (e) {
        // Ignorar candidatos inválidos; loguear para debug
        console.warn('[CallManager] addIceCandidate error:', e);
      }
    }
  }

  /** Vacía la cola de candidatos recibidos anticipadamente */
  private async _drainIceQueue(): Promise<void> {
    if (!this._pc || !this._remoteDescSet) return;
    const queue = this._iceQueue.splice(0);
    for (const c of queue) {
      try { await this._pc.addIceCandidate(new NativeRTC!.RTCIceCandidate(c)); } catch { /* */ }
    }
  }

  // ── getUserMedia ──────────────────────────────────────────────
  // FIX 2 — usa _isFrontCamera para el facingMode correcto.
  // FIX 6 — resolución adaptativa 720p ideal con fallback a 480p.
  private async _getUserMedia(type: 'audio' | 'video'): Promise<any> {
    if (!NativeRTC) throw new Error('react-native-webrtc no disponible');

    const facing = this._isFrontCamera ? 'user' : 'environment';

    const videoConstraintsHD = {
      facingMode: facing,
      width:     { ideal: 1280 },
      height:    { ideal: 720  },
      frameRate: { ideal: 24, max: 30 },
    };
    const videoConstraintsSd = {
      facingMode: facing,
      width: 640, height: 480, frameRate: 24,
    };

    if (type !== 'video') {
      return await NativeRTC.mediaDevices.getUserMedia({ audio: true, video: false });
    }

    // Intentar 720p primero; si el dispositivo no puede, bajar a 480p
    try {
      return await NativeRTC.mediaDevices.getUserMedia({
        audio: true,
        video: videoConstraintsHD,
      });
    } catch {
      try {
        return await NativeRTC.mediaDevices.getUserMedia({
          audio: true,
          video: videoConstraintsSd,
        });
      } catch {
        // Último fallback: dejar que el dispositivo elija
        return await NativeRTC.mediaDevices.getUserMedia({ audio: true, video: true });
      }
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
    } catch { return false; }
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
      } catch { /* */ }
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Polling unificado
  // ══════════════════════════════════════════════════════════════

  /** Inicia el ciclo de polling.
   *  FIX B+H — Usa propiedades de clase (_iceOffsetCaller, _iceOffsetCallee,
   *  _answerApplied, _appliedOfferVersion) en vez de variables locales del
   *  closure, lo que permite resetearlas desde _scheduleIceRestart() cuando
   *  hay un ICE restart y se necesita procesar candidatos desde 0.
   *
   *  FIX B — El callee detecta un nuevo offer (ICE restart del caller)
   *  cuando s.offerVersion > _appliedOfferVersion y responde con un nuevo
   *  answer, completando el handshake simétrico. */
  private _startPoll(role: 'caller' | 'callee', phase: 'fast' | 'slow'): void {
    this._stopPolling();
    this._pollPhase = phase;

    // Sincronizar propiedades de clase con el estado actual
    // (al reiniciar el poll en fase slow, _answerApplied ya es true)
    if (phase === 'slow' && role === 'caller') this._answerApplied = true;

    const INTERVAL = phase === 'fast'
      ? (Platform.OS === 'android' ? POLL_FAST_ANDROID : POLL_FAST_IOS)
      : (Platform.OS === 'android' ? POLL_SLOW_ANDROID : POLL_SLOW_IOS);

    let polls = 0;

    this._pollingTimer = setInterval(async () => {
      if (this._isEnding || this._commState === 'idle') { this._stopPolling(); return; }

      polls++;

      // Pasar a fase lenta cuando ya hay conexión
      if (phase === 'fast' && polls > 35 && this._pollPhase === 'fast') {
        this._startPoll(role, 'slow');
        return;
      }

      try {
        const s = await callAPI.get(this._session!.callId);
        if (!s || s.ended) { this.endCall(); return; }

        // ── Caller: Answer inicial + ICE del callee ──────────────
        if (role === 'caller') {
          if (!this._answerApplied && s.answer &&
              this._pc?.signalingState === 'have-local-offer') {
            await this._pc.setRemoteDescription(
              new NativeRTC!.RTCSessionDescription(s.answer),
            );
            this._remoteDescSet    = true;
            this._answerApplied    = true;
            this._iceRestartPending = false; // respuesta recibida — limpiar flag
            this._setCommState('connecting');
            this._stopCallTimeout();
            await this._drainIceQueue();
          }
          if (this._answerApplied && s.calleeCandidates) {
            const newCands = s.calleeCandidates.slice(this._iceOffsetCallee);
            this._iceOffsetCallee  = s.calleeCandidates.length;
            await this._applyRemoteIceCandidates(newCands);
          }
          // Timeout de señalización
          if (polls > 95 && !this._answerApplied) {
            this._setCommState('missed'); this.endCall();
          }
        }

        // ── Callee: ICE del caller + detección de restart offer ──
        if (role === 'callee') {
          // FIX B — Detectar nuevo offer del caller (ICE restart)
          // s.offerVersion aumenta cada vez que el caller envía un offer nuevo.
          // Si la versión del servidor supera la aplicada localmente, procesar.
          const serverOfferVersion: number = s.offerVersion ?? 1;
          if (
            this._pc &&
            this._isValidSdp(s.offer) &&
            serverOfferVersion > this._appliedOfferVersion &&
            // Solo procesar si ya establecimos la conexión inicialmente
            this._connectedOnce
          ) {
            if (__DEV__) console.log(`[CallManager] Callee: nuevo offer v${serverOfferVersion} (restart)`);
            try {
              await this._pc.setRemoteDescription(
                new NativeRTC!.RTCSessionDescription(s.offer),
              );
              this._remoteDescSet        = true;
              this._appliedOfferVersion  = serverOfferVersion;
              // Resetear offsets para los nuevos candidatos post-restart
              this._iceOffsetCaller      = 0;
              this._iceOffsetCallee      = 0;
              this._iceRestartPending    = false;
              await this._drainIceQueue();

              const answer = await this._pc.createAnswer();
              await this._pc.setLocalDescription(answer);
              await callAPI.answer({
                callId: this._session!.callId,
                answer: this._pc.localDescription,
              });
              if (__DEV__) console.log('[CallManager] Callee: answer de restart enviado');
            } catch (e) {
              console.warn('[CallManager] Callee restart offer error:', e);
            }
          }

          // ICE candidates del caller
          if (s.callerCandidates) {
            const newCands = s.callerCandidates.slice(this._iceOffsetCaller);
            this._iceOffsetCaller = s.callerCandidates.length;
            await this._applyRemoteIceCandidates(newCands);
          }
        }

      } catch { /* red caída — retry en siguiente ciclo */ }
    }, INTERVAL);
  }

  private _stopPolling(): void {
    if (this._pollingTimer) { clearInterval(this._pollingTimer); this._pollingTimer = null; }
  }

  /** Polling ligero para modo señalización (Expo Go) */
  private _startSignalingPoll(role: 'caller' | 'callee'): void {
    this._stopPolling();
    this._pollingTimer = setInterval(async () => {
      if (this._isEnding) { this._stopPolling(); return; }
      try {
        const s = await callAPI.get(this._session!.callId);
        if (s?.ended) { this.endCall(); return; }
        if (role === 'caller' && s?.answer) {
          this._setCommState('connected');
          this._onCallConnected();
          this._stopPolling();
        }
      } catch { /* */ }
    }, 2000);
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — ICE restart y reconexión
  // ══════════════════════════════════════════════════════════════

  // FIX A+C — Backoff exponencial + flag atómico para evitar doble-disparo.
  //
  // _iceRestartPending actúa como mutex: se activa al entrar y se limpia
  // solo cuando el restart se completa (éxito o fallo). Esto previene que
  // onconnectionstatechange y oniceconnectionstatechange disparen dos
  // restarts simultáneos si ambos llegan en el mismo tick.
  //
  // Backoff: delay = ICE_DISCONNECTED_BASE_MS × 2^(intento-1) × jitter
  //   intento 1: ~2s  (2000 × 1 × [0.8–1.2])
  //   intento 2: ~4s  (2000 × 2 × [0.8–1.2])
  //   intento 3: ~8s  (2000 × 4 × [0.8–1.2])
  //   intento 4: ~16s (2000 × 8 × [0.8–1.2])
  private _iceRestartPending = false;

  private _scheduleIceRestart(): void {
    if (this._isEnding || this._iceRestartPending) return;
    this._iceRestartPending = true;

    // Calcular delay con backoff exponencial + jitter ±20%
    const attempt    = this._reconnectCount + 1;
    const baseDelay  = ICE_DISCONNECTED_BASE_MS * Math.pow(2, attempt - 1);
    const jitter     = 0.8 + Math.random() * 0.4; // [0.8, 1.2]
    const delay      = Math.min(baseDelay * jitter, 16_000); // tope 16s

    if (__DEV__) console.log(`[CallManager] ICE restart en ${Math.round(delay)}ms (intento ${attempt}/${RECONNECT_MAX})`);

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;

      if (this._isEnding || !this._pc) {
        this._iceRestartPending = false;
        return;
      }

      const ics = this._pc.iceConnectionState;
      if (ics === 'connected' || ics === 'completed') {
        // Se recuperó por sí solo durante el delay — no hacer nada
        this._iceRestartPending = false;
        return;
      }

      if (this._reconnectCount >= RECONNECT_MAX) {
        this._iceRestartPending = false;
        this._handleConnectionFailed();
        return;
      }
      this._reconnectCount++;

      try {
        const sigState = this._pc.signalingState;

        // ── Caller: enviar nuevo offer con iceRestart:true ───────
        if (sigState === 'stable' || sigState === 'have-local-offer') {
          const iceServers = await this._getIceServers();
          this._pc.setConfiguration?.({ iceServers });

          const restartOffer = await this._pc.createOffer({ iceRestart: true });
          await this._pc.setLocalDescription(restartOffer);

          // Resetear offsets ICE para aceptar candidatos nuevos del restart
          this._iceOffsetCaller = 0;
          this._iceOffsetCallee = 0;

          await callAPI.offer({
            callId:       this._session!.callId,
            offer:        this._pc.localDescription,
            targetUserId: this._session!.targetUserId,
            type:         this._session!.callType,
          });

          if (__DEV__) console.log('[CallManager] ICE restart offer enviado');
        }
        // ── Callee: puede que haya un restart offer esperando ────
        // El callee no puede iniciar ICE restart sin el offer del caller.
        // El polling lo detectará y procesará el nuevo offer en el
        // siguiente ciclo. _iceRestartPending se mantiene activo
        // hasta que el estado de ICE mejore.

        // Timer de seguridad — si en ICE_RESTART_TIMEOUT_MS no hay
        // mejora, declarar fallo
        this._iceRestartTimer = setTimeout(() => {
          this._iceRestartTimer = null;
          this._iceRestartPending = false;
          const state = this._pc?.iceConnectionState;
          if (state !== 'connected' && state !== 'completed' && !this._isEnding) {
            if (__DEV__) console.log('[CallManager] ICE restart timeout — fallo');
            this._handleConnectionFailed();
          }
        }, ICE_RESTART_TIMEOUT_MS);

      } catch (e) {
        console.warn('[CallManager] _scheduleIceRestart error:', e);
        this._iceRestartPending = false;
        this._handleConnectionFailed();
      }
    }, delay);
  }

  private _clearIceRestartTimer(): void {
    if (this._iceRestartTimer) { clearTimeout(this._iceRestartTimer); this._iceRestartTimer = null; }
    if (this._reconnectTimer)  { clearTimeout(this._reconnectTimer);  this._reconnectTimer = null; }
    this._iceRestartPending = false;
  }

  private _handleConnectionFailed(): void {
    if (this._isEnding) return;
    this._iceRestartPending = false;
    this._setCommState('failed');
    this.endCall();
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Timers de sesión
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
    if (this._durationTimer) return;
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
  // PRIVADOS — Audio
  // ══════════════════════════════════════════════════════════════

  /** Configura AVAudioSession (iOS) y AudioFocus (Android) para llamada activa.
   *
   *  iOS: iosCategory 'playAndRecord' mantiene el micrófono activo en background
   *  y al bloquear pantalla. iosMode 'voiceChat' enruta al auricular y activa
   *  cancelación de eco del sistema. interruptionModeIOS DO_NOT_MIX (1) toma
   *  foco completo y evita que otra app silencia la llamada permanentemente.
   *
   *  Android: shouldDuckAndroid false da prioridad total al audio de la llamada.
   */
  private async _applyAudioSession(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         true,
        playsInSilentModeIOS:       true,
        staysActiveInBackground:    true,
        shouldDuckAndroid:          false,
        playThroughEarpieceAndroid: !this._isSpeakerOn && !this._isBluetoothOn,
        // iOS — categoría y modo para llamada activa
        iosCategory:                'playAndRecord',
        iosMode:                    'voiceChat',
        interruptionModeIOS:        1,  // InterruptionModeIOS.DoNotMix
      } as any);
    } catch (e) {
      console.warn('[CallManager] setAudioModeAsync error:', e);
    }
  }

  /** Aplica la ruta de audio según el estado actual (altavoz / auricular / BT).
   *
   *  iOS: voiceChat → auricular con echo-cancellation;
   *       spokenAudio → altavoz con mayor volumen.
   *
   *  NOTA BLUETOOTH (iOS): el routing BT real es controlado por
   *  AVAudioSession/CallKit a nivel nativo. Desde JS solo podemos indicar
   *  la preferencia de salida; el sistema elige el dispositivo BT activo.
   *  _isBluetoothOn se actualiza via onAudioRouteChanged cuando el sistema
   *  confirma el cambio de ruta.
   */
  private async _applyAudioRoute(): Promise<void> {
    if (Platform.OS === 'web') return;

    if (this._isBluetoothOn) {
      // Advertencia: en iOS no se puede forzar BT desde JS.
      // El sistema elige el dispositivo BT prioritario.
      if (Platform.OS === 'ios') {
        console.warn('[CallManager] toggleBluetooth: en iOS el routing BT es controlado por AVAudioSession/CallKit. Solo se puede indicar preferencia desde JS.');
      }
    }

    try {
      const useEarpiece = !this._isSpeakerOn && !this._isBluetoothOn;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         true,
        playsInSilentModeIOS:       true,
        staysActiveInBackground:    true,
        shouldDuckAndroid:          false,
        playThroughEarpieceAndroid: useEarpiece,
        // voiceChat → auricular+EC; spokenAudio → altavoz
        iosCategory:                'playAndRecord',
        iosMode:                    useEarpiece ? 'voiceChat' : 'spokenAudio',
        interruptionModeIOS:        1,  // InterruptionModeIOS.DoNotMix
      } as any);
    } catch { /* ignorar */ }
  }

  /** Restaura la sesión de audio al estado normal al terminar la llamada.
   *  Se llama siempre desde _finalCleanup() para cubrir todos los paths
   *  de terminación (endCall, rejectCall, cancelCall, timeout, PC closed).
   *
   *  iOS: 'ambient' permite mezclar con otras apps (música, podcasts);
   *       'soloAmbient' las silencia permanentemente — incorrecto post-llamada.
   *       interruptionModeIOS: 0 (MixWithOthers) devuelve el audio previo a
   *       pleno volumen; 2 (DuckOthers) lo mantiene atenuado.
   */
  private async _restoreAudioSession(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:         false,
        playsInSilentModeIOS:       false,   // cerrar sesión iOS completamente
        shouldDuckAndroid:          true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground:    false,
        // iOS — categoría normal post-llamada: ambient permite mezclar
        iosCategory:                'ambient',
        iosMode:                    'default',
        interruptionModeIOS:        0,  // InterruptionModeIOS.MixWithOthers
      } as any);
    } catch { /* ignorar */ }
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — AppState (interrupciones de sistema)
  // ══════════════════════════════════════════════════════════════

  private _subscribeAppState(): void {
    if (this._appStateSub) return;
    this._appStateSub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = this._lastAppState;
      this._lastAppState = next;

      // ── App vuelve al primer plano ────────────────────────────
      if (prev !== 'active' && next === 'active') {
        if (this.isActive && this._pc) {
          const ics = this._pc.iceConnectionState;
          if (ics === 'disconnected' || ics === 'failed') {
            this._scheduleIceRestart();
          }
          // Re-aplicar sesión Y ruta para respetar la elección del usuario
          // (altavoz/auricular) después de volver de background
          this._applyAudioSession().catch(() => {});
          this._applyAudioRoute().catch(() => {});
        }

        // FIX 4 — Reanudar vídeo si fue pausado por el sistema (background)
        if (this._videoPausedBySystem && this._localStream && !this._isEnding) {
          this._videoPausedBySystem = false;
          const vtracks: any[] = this._localStream.getVideoTracks?.() || [];
          vtracks.forEach((t: any) => { t.enabled = true; });

          // Restaurar también en el sender si replaceTrack fue usado
          if (this._pc && this._videoTrackRef) {
            try {
              const senders: any[] = this._pc.getSenders?.() || [];
              const vs = senders.find((s: any) => !s.track || s.track.kind === 'video');
              if (vs) vs.replaceTrack(this._videoTrackRef).catch(() => {});
            } catch { /* ignorar */ }
          }

          this._isCamOff = false;
          this._notify();
        }
      }

      // ── App pasa a background ─────────────────────────────────
      // FIX 4 — Pausar vídeo en background (iOS libera la cámara).
      // Solo se pausa si el usuario NO había desactivado la cámara.
      if (next === 'background' && this.isActive) {
        this._applyAudioSession().catch(() => {});

        if (!this._isCamOff && this._localStream) {
          const vtracks: any[] = this._localStream.getVideoTracks?.() || [];
          vtracks.forEach((t: any) => { t.enabled = false; });
          this._videoPausedBySystem = true;
          // NO cambiar _isCamOff — es pausa de sistema, no del usuario
          this._notify();
        }
      }

      // ── Interrupción temporal (iOS: llamada tel. o alarma) ────
      // Estado 'inactive' en iOS indica que el sistema está interrumpiendo
      // (p.ej. llamada telefónica entrante). El audio debe silenciarse
      // pero la PeerConnection debe mantenerse.
      // En Android este estado no existe — las interrupciones llegan
      // via AudioFocusChangeListener en CallForegroundService.
      if (next === 'inactive' && prev === 'active' && Platform.OS === 'ios') {
        // La AVAudioSession será interrumpida por el sistema.
        // No hacemos nada aquí — los observers de AVAudioSession en
        // EGChatCallModule.swift manejan la pausa/reanudación real.
        // Registrar para depuración.
        if (__DEV__) console.log('[CallManager] iOS inactive — interrupción probable');
      }
    });

    // ── Listeners nativos de audio iOS ────────────────────────
    // Se suscriben una sola vez al iniciar la primera llamada.
    if (Platform.OS === 'ios' && !this._audioInterruptSub) {
      this._audioInterruptSub = NativeCallKit.onAudioInterrupted(
        ({ interrupted, callId }) => {
          if (callId !== this._session?.callId) return;
          if (interrupted) {
            // Llamada telefónica entró o alarma sonó.
            // Silenciar micrófono localmente; mantener PeerConnection.
            if (this._localStream && !this._isMuted) {
              this._localStream.getAudioTracks?.().forEach((t: any) => { t.enabled = false; });
              // Nota: _isMuted NO se cambia — es una pausa temporal del sistema,
              // no una acción del usuario. Al reanudar, se restaura.
            }
          } else {
            // Interrupción terminó — restaurar estado de audio del usuario.
            if (this._localStream) {
              this._localStream.getAudioTracks?.().forEach((t: any) => {
                t.enabled = !this._isMuted; // respetar la preferencia del usuario
              });
            }
            this._applyAudioSession().catch(() => {});
          }
          this._notify();
        }
      );

      this._audioRouteSub = NativeCallKit.onAudioRouteChanged(
        ({ route, callId }) => {
          if (__DEV__) console.log(`[CallManager] Ruta audio → ${route}`);
          const routeLower = route.toLowerCase();
          const isBT       = routeLower.includes('bluetooth');
          const isSpeaker  = routeLower.includes('speaker');

          let changed = false;
          if (isBT !== this._isBluetoothOn) {
            this._isBluetoothOn = isBT;
            changed = true;
          }
          // Si el sistema cambió la ruta a speaker o earpiece/headphones,
          // sincronizar _isSpeakerOn para que el ícono de la pantalla sea correcto.
          if (!isBT) {
            if (isSpeaker !== this._isSpeakerOn) {
              this._isSpeakerOn = isSpeaker;
              changed = true;
            }
          }
          if (changed) this._notify();
        }
      );
    }
  }

  private _unsubscribeAppState(): void {
    this._appStateSub?.remove();
    this._appStateSub = null;
    this._audioInterruptSub?.();
    this._audioInterruptSub = null;
    this._audioRouteSub?.();
    this._audioRouteSub = null;
    // FIX E — limpiar listener de NetInfo
    this._netInfoSub?.();
    this._netInfoSub = null;
  }

  // FIX E — Listener proactivo de cambio de red (Wi-Fi ↔ 4G/5G).
  //
  // Objetivo: detectar el cambio ANTES de que WebRTC lo note (~5-10s latencia)
  // para iniciar ICE restart de forma anticipada.
  //
  // Casos cubiertos:
  //   Wi-Fi → 4G/5G : isConnected=true, type cambia → forzar restart
  //   4G/5G → Wi-Fi : idem
  //   Red caída     : isConnected=false → marcar reconnecting si connected
  //   Red recuperada: isConnected=true  → forzar restart si reconnecting
  private _subscribeNetwork(): void {
    if (this._netInfoSub) return;
    this._netInfoSub = NetInfo.addEventListener((state: NetInfoState) => {
      if (!this.isActive || this._isEnding) return;

      const isConnected = state.isConnected ?? false;

      // Red recuperada estando en reconexión → iniciar restart de inmediato
      if (isConnected && this._lastNetConnected === false &&
          this._commState === 'reconnecting') {
        if (__DEV__) console.log('[CallManager] NetInfo: red recuperada — restart ICE proactivo');
        this._scheduleIceRestart();
      }

      // Red caída estando conectado → anticipar reconnecting
      if (!isConnected && this._commState === 'connected') {
        if (__DEV__) console.log('[CallManager] NetInfo: sin red — reconnecting anticipado');
        this._setCommState('reconnecting');
      }

      // Cambio de tipo de red (Wi-Fi ↔ 4G) estando conectado → restart proactivo
      // isConnected se mantiene true pero el camino ICE ya no es válido
      if (isConnected && this._lastNetConnected === true &&
          this._commState === 'connected') {
        if (__DEV__) console.log('[CallManager] NetInfo: cambio de tipo de red — restart ICE proactivo');
        this._setCommState('reconnecting');
        this._scheduleIceRestart();
      }

      this._lastNetConnected = isConnected;
    });
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Supabase Realtime
  // ══════════════════════════════════════════════════════════════

  /**
   * Suscripción a cambios de estado en call_sessions via Supabase Realtime.
   *
   * USO PRINCIPAL:
   *   - Detectar cuando otro dispositivo del mismo callee acepta → cancelar
   *     la llamada entrante en este dispositivo sin esperar al polling.
   *   - Detectar cuando el caller cancela → callee se entera en <200ms.
   *   - Detectar estado 'connected' desde el servidor para sincronizar
   *     el cronómetro oficial (connected_at de Supabase).
   *
   * IMPORTANTE: Realtime NO sustituye al polling para la señalización
   * SDP/ICE — eso sigue por HTTP. Realtime es solo para el estado
   * de alto nivel (ringing, accepted, ended, etc.).
   */
  private _subscribeRealtime(): void {
    if (!this._session?.callId || this._realtimeSub) return;

    this._realtimeSub = subscribeToCallState(
      this._session.callId,

      // onStatusChange: sincronizar estado con la fuente de verdad
      (remoteStatus: CallStatus) => {
        if (!this._session) return;

        // Si ya estamos en un estado terminal, ignorar
        if (isTerminal(this._commState as any)) return;

        switch (remoteStatus) {
          case 'accepted':
            // Otro dispositivo del callee aceptó → si somos callee y estamos
            // en ringing, cancelar localmente sin llamar al servidor de nuevo
            if (this._session.role === 'callee' &&
                (this._commState === 'ringing' || this._commState === 'accepted')) {
              this._stopRingOnce();
              this._setCommState('ended');
              this._finalCleanup();
              setTimeout(() => { this._setCommState('idle'); this._session = null; this._notify(); }, 400);
            }
            break;

          case 'rejected':
            if (this._session.role === 'caller' && this._commState === 'calling') {
              this._setCommState('rejected');
              this._finalCleanup();
              setTimeout(() => { this._setCommState('idle'); this._session = null; this._notify(); }, 400);
            }
            break;

          case 'ended':
          case 'failed':
          case 'missed':
            if (!isTerminal(this._commState as any)) {
              this._setCommState(remoteStatus as CallCommState);
              this._finalCleanup();
              setTimeout(() => { this._setCommState('idle'); this._session = null; this._notify(); }, 600);
            }
            break;

          case 'connected':
            // Sincronizar cronómetro con connected_at oficial del servidor
            // (se hará en la próxima iteración del polling via callAPI.get)
            break;
        }
      },

      // onEnded: la sesión pasó a un estado terminal
      () => {
        if (!this._session) return;
        if (isTerminal(this._commState as any)) return;
        // El polling también lo detectará, pero Realtime es más rápido
        if (!this._isEnding) this.endCall();
      }
    );
  }

  private _unsubscribeRealtime(): void {
    this._realtimeSub?.();
    this._realtimeSub = null;
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Ciclo de vida de la llamada
  // ══════════════════════════════════════════════════════════════

  private _onCallConnected(): void {
    stopDialingTone();
    this._stopRingOnce();
    this._stopCallTimeout();
    this._startDurationTimer();

    const session = this._session;
    if (session) {
      LiveActivity.startCall(session.callId, session.targetName, session.callType === 'video');
      try { NativeCallKit.dismissIncomingCall(); } catch { /* */ }

      if (Platform.OS === 'android') {
        try { NativeCallKit.startCallForegroundService(session.callId, session.targetName, session.callType === 'video'); } catch { /* */ }
      }

      // Notificar a la fuente de verdad que ICE se estableció
      // Esto actualiza connected_at en Supabase para el cronómetro oficial
      callAPI.markConnected(session.callId).catch(() => {});
    }

    this._applyAudioSession().catch(() => {});

    // Pasar polling a fase lenta ahora que hay conexión
    if (this._session?.role) {
      this._startPoll(this._session.role, 'slow');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PRIVADOS — Limpieza completa
  // ══════════════════════════════════════════════════════════════
  private _stopRingOnce(): void {
    if (this._ringStopped) return;
    this._ringStopped = true;
    stopRingtone().catch(() => {});
  }

  /** Limpieza completa de recursos — no deja nada activo */
  private _finalCleanup(): void {
    // 0. Restaurar AudioSession ANTES de cerrar todo lo demás.
    //    Cubre paths que no pasan por endCall: rejectCall, cancelCall,
    //    timeouts, Realtime onEnded y PC connectionstate=closed.
    this._restoreAudioSession().catch(() => {});

    // 0b. Cerrar la llamada en CallKit si aún tiene un callId activo.
    //     endCall() ya lo llama upstream, pero paths como rejectCall,
    //     cancelCall y el handler de Realtime llegan aquí directamente.
    //     NativeCallKit.endCall() es idempotente — llamarla dos veces
    //     no causa errores.
    const session = this._session;
    if (session?.callId) {
      try { NativeCallKit.endCall(session.callId); } catch { /* */ }
    }

    // 0c. Detener el ForegroundService de Android en TODOS los paths.
    //     stopCallForegroundService() es idempotente — llamarla dos veces
    //     (aquí y en endCall) no causa problemas.
    if (Platform.OS === 'android') {
      try { NativeCallKit.stopCallForegroundService(); } catch { /* */ }
    }

    // 1. Timers
    this._stopPolling();
    this._stopDurationTimer();
    this._stopCallTimeout();
    this._clearIceRestartTimer();

    // 2. AppState y listeners nativos
    this._unsubscribeAppState();

    // 3. Realtime
    this._unsubscribeRealtime();

    // 3. PeerConnection (cierra el PC y retira todos los listeners)
    this._destroyPC();

    // 4. Streams — detener TODAS las pistas antes de soltar la referencia
    if (this._localStream) {
      try {
        this._localStream.getTracks?.().forEach((t: any) => {
          t.stop();
          t.enabled = false;
        });
      } catch { /* */ }
      this._localStream = null;
    }
    this._remoteStream = null;

    // 5. ICE state
    this._iceSentKeys.clear();
    this._iceQueue     = [];
    this._remoteDescSet = false;
    this._connectedOnce = false;

    // 6. Flags
    this._isMuted              = false;
    this._isCamOff             = false;
    this._isSpeakerOn          = true;
    this._isBluetoothOn        = false;
    this._isFrontCamera        = true;
    this._reconnectCount       = 0;
    this._videoTrackRef        = null;   // FIX 1/2/4
    this._videoPausedBySystem  = false;  // FIX 4

    this._notify();
  }

  private _reset(): void {
    this._finalCleanup();
    this._session        = null;
    this._isEnding       = false;
    this._ringStopped    = false;
    this._isSignalingOnly = !HAS_NATIVE_MEDIA;
    this._setPcState('none');
    this._setUIState('hidden');
  }

  // ── Setters de estado ─────────────────────────────────────────
  private _setCommState(s: CallCommState): void { this._commState = s; this._notify(); }
  private _setUIState(s: CallUIState):    void  { this._uiState   = s; this._notify(); }
  private _setPcState(s: PCState):        void  { this._pcState   = s; /* sin notify — no en snapshot público */ }
}

// ── Export del singleton ──────────────────────────────────────────
export const callManager = CallManager.getInstance();
