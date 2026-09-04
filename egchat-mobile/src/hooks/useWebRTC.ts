// useWebRTC — Señalización HTTP + media real con react-native-webrtc (EAS / dev client)
import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';
import { callAPI } from '../api';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const TURN_SERVERS = process.env.EXPO_PUBLIC_TURN_SERVERS
  ? JSON.parse(process.env.EXPO_PUBLIC_TURN_SERVERS)
  : [
      // Servidores TURN públicos gratuitos (Metered.ca — 1GB/mes gratis)
      // Para producción seria recomendable un servidor TURN propio
      { urls: 'turn:a.relay.metered.ca:80',      username: 'egchat', credential: 'egchat2025' },
      { urls: 'turn:a.relay.metered.ca:80?transport=tcp', username: 'egchat', credential: 'egchat2025' },
      { urls: 'turn:a.relay.metered.ca:443',     username: 'egchat', credential: 'egchat2025' },
      { urls: 'turns:a.relay.metered.ca:443?transport=tcp', username: 'egchat', credential: 'egchat2025' },
    ];

const ICE_SERVERS = [...STUN_SERVERS, ...TURN_SERVERS];

const MOCK_SDP = { type: 'offer', sdp: 'egchat-expo-go-signaling-only' };
const MOCK_ANSWER = { type: 'answer', sdp: 'egchat-expo-go-answer' };

type NativeWebRTC = {
  RTCPeerConnection: new (config: object) => any;
  RTCIceCandidate: new (init: object) => any;
  RTCSessionDescription: new (init: object) => any;
  mediaDevices: { getUserMedia: (c: object) => Promise<any> };
  RTCView: React.ComponentType<any>;
};

let NativeRTC: NativeWebRTC | null = null;
try {
  if (Platform.OS !== 'web') {
    const mod = require('react-native-webrtc');
    NativeRTC = mod;
    (global as any).nativeCallMedia = true;
  }
} catch {
  NativeRTC = null;
}

export const RTCView = (NativeRTC?.RTCView ?? View) as React.ComponentType<any>;
const HAS_NATIVE_MEDIA = !!NativeRTC && Platform.OS !== 'web';

function mediaConstraints(type: 'audio' | 'video') {
  return type === 'video'
    ? {
        audio: true,
        video: { facingMode: 'user', width: 640, height: 480, frameRate: 24 },
      }
    : { audio: true, video: false };
}

async function ensureMediaPermissions(type: 'audio' | 'video') {
  if (Platform.OS === 'web') return true;
  try {
    const mic = await Audio.getPermissionsAsync();
    if (mic.status !== 'granted') {
      const req = await Audio.requestPermissionsAsync();
      if (req.status !== 'granted') return false;
    }
    if (type === 'video') {
      const camera = await Camera.getCameraPermissionsAsync();
      if (camera.status !== 'granted') {
        const req = await Camera.requestCameraPermissionsAsync();
        if (req.status !== 'granted') return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function useWebRTC() {
  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callIdRef = useRef<string>('');
  const roleRef = useRef<'caller' | 'callee'>('caller');
  const endedRef = useRef(false);
  const iceSentRef = useRef<Set<string>>(new Set());
  const endCallRef = useRef<() => void>(() => {});

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSignalingOnly, setIsSignalingOnly] = useState(!HAS_NATIVE_MEDIA);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const cleanupResources = useCallback(() => {
    stopPolling();
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch { /* ignore */ }
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks?.().forEach((t: any) => t.stop());
      localStreamRef.current = null;
    }
    iceSentRef.current.clear();
    setLocalStream(null);
    setRemoteStream(null);
  }, [stopPolling]);

  const cleanup = useCallback(() => {
    cleanupResources();
    endedRef.current = false;
    setCallState('idle');
  }, [cleanupResources]);

  const sendIce = useCallback(async (candidate: any, role: string) => {
    const key = candidate?.candidate;
    if (!key || iceSentRef.current.has(key) || !callIdRef.current) return;
    iceSentRef.current.add(key);
    try {
      await callAPI.ice({
        callId: callIdRef.current,
        candidate: candidate.toJSON ? candidate.toJSON() : candidate,
        role,
      });
    } catch { /* ignore */ }
  }, []);

  const createPC = useCallback((type: 'audio' | 'video') => {
    if (!NativeRTC) throw new Error('WebRTC no disponible');
    const pc = new NativeRTC.RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.ontrack = (e: any) => {
      const stream = e.streams?.[0] || e.stream;
      if (stream) setRemoteStream(stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallState('connected');
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (!endedRef.current) endCallRef.current();
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        if (!endedRef.current) endCallRef.current();
      }
    };
    return pc;
  }, []);

  const endCallInternal = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    const id = callIdRef.current;
    if (id) {
      try { await callAPI.end(id); } catch { /* ignore */ }
    }
    cleanupResources();
    setCallState('ended');
    setTimeout(() => setCallState('idle'), 600);
  }, [cleanupResources]);

  endCallRef.current = endCallInternal;
  const endCall = endCallInternal;

  const getUserMedia = useCallback(async (type: 'audio' | 'video') => {
    if (!NativeRTC) throw new Error('Media no disponible');
    try {
      return await NativeRTC.mediaDevices.getUserMedia(mediaConstraints(type));
    } catch {
      return await NativeRTC.mediaDevices.getUserMedia(
        type === 'video' ? { audio: true, video: true } : { audio: true, video: false },
      );
    }
  }, []);

  const startCallNative = useCallback(async (
    type: 'audio' | 'video',
    targetUserId: string,
    callId?: string,
  ) => {
    endedRef.current = false;
    cleanupResources();
    setCallType(type);
    setIsSignalingOnly(false);

    const permissionsOk = await ensureMediaPermissions(type);
    if (!permissionsOk) {
      throw new Error(
        type === 'video'
          ? 'Permisos de cámara o micrófono denegados. Actívalos en Ajustes.'
          : 'Permiso de micrófono denegado. Actívalo en Ajustes.'
      );
    }

    const stream = await getUserMedia(type);
    localStreamRef.current = stream;
    setLocalStream(stream);

    const id = callId || `call_${Date.now()}`;
    callIdRef.current = id;
    roleRef.current = 'caller';

    const pc = createPC(type);
    pcRef.current = pc;
    try {
      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));
    } catch {
      if (pc.addStream) pc.addStream(stream);
    }
    pc.onicecandidate = (e: any) => { if (e.candidate) sendIce(e.candidate, 'caller'); };

    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);

    // ── Enviar VoIP push ANTES del offer para despertar al destinatario ──
    // Esto hace que iOS muestre la UI de CallKit incluso con app cerrada.
    // Si falla (red, token no disponible), la llamada sigue igualmente.
    callAPI.sendVoipPush({
      targetUserId,
      callId: id,
      callType: type,
      offer: pc.localDescription,
    }).catch(() => { /* silencioso — el polling se encarga */ });

    await callAPI.offer({ callId: id, offer: pc.localDescription, targetUserId, type });
    setCallState('calling');

    let answerSet = false;
    let calleeIce = 0;
    let polls = 0;

    stopPolling();
    pollingRef.current = setInterval(async () => {
      if (endedRef.current) return;
      polls++;
      try {
        const session = await callAPI.get(id);
        if (session?.ended) { endCallInternal(); return; }
        if (!answerSet && session?.answer && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new NativeRTC!.RTCSessionDescription(session.answer));
          answerSet = true;
        }
        if (answerSet) {
          const cands = session.calleeCandidates || [];
          for (let i = calleeIce; i < cands.length; i++) {
            try { await pc.addIceCandidate(new NativeRTC!.RTCIceCandidate(cands[i])); } catch { /* */ }
          }
          calleeIce = cands.length;
        }
        if (polls > 90 && !answerSet) endCallInternal();
      } catch { /* retry */ }
    }, 1000);
  }, [cleanupResources, createPC, endCallInternal, getUserMedia, sendIce, stopPolling]);

  const answerCallNative = useCallback(async (
    callId: string,
    offer: object,
    type: 'audio' | 'video',
  ) => {
    endedRef.current = false;
    cleanupResources();
    setCallType(type);
    setIsSignalingOnly(false);

    const permissionsOk = await ensureMediaPermissions(type);
    if (!permissionsOk) {
      throw new Error(
        type === 'video'
          ? 'Permisos de cámara o micrófono denegados. Actívalos en Ajustes.'
          : 'Permiso de micrófono denegado. Actívalo en Ajustes.'
      );
    }

    const stream = await getUserMedia(type);
    localStreamRef.current = stream;
    setLocalStream(stream);
    callIdRef.current = callId;
    roleRef.current = 'callee';

    const pc = createPC(type);
    pcRef.current = pc;
    try {
      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));
    } catch {
      if (pc.addStream) pc.addStream(stream);
    }
    pc.onicecandidate = (e: any) => { if (e.candidate) sendIce(e.candidate, 'callee'); };

    await pc.setRemoteDescription(new NativeRTC!.RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await callAPI.answer({ callId, answer: pc.localDescription });
    setCallState('ringing');

    let callerIce = 0;
    stopPolling();
    pollingRef.current = setInterval(async () => {
      if (endedRef.current) return;
      try {
        const session = await callAPI.get(callId);
        if (session?.ended) { endCallInternal(); return; }
        const cands = session.callerCandidates || [];
        for (let i = callerIce; i < cands.length; i++) {
          try { await pc.addIceCandidate(new NativeRTC!.RTCIceCandidate(cands[i])); } catch { /* */ }
        }
        callerIce = cands.length;
      } catch { /* retry */ }
    }, 1000);
  }, [cleanupResources, createPC, endCallInternal, getUserMedia, sendIce, stopPolling]);

  // ── Modo Expo Go (solo señalización) ─────────────────────────────
  const startCallSignaling = useCallback(async (
    type: 'audio' | 'video',
    targetUserId: string,
    callId?: string,
  ) => {
    const id = callId || `call_${Date.now()}`;
    callIdRef.current = id;
    roleRef.current = 'caller';
    setCallType(type);
    setCallState('calling');
    setIsSignalingOnly(true);
    await callAPI.offer({ callId: id, offer: MOCK_SDP, targetUserId, type });
    stopPolling();
    pollingRef.current = setInterval(async () => {
      if (endedRef.current) return;
      try {
        const session = await callAPI.get(id);
        if (session?.ended) { endCallInternal(); return; }
        if (session?.answer) {
          setCallState('connected');
          stopPolling();
        }
      } catch { /* retry */ }
    }, 2000);
  }, [endCallInternal, stopPolling]);

  const answerCallSignaling = useCallback(async (
    callId: string,
    _offer: object,
    type: 'audio' | 'video',
  ) => {
    callIdRef.current = callId;
    roleRef.current = 'callee';
    setCallType(type);
    setIsSignalingOnly(true);
    await callAPI.answer({ callId, answer: MOCK_ANSWER });
    setCallState('connected');
  }, []);

  const startCall = useCallback(async (
    type: 'audio' | 'video',
    targetUserId: string,
    callId?: string,
  ) => {
    if (HAS_NATIVE_MEDIA) return startCallNative(type, targetUserId, callId);
    return startCallSignaling(type, targetUserId, callId);
  }, [startCallNative, startCallSignaling]);

  const answerCall = useCallback(async (
    callId: string,
    offer: object,
    type: 'audio' | 'video',
  ) => {
    if (HAS_NATIVE_MEDIA) return answerCallNative(callId, offer, type);
    return answerCallSignaling(callId, offer, type);
  }, [answerCallNative, answerCallSignaling]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks?.().forEach((t: any) => {
      t.enabled = !t.enabled;
    });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks?.().forEach((t: any) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff(p => !p);
  }, []);

  const pollIncoming = useCallback((
    myUserId: string,
    onIncoming: (call: any) => void,
    onCancelled?: () => void,
  ) => {
    if (!myUserId) return () => {};
    let lastCallId: string | null = null;
    const check = async () => {
      try {
        const calls = await callAPI.incoming(myUserId);
        if (Array.isArray(calls) && calls.length > 0) {
          const call = calls[0];
          const cid = call.callId || call.call_id;
          if (cid !== lastCallId) {
            lastCallId = cid;
            onIncoming({
              callId: cid,
              offer: call.offer,
              type: call.type || 'audio',
              callerId: call.callerId || call.caller_id,
              callerName: call.callerName,
              callerAvatar: call.callerAvatar,
            });
          }
        } else if (lastCallId !== null) {
          lastCallId = null;
          onCancelled?.();
        }
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => { stopPolling(); cleanupResources(); }, [cleanupResources, stopPolling]);

  return {
    callState,
    callType,
    isMuted,
    isCamOff,
    isSignalingOnly,
    hasNativeMedia: HAS_NATIVE_MEDIA,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleCamera,
    pollIncoming,
  };
}
