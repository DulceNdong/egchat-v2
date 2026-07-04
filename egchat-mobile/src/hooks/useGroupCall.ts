/**
 * useGroupCall — Llamadas grupales WebRTC mesh
 * Hasta 4 participantes. Cada uno se conecta P2P con los demás.
 * Señalización via backend Render (mismo que llamadas 1:1)
 *
 * Arquitectura mesh: N*(N-1)/2 conexiones
 *   2 personas → 1 conexión
 *   3 personas → 3 conexiones
 *   4 personas → 6 conexiones
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { callAPI, getToken, getApiBase } from '../api';

const MAX_PARTICIPANTS = 4;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'turn:a.relay.metered.ca:80', username: 'egchat', credential: 'egchat2025' },
  { urls: 'turn:a.relay.metered.ca:443', username: 'egchat', credential: 'egchat2025' },
];

let NativeRTC: any = null;
try {
  if (Platform.OS !== 'web') NativeRTC = require('react-native-webrtc');
} catch {}

export interface GroupParticipant {
  userId: string;
  name: string;
  avatar?: string;
  stream?: any;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
}

export function useGroupCall() {
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [localStream, setLocalStream] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  // Mapa: userId → RTCPeerConnection
  const peerConnections = useRef<Map<string, any>>(new Map());
  const localStreamRef  = useRef<any>(null);
  const groupIdRef      = useRef<string>('');
  const myUserIdRef     = useRef<string>('');
  const pollingRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  // Crear PeerConnection con un participante
  const createPeer = useCallback((targetUserId: string, type: 'audio' | 'video') => {
    if (!NativeRTC) return null;
    const pc = new NativeRTC.RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Stream remoto recibido
    pc.ontrack = (e: any) => {
      const stream = e.streams?.[0] || e.stream;
      if (stream) {
        setParticipants(prev => prev.map(p =>
          p.userId === targetUserId ? { ...p, stream } : p
        ));
      }
    };

    // Enviar ICE candidates
    pc.onicecandidate = async (e: any) => {
      if (!e.candidate) return;
      try {
        await callAPI.ice({
          callId: groupIdRef.current,
          candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
          role: 'caller',
          targetUserId,
        });
      } catch {}
    };

    return pc;
  }, []);

  // Añadir tracks locales a un PC
  const addLocalTracks = useCallback((pc: any) => {
    const stream = localStreamRef.current;
    if (!stream || !pc) return;
    try {
      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));
    } catch {
      if (pc.addStream) pc.addStream(stream);
    }
  }, []);

  // Iniciar llamada grupal
  const startGroupCall = useCallback(async (
    groupId: string,
    myUserId: string,
    targetUserIds: string[],
    type: 'audio' | 'video' = 'audio',
  ) => {
    if (!NativeRTC || targetUserIds.length === 0) return;
    if (targetUserIds.length >= MAX_PARTICIPANTS) {
      targetUserIds = targetUserIds.slice(0, MAX_PARTICIPANTS - 1);
    }

    myUserIdRef.current  = myUserId;
    groupIdRef.current   = groupId;
    setCallType(type);

    // Obtener stream local
    const stream = await NativeRTC.mediaDevices.getUserMedia(
      type === 'video'
        ? { audio: true, video: { facingMode: 'user', width: 320, height: 240 } }
        : { audio: true, video: false }
    );
    localStreamRef.current = stream;
    setLocalStream(stream);

    // Crear una PeerConnection por cada participante
    for (const targetId of targetUserIds) {
      const pc = createPeer(targetId, type);
      if (!pc) continue;
      peerConnections.current.set(targetId, pc);
      addLocalTracks(pc);

      // Crear offer para cada participante
      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);

      await callAPI.offer({
        callId: `${groupId}_${myUserId}_${targetId}`,
        offer: pc.localDescription,
        targetUserId: targetId,
        type,
        groupId,
      });
    }

    setIsActive(true);
    setParticipants(targetUserIds.map(id => ({ userId: id, name: id })));

    // Polling para respuestas ICE
    stopPolling();
    pollingRef.current = setInterval(async () => {
      for (const [targetId, pc] of peerConnections.current.entries()) {
        try {
          const session = await callAPI.get(`${groupId}_${myUserId}_${targetId}`);
          if (session?.ended) { removeParticipant(targetId); continue; }

          if (session?.answer && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new NativeRTC.RTCSessionDescription(session.answer));
          }

          const cands = session?.calleeCandidates || [];
          for (const c of cands) {
            try { await pc.addIceCandidate(new NativeRTC.RTCIceCandidate(c)); } catch {}
          }
        } catch {}
      }
    }, 1500);
  }, [addLocalTracks, createPeer, stopPolling]);

  // Unirse a llamada grupal existente (responder)
  const joinGroupCall = useCallback(async (
    groupId: string,
    myUserId: string,
    callerOffers: Array<{ callerId: string; offer: object; type: string }>,
  ) => {
    if (!NativeRTC) return;
    myUserIdRef.current = myUserId;
    groupIdRef.current  = groupId;
    const type = (callerOffers[0]?.type || 'audio') as 'audio' | 'video';
    setCallType(type);

    const stream = await NativeRTC.mediaDevices.getUserMedia(
      type === 'video'
        ? { audio: true, video: { facingMode: 'user', width: 320, height: 240 } }
        : { audio: true, video: false }
    );
    localStreamRef.current = stream;
    setLocalStream(stream);

    for (const { callerId, offer } of callerOffers) {
      const pc = createPeer(callerId, type);
      if (!pc) continue;
      peerConnections.current.set(callerId, pc);
      addLocalTracks(pc);

      await pc.setRemoteDescription(new NativeRTC.RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await callAPI.answer({
        callId: `${groupId}_${callerId}_${myUserId}`,
        answer: pc.localDescription,
      });
    }

    setIsActive(true);
    setParticipants(callerOffers.map(c => ({ userId: c.callerId, name: c.callerId })));
  }, [addLocalTracks, createPeer]);

  const removeParticipant = useCallback((userId: string) => {
    const pc = peerConnections.current.get(userId);
    if (pc) { try { pc.close(); } catch {} peerConnections.current.delete(userId); }
    setParticipants(prev => prev.filter(p => p.userId !== userId));
  }, []);

  const endGroupCall = useCallback(() => {
    stopPolling();
    peerConnections.current.forEach(pc => { try { pc.close(); } catch {} });
    peerConnections.current.clear();
    localStreamRef.current?.getTracks?.().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants([]);
    setIsActive(false);
  }, [stopPolling]);

  const toggleGroupMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleGroupCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  // Actualizar nombres de participantes
  const updateParticipantInfo = useCallback((
    userId: string, info: Partial<GroupParticipant>
  ) => {
    setParticipants(prev => prev.map(p => p.userId === userId ? { ...p, ...info } : p));
  }, []);

  useEffect(() => () => { stopPolling(); endGroupCall(); }, []);

  return {
    participants,
    localStream,
    isActive,
    isMuted,
    isCamOff,
    callType,
    startGroupCall,
    joinGroupCall,
    endGroupCall,
    removeParticipant,
    toggleGroupMute,
    toggleGroupCamera,
    updateParticipantInfo,
    hasNativeWebRTC: !!NativeRTC,
  };
}
