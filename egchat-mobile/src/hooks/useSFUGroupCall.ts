/**
 * useSFUGroupCall — Llamadas grupales hasta 9 participantes
 *
 * Arquitectura: mesh WebRTC con señalización centralizada via REST
 * (mismo patrón que llamadas 1:1, sin WebSocket adicional).
 *
 * Cada participante:
 *  1. Llama POST /api/call/room/:roomId/join → recibe lista de peers actuales
 *  2. Crea RTCPeerConnection con cada peer existente y envía offer
 *  3. Cuando llega un nuevo peer, recibe SSE 'group_call_participant_joined'
 *     y crea PeerConnection + offer hacia él
 *  4. Polling GET /api/call/room/:roomId/signals cada 800ms para recibir
 *     answers e ICE candidates pendientes
 *  5. Los eventos SSE aceleran la señalización (< 200ms)
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { getToken, getApiBase } from '../api';

export const MAX_SFU_PARTICIPANTS = 9;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:a.relay.metered.ca:80',  username: 'egchat', credential: 'egchat2025' },
  { urls: 'turn:a.relay.metered.ca:443', username: 'egchat', credential: 'egchat2025' },
  { urls: 'turns:a.relay.metered.ca:443?transport=tcp', username: 'egchat', credential: 'egchat2025' },
];

let NativeRTC: any = null;
try { if (Platform.OS !== 'web') NativeRTC = require('react-native-webrtc'); } catch {}

export interface SFUParticipant {
  userId: string;
  name: string;
  avatar?: string;
  stream?: any;
  isMuted: boolean;
  isCamOff: boolean;
  isConnected: boolean;
}

// ── HTTP helpers ──────────────────────────────────────────────────
async function roomFetch(method: string, path: string, body?: object) {
  const token = await getToken();
  const BASE = getApiBase();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Hook ──────────────────────────────────────────────────────────
export function useSFUGroupCall() {
  const [participants, setParticipants] = useState<SFUParticipant[]>([]);
  const [localStream, setLocalStream]  = useState<any>(null);
  const [isActive, setIsActive]        = useState(false);
  const [isMuted, setIsMuted]          = useState(false);
  const [isCamOff, setIsCamOff]        = useState(false);
  const [callType, setCallType]        = useState<'audio' | 'video'>('audio');
  const [participantCount, setParticipantCount] = useState(0);

  const peerConnections = useRef<Map<string, any>>(new Map());
  const localStreamRef  = useRef<any>(null);
  const roomIdRef       = useRef('');
  const myUserIdRef     = useRef('');
  const myNameRef       = useRef('');
  const pollingRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingICE      = useRef<Map<string, any[]>>(new Map());
  // Tracks SDPs ya procesados para no replicar
  const processedOffers  = useRef<Set<string>>(new Set());
  const processedAnswers = useRef<Set<string>>(new Set());

  const upsertParticipant = useCallback((userId: string, update: Partial<SFUParticipant>) => {
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === userId);
      if (exists) return prev.map(p => p.userId === userId ? { ...p, ...update } : p);
      return [...prev, {
        userId, name: userId, isMuted: false, isCamOff: false,
        isConnected: false, ...update,
      }];
    });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    const pc = peerConnections.current.get(userId);
    if (pc) { try { pc.close(); } catch {} peerConnections.current.delete(userId); }
    setParticipants(prev => prev.filter(p => p.userId !== userId));
    setParticipantCount(c => Math.max(0, c - 1));
  }, []);

  // Crear RTCPeerConnection con un peer remoto
  const createPC = useCallback((remoteId: string): any | null => {
    if (!NativeRTC) return null;
    if (peerConnections.current.has(remoteId)) return peerConnections.current.get(remoteId);

    const pc = new NativeRTC.RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (e: any) => {
      const stream = e.streams?.[0] || e.stream;
      if (stream) upsertParticipant(remoteId, { stream, isConnected: true });
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected')  upsertParticipant(remoteId, { isConnected: true });
      if (state === 'failed' || state === 'closed') removeParticipant(remoteId);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected') {
        upsertParticipant(remoteId, { isConnected: false });
      }
    };

    pc.onicecandidate = async (e: any) => {
      if (!e.candidate) return;
      try {
        await roomFetch('POST', `/api/call/room/${roomIdRef.current}/ice`, {
          toUserId: remoteId,
          candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
        });
      } catch {}
    };

    // Añadir tracks locales
    localStreamRef.current?.getTracks?.().forEach((t: any) => {
      try { pc.addTrack(t, localStreamRef.current); } catch {}
    });

    peerConnections.current.set(remoteId, pc);
    return pc;
  }, [upsertParticipant, removeParticipant]);

  // Enviar offer a un peer
  const sendOffer = useCallback(async (pc: any, remoteId: string) => {
    try {
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);
      await roomFetch('POST', `/api/call/room/${roomIdRef.current}/offer`, {
        toUserId: remoteId,
        sdp: pc.localDescription,
      });
    } catch (e) {
      console.warn('[SFU] sendOffer error:', e);
    }
  }, []);

  // Procesar señales pendientes (polling + SSE)
  const processSignals = useCallback(async () => {
    if (!roomIdRef.current || !myUserIdRef.current) return;
    try {
      const data = await roomFetch('GET', `/api/call/room/${roomIdRef.current}/signals`);

      // Procesar offers recibidos → crear PC + answer
      for (const o of (data.offers || [])) {
        const key = `offer_${o.from}_${Date.now()}`;
        if (processedOffers.current.has(`offer_${o.from}`)) continue;
        processedOffers.current.add(`offer_${o.from}`);

        const pc = createPC(o.from);
        if (!pc) continue;

        if (pc.signalingState === 'stable') {
          await pc.setRemoteDescription(new NativeRTC.RTCSessionDescription(o.sdp));

          // Aplicar ICE pendientes
          const pending = pendingICE.current.get(o.from) || [];
          for (const c of pending) {
            try { await pc.addIceCandidate(new NativeRTC.RTCIceCandidate(c)); } catch {}
          }
          pendingICE.current.delete(o.from);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await roomFetch('POST', `/api/call/room/${roomIdRef.current}/answer`, {
            toUserId: o.from,
            sdp: pc.localDescription,
          });
        }
      }

      // Procesar answers recibidos
      for (const a of (data.answers || [])) {
        if (processedAnswers.current.has(`answer_${a.from}`)) continue;
        processedAnswers.current.add(`answer_${a.from}`);

        const pc = peerConnections.current.get(a.from);
        if (pc?.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new NativeRTC.RTCSessionDescription(a.sdp));
        }
      }

      // Procesar ICE candidates
      for (const { from, candidates } of (data.iceCandidates || [])) {
        const pc = peerConnections.current.get(from);
        for (const c of candidates) {
          if (pc?.remoteDescription) {
            try { await pc.addIceCandidate(new NativeRTC.RTCIceCandidate(c)); } catch {}
          } else {
            const arr = pendingICE.current.get(from) || [];
            arr.push(c);
            pendingICE.current.set(from, arr);
          }
        }
      }
    } catch { /* retry en el siguiente ciclo */ }
  }, [createPC]);

  // Iniciar llamada grupal
  const startSFUCall = useCallback(async (
    roomId: string,
    myUserId: string,
    myName: string,
    type: 'audio' | 'video' = 'audio',
    myAvatar?: string,
  ): Promise<boolean> => {
    if (!NativeRTC) return false;

    roomIdRef.current   = roomId;
    myUserIdRef.current = myUserId;
    myNameRef.current   = myName;
    setCallType(type);

    // Obtener stream local
    try {
      const stream = await NativeRTC.mediaDevices.getUserMedia(
        type === 'video'
          ? { audio: true, video: { facingMode: 'user', width: 320, height: 240, frameRate: 15 } }
          : { audio: true, video: false },
      );
      localStreamRef.current = stream;
      setLocalStream(stream);
    } catch (e) {
      console.warn('[SFU] getUserMedia error:', e);
      return false;
    }

    // Unirse al room — recibir lista de peers actuales
    let roomData: any;
    try {
      roomData = await roomFetch('POST', `/api/call/room/${roomId}/join`, {
        name: myName,
        avatar: myAvatar,
        callType: type,
      });
    } catch (e) {
      console.warn('[SFU] join error:', e);
      return false;
    }

    const currentPeers: Array<{ userId: string; name: string; avatar?: string }> =
      roomData.participants || [];

    // Crear PeerConnections + offers hacia todos los peers existentes
    for (const peer of currentPeers) {
      upsertParticipant(peer.userId, { name: peer.name, avatar: peer.avatar });
      const pc = createPC(peer.userId);
      if (pc) await sendOffer(pc, peer.userId);
    }

    setParticipantCount(currentPeers.length + 1);
    setIsActive(true);

    // Polling cada 800ms para recibir signals
    pollingRef.current = setInterval(processSignals, 800);

    return true;
  }, [createPC, processSignals, sendOffer, upsertParticipant]);

  // Manejar evento SSE de nuevo participante
  const handlePeerJoined = useCallback(async (userId: string, name: string, avatar?: string) => {
    if (userId === myUserIdRef.current) return;
    upsertParticipant(userId, { name, avatar });
    // Esperamos su offer — no necesitamos crear uno nosotros
    // (quien llega primero al room ya tiene los peers y envía offers)
    setParticipantCount(c => c + 1);
  }, [upsertParticipant]);

  // Salir del room
  const leaveSFUCall = useCallback(async () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    try {
      if (roomIdRef.current) {
        await roomFetch('DELETE', `/api/call/room/${roomIdRef.current}/leave`);
      }
    } catch {}

    peerConnections.current.forEach(pc => { try { pc.close(); } catch {} });
    peerConnections.current.clear();
    pendingICE.current.clear();
    processedOffers.current.clear();
    processedAnswers.current.clear();

    localStreamRef.current?.getTracks?.().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants([]);
    setIsActive(false);
    setParticipantCount(0);
  }, []);

  const toggleSFUMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleSFUCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  useEffect(() => () => { leaveSFUCall(); }, []);

  return {
    participants,
    localStream,
    isActive,
    isMuted,
    isCamOff,
    callType,
    participantCount,
    startSFUCall,
    leaveSFUCall,
    toggleSFUMute,
    toggleSFUCamera,
    handlePeerJoined,    // llamar desde el listener SSE del _layout
    hasWebRTC: !!NativeRTC,
    maxParticipants: MAX_SFU_PARTICIPANTS,
  };
}
