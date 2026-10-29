// WebRTC para llamadas de audio y vídeo en la app Expo nativa.
// react-native-webrtc requiere una compilación EAS; no está disponible en Expo Go.
import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Audio } from 'expo-av';
import { getToken } from '../api';
import { startRingtone, stopRingtone } from './useSounds';

const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://egchat-api-xlxj.onrender.com').trim().replace(/\/+$/, '').replace(/\/api$/, '');
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'], username: 'openrelayproject', credential: 'openrelayproject' },
];

let RTC: any = null;
try {
  if (Platform.OS !== 'web') RTC = require('react-native-webrtc');
} catch (error) {
  console.warn('[Call] react-native-webrtc no está disponible. Instala la build nativa de EGCHAT, no Expo Go.', error);
}

export const RTCView = (RTC?.RTCView || View) as React.ComponentType<any>;
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export interface RTCIceServer { urls: string | string[]; username?: string; credential?: string }

async function sigFetch(path: string, method = 'GET', body?: object) {
  const token = await getToken();
  const response = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`Error de señalización (${response.status})`);
  return response.json();
}

async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const data = await sigFetch('/turn-token');
    if (Array.isArray(data.iceServers) && data.iceServers.length) return [...data.iceServers, ...STUN_SERVERS.slice(0, 2)];
  } catch (error) {
    console.warn('[Call] TURN no disponible; se intenta STUN/TURN de respaldo.', error);
  }
  return STUN_SERVERS;
}

async function configureAudio() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) { console.warn('[Call] No se pudo configurar el audio:', error); }
}

export function useWebRTC() {
  const pcRef = useRef<any>(null);
  const localRef = useRef<any>(null);
  const remoteRef = useRef<any>(null);
  const callIdRef = useRef('');
  const roleRef = useRef<'caller' | 'callee'>('caller');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);
  const endedRef = useRef(false);
  const connectedRef = useRef(false);
  const answerAppliedRef = useRef(false);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signalingReadyRef = useRef(false);
  const pendingIceRef = useRef<any[]>([]);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) { clearTimeout(connectTimeoutRef.current); connectTimeoutRef.current = null; }
  }, []);

  /** Si el answer llega (o lo enviamos) y la conexión ICE no se completa,
   *  la llamada se quedaba "Llamando.../Conectando..." para siempre.
   *  A los 30s se cierra en vez de dejar al otro lado esperando. */
  const armConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) return;
    connectTimeoutRef.current = setTimeout(() => {
      connectTimeoutRef.current = null;
      if (endedRef.current || connectedRef.current) return;
      console.warn('[Call] Sin conexión ICE 30s después del answer — terminando llamada');
      endedRef.current = true;
      setCallState('ended');
    }, 30_000);
  }, []);

  const cleanupMedia = useCallback(() => {
    stopPolling();
    clearConnectTimeout();
    connectedRef.current = false;
    const pc = pcRef.current;
    pcRef.current = null;
    try { pc?.close(); } catch {}
    for (const stream of [localRef.current, remoteRef.current]) {
      stream?.getTracks?.().forEach((track: any) => { try { track.stop(); } catch {} });
    }
    localRef.current = null;
    remoteRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    stopRingtone().catch(() => {});
    Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, staysActiveInBackground: false }).catch(() => {});
  }, [stopPolling, clearConnectTimeout]);

  const createPeer = useCallback(async () => {
    if (!RTC) throw new Error('Las llamadas necesitan la versión instalada de EGCHAT con soporte WebRTC. Actualiza la app para continuar.');
    await configureAudio();
    const pc = new RTC.RTCPeerConnection({ iceServers: await getIceServers(), iceCandidatePoolSize: 10 });
    pcRef.current = pc;
    const stream = new RTC.MediaStream();
    remoteRef.current = stream;
    pc.ontrack = (event: any) => {
      const incoming = event.streams?.[0];
      if (incoming) {
        remoteRef.current = incoming;
        setRemoteStream(incoming);
      } else if (event.track && !stream.getTracks().some((track: any) => track.id === event.track.id)) {
        stream.addTrack(event.track);
        setRemoteStream(stream);
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        connectedRef.current = true;
        clearConnectTimeout();
        setCallState('connected');
      }
      if (pc.connectionState === 'failed' && !endedRef.current) {
        endedRef.current = true;
        setCallState('ended');
      }
    };
    // Algunos dispositivos reportan la conexión por ICE antes que por
    // connectionState; sin esto la UI podía quedarse en "Llamando...".
    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      if ((iceState === 'connected' || iceState === 'completed') && !connectedRef.current) {
        connectedRef.current = true;
        clearConnectTimeout();
        setCallState('connected');
      }
      if (iceState === 'failed' && !endedRef.current) {
        endedRef.current = true;
        setCallState('ended');
      }
    };
    pc.onicecandidate = (event: any) => {
      if (event.candidate && callIdRef.current) {
        const candidate = event.candidate.toJSON?.() || event.candidate;
        if (!signalingReadyRef.current) pendingIceRef.current.push(candidate);
        else sigFetch('/call/ice', 'POST', { callId: callIdRef.current, candidate, role: roleRef.current }).catch(error => console.warn('[Call] No se pudo enviar ICE:', error));
      }
    };
    return pc;
  }, [clearConnectTimeout]);

  const getLocalMedia = useCallback(async (type: 'audio' | 'video') => {
    if (!RTC) throw new Error('Las llamadas necesitan la versión instalada de EGCHAT con soporte WebRTC.');
    const stream = await RTC.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: type === 'video' ? { facingMode: 'user', width: 1280, height: 720, frameRate: 30 } : false,
    });
    localRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (type: 'audio' | 'video', targetUserId: string) => {
    cleanupMedia();
    endedRef.current = false;
    answerAppliedRef.current = false;
    roleRef.current = 'caller';
    signalingReadyRef.current = false;
    pendingIceRef.current = [];
    setCallType(type);
    setCallState('calling');
    callIdRef.current = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      const stream = await getLocalMedia(type);
      const pc = await createPeer();
      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' });
      await pc.setLocalDescription(offer);
      await sigFetch('/call/offer', 'POST', { callId: callIdRef.current, offer: pc.localDescription, targetUserId, type });
      signalingReadyRef.current = true;
      for (const candidate of pendingIceRef.current.splice(0)) {
        await sigFetch('/call/ice', 'POST', { callId: callIdRef.current, candidate, role: 'caller' }).catch(error => console.warn('[Call] No se pudo enviar ICE:', error));
      }
      setCallState('calling');
      let candidateOffset = 0;
      timerRef.current = setInterval(async () => {
        if (busyRef.current || endedRef.current) return;
        busyRef.current = true;
        try {
          const session = await sigFetch(`/call/${callIdRef.current}`);
          if (session.ended || ['ended', 'rejected', 'missed', 'failed'].includes(session.status)) { endedRef.current = true; setCallState('ended'); cleanupMedia(); return; }
          if (session.answer && !answerAppliedRef.current) {
            // Hay answer en el servidor → el callee ya contestó. Vigilar que
            // la conexión ICE se complete para no quedarse "Llamando..." para siempre.
            armConnectTimeout();
            const sigState = pc.signalingState;
            if (sigState === 'have-local-offer' || (sigState === 'stable' && !connectedRef.current)) {
              try {
                await pc.setRemoteDescription(new RTC.RTCSessionDescription(session.answer));
                answerAppliedRef.current = true;
              } catch (error) { console.warn('[Call] No se pudo aplicar el answer:', error); }
            }
          }
          const candidates = session.calleeCandidates || [];
          for (; candidateOffset < candidates.length; candidateOffset++) {
            try { await pc.addIceCandidate(new RTC.RTCIceCandidate(candidates[candidateOffset])); } catch (error) { console.warn('[Call] ICE remoto pendiente:', error); }
          }
          if (!session.answer && Date.now() - Number(callIdRef.current.split('_')[1]) > 90_000) { endedRef.current = true; setCallState('ended'); cleanupMedia(); }
        } catch (error) { console.warn('[Call] Error comprobando la respuesta:', error); }
        finally { busyRef.current = false; }
      }, 1200);
    } catch (error) {
      cleanupMedia();
      setCallState('ended');
      throw error;
    }
  }, [cleanupMedia, createPeer, getLocalMedia, armConnectTimeout]);

  const answerCall = useCallback(async (callId: string, offer: any, type: 'audio' | 'video') => {
    cleanupMedia();
    endedRef.current = false;
    answerAppliedRef.current = false;
    callIdRef.current = callId;
    roleRef.current = 'callee';
    signalingReadyRef.current = true;
    pendingIceRef.current = [];
    setCallType(type);
    try {
      const stream = await getLocalMedia(type);
      const pc = await createPeer();
      stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));
      const callOffer = offer || (await sigFetch(`/call/${callId}`)).offer;
      if (!callOffer) throw new Error('No se encontró la oferta de la llamada.');
      await pc.setRemoteDescription(new RTC.RTCSessionDescription(callOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sigFetch('/call/answer', 'POST', { callId, answer: pc.localDescription });
      // Answer enviado: si ICE no conecta en 30s, cerrar en vez de quedarse colgado.
      armConnectTimeout();
      setCallState('calling');
      let candidateOffset = 0;
      timerRef.current = setInterval(async () => {
        if (busyRef.current || endedRef.current) return;
        busyRef.current = true;
        try {
          const session = await sigFetch(`/call/${callId}`);
          if (session.ended || ['ended', 'rejected', 'missed', 'failed'].includes(session.status)) { endedRef.current = true; setCallState('ended'); cleanupMedia(); return; }
          const candidates = session.callerCandidates || [];
          for (; candidateOffset < candidates.length; candidateOffset++) {
            try { await pc.addIceCandidate(new RTC.RTCIceCandidate(candidates[candidateOffset])); } catch (error) { console.warn('[Call] ICE remoto pendiente:', error); }
          }
        } catch (error) { console.warn('[Call] Error comprobando la llamada:', error); }
        finally { busyRef.current = false; }
      }, 1200);
    } catch (error) {
      cleanupMedia();
      setCallState('ended');
      throw error;
    }
  }, [cleanupMedia, createPeer, getLocalMedia, armConnectTimeout]);

  const endCall = useCallback(async () => {
    endedRef.current = true;
    const id = callIdRef.current;
    if (id) { try { await sigFetch(`/call/${id}`, 'DELETE'); } catch (error) { console.warn('[Call] No se pudo cerrar en el servidor:', error); } }
    cleanupMedia();
    setCallState('idle');
  }, [cleanupMedia]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    localRef.current?.getAudioTracks?.().forEach((track: any) => { track.enabled = !next; });
    setIsMuted(next);
  }, [isMuted]);
  const toggleCamera = useCallback(() => {
    const next = !isCamOff;
    localRef.current?.getVideoTracks?.().forEach((track: any) => { track.enabled = !next; });
    setIsCamOff(next);
  }, [isCamOff]);

  const pollIncoming = useCallback((myUserId: string, onIncoming: (call: any) => void, onCancelled?: () => void) => {
    if (!myUserId) return () => {};
    let lastCallId: string | null = null;
    let stopped = false;
    let busy = false;
    const check = async () => {
      if (busy || stopped) return;
      busy = true;
      try {
        const calls = await sigFetch(`/call/incoming/${encodeURIComponent(myUserId)}`);
        if (Array.isArray(calls) && calls.length) {
          const call = calls[0];
          if (call.callId !== lastCallId) { lastCallId = call.callId; onIncoming(call); }
        } else if (lastCallId) { lastCallId = null; onCancelled?.(); }
      } catch (error) { console.warn('[Call] No se pudieron consultar llamadas entrantes:', error); }
      finally { busy = false; }
    };
    check();
    const id = setInterval(check, 2000);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  useEffect(() => () => { endedRef.current = true; cleanupMedia(); }, [cleanupMedia]);

  return { callState, callType, isMuted, isCamOff, localStream, remoteStream, startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming };
}
