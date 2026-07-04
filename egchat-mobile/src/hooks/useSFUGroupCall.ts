/**
 * EGChat — Llamadas grupales SFU via WebSocket
 * Arquitectura: cada participante envía su stream al servidor backend
 * que lo reenvía selectivamente a los demás (SFU simplificado con WS)
 *
 * Soporta hasta 9 participantes (como WeChat)
 * Señalización: WebSocket en /api/call/sfu-ws
 * Media: WebRTC P2P con el servidor como intermediario de señalización
 *
 * Para producción real se recomienda LiveKit o Mediasoup.
 * Esta implementación usa WebRTC mesh con señalización centralizada
 * para soportar hasta 9 participantes de forma eficiente.
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { getToken, getApiBase } from '../api';

export const MAX_SFU_PARTICIPANTS = 9;

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'turn:a.relay.metered.ca:80', username: 'egchat', credential: 'egchat2025' },
  { urls: 'turn:a.relay.metered.ca:443', username: 'egchat', credential: 'egchat2025' },
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

export function useSFUGroupCall() {
  const [participants, setParticipants] = useState<SFUParticipant[]>([]);
  const [localStream, setLocalStream] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [participantCount, setParticipantCount] = useState(0);

  const wsRef            = useRef<WebSocket | null>(null);
  const peerConnections  = useRef<Map<string, any>>(new Map());
  const localStreamRef   = useRef<any>(null);
  const roomIdRef        = useRef('');
  const myUserIdRef      = useRef('');
  const pendingICE       = useRef<Map<string, any[]>>(new Map());

  const updateParticipant = useCallback((
    userId: string, update: Partial<SFUParticipant>
  ) => {
    setParticipants(prev => {
      const exists = prev.find(p => p.userId === userId);
      if (exists) return prev.map(p => p.userId === userId ? { ...p, ...update } : p);
      return [...prev, { userId, name: userId, isMuted: false, isCamOff: false, isConnected: false, ...update }];
    });
  }, []);

  const createPeerConnection = useCallback((remoteUserId: string) => {
    if (!NativeRTC) return null;
    const pc = new NativeRTC.RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (e: any) => {
      const stream = e.streams?.[0] || e.stream;
      if (stream) updateParticipant(remoteUserId, { stream, isConnected: true });
    };

    pc.onicecandidate = (e: any) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice', to: remoteUserId, candidate: e.candidate,
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        updateParticipant(remoteUserId, { isConnected: false });
      }
    };

    // Añadir tracks locales
    localStreamRef.current?.getTracks?.().forEach((t: any) => {
      try { pc.addTrack(t, localStreamRef.current); } catch {}
    });

    peerConnections.current.set(remoteUserId, pc);
    return pc;
  }, [updateParticipant]);

  const connectToWS = useCallback(async (roomId: string) => {
    const token = await getToken();
    const base  = getApiBase().replace('https://', 'wss://').replace('http://', 'ws://');
    const wsUrl = `${base}/api/call/sfu-ws?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token || '')}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {

          case 'room_state':
            // Sincronizar lista de participantes actuales
            setParticipantCount(msg.participants?.length || 0);
            for (const p of (msg.participants || [])) {
              if (p.userId === myUserIdRef.current) continue;
              updateParticipant(p.userId, { name: p.name, avatar: p.avatar });
              // Iniciar conexión P2P con cada participante existente
              const pc = createPeerConnection(p.userId);
              if (!pc) continue;
              const offer = await pc.createOffer({});
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', to: p.userId, sdp: pc.localDescription }));
            }
            break;

          case 'participant_joined':
            if (msg.userId !== myUserIdRef.current) {
              updateParticipant(msg.userId, { name: msg.name, avatar: msg.avatar });
              setParticipantCount(c => c + 1);
            }
            break;

          case 'participant_left':
            setParticipants(prev => prev.filter(p => p.userId !== msg.userId));
            peerConnections.current.get(msg.userId)?.close();
            peerConnections.current.delete(msg.userId);
            setParticipantCount(c => Math.max(0, c - 1));
            break;

          case 'offer': {
            const pc = createPeerConnection(msg.from) || peerConnections.current.get(msg.from);
            if (!pc) break;
            await pc.setRemoteDescription(new NativeRTC.RTCSessionDescription(msg.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', to: msg.from, sdp: pc.localDescription }));
            // Procesar ICE candidatos pendientes
            const pending = pendingICE.current.get(msg.from) || [];
            for (const c of pending) {
              try { await pc.addIceCandidate(new NativeRTC.RTCIceCandidate(c)); } catch {}
            }
            pendingICE.current.delete(msg.from);
            break;
          }

          case 'answer': {
            const pc = peerConnections.current.get(msg.from);
            if (pc?.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new NativeRTC.RTCSessionDescription(msg.sdp));
            }
            break;
          }

          case 'ice': {
            const pc = peerConnections.current.get(msg.from);
            if (pc?.remoteDescription) {
              try { await pc.addIceCandidate(new NativeRTC.RTCIceCandidate(msg.candidate)); } catch {}
            } else {
              const arr = pendingICE.current.get(msg.from) || [];
              arr.push(msg.candidate);
              pendingICE.current.set(msg.from, arr);
            }
            break;
          }

          case 'mute_update':
            updateParticipant(msg.userId, { isMuted: msg.isMuted, isCamOff: msg.isCamOff });
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      if (isActive) setIsActive(false);
    };

    return ws;
  }, [createPeerConnection, isActive, updateParticipant]);

  const startSFUCall = useCallback(async (
    roomId: string,
    myUserId: string,
    myName: string,
    type: 'audio' | 'video' = 'audio',
  ) => {
    if (!NativeRTC) return false;
    roomIdRef.current   = roomId;
    myUserIdRef.current = myUserId;
    setCallType(type);

    const stream = await NativeRTC.mediaDevices.getUserMedia(
      type === 'video'
        ? { audio: true, video: { facingMode: 'user', width: 320, height: 240, frameRate: 15 } }
        : { audio: true, video: false }
    );
    localStreamRef.current = stream;
    setLocalStream(stream);

    const ws = await connectToWS(roomId);

    // Anunciar entrada
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join', roomId, userId: myUserId, name: myName,
        callType: type,
      }));
    };

    setIsActive(true);
    return true;
  }, [connectToWS]);

  const leaveSFUCall = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'leave' }));
    wsRef.current?.close();
    wsRef.current = null;
    peerConnections.current.forEach(pc => { try { pc.close(); } catch {} });
    peerConnections.current.clear();
    pendingICE.current.clear();
    localStreamRef.current?.getTracks?.().forEach((t: any) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setParticipants([]);
    setIsActive(false);
    setParticipantCount(0);
  }, []);

  const toggleSFUMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsMuted(p => {
      const next = !p;
      wsRef.current?.send(JSON.stringify({ type: 'mute_update', isMuted: next, isCamOff }));
      return next;
    });
  }, [isCamOff]);

  const toggleSFUCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks?.().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsCamOff(p => {
      const next = !p;
      wsRef.current?.send(JSON.stringify({ type: 'mute_update', isMuted, isCamOff: next }));
      return next;
    });
  }, [isMuted]);

  useEffect(() => () => { leaveSFUCall(); }, []);

  return {
    participants, localStream, isActive,
    isMuted, isCamOff, callType, participantCount,
    startSFUCall, leaveSFUCall,
    toggleSFUMute, toggleSFUCamera,
    hasWebRTC: !!NativeRTC,
    maxParticipants: MAX_SFU_PARTICIPANTS,
  };
}
