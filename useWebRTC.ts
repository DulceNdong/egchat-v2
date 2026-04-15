// ─── useWebRTC — señalización via HTTP polling ────────────────────────────────
import { useRef, useState, useCallback } from 'react';
import { authAPI } from './api';

const BASE = (() => {
  const url = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (!url || url.startsWith('/')) return 'https://egchat-api.onrender.com/api';
  return url.endsWith('/api') ? url : url.replace(/\/$/, '') + '/api';
})();

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

async function sigFetch(path: string, method = 'GET', body?: object) {
  const token = authAPI.getToken();
  const url = `${BASE}${path}${token ? (path.includes('?') ? '&' : '?') + '_t=' + encodeURIComponent(token) : ''}`;
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Signal error ${res.status}`);
  return res.json();
}

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export function useWebRTC() {
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string>('');
  const roleRef = useRef<'caller' | 'callee'>('caller');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const stopPolling = () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };

  const cleanup = useCallback(() => {
    stopPolling();
    pc.current?.close(); pc.current = null;
    localStream.current?.getTracks().forEach(t => t.stop()); localStream.current = null;
    remoteStream.current = null;
    setRemoteStreamState(null); setLocalStreamState(null);
    setCallState('idle');
  }, []);

  const createPC = (onTrack: (stream: MediaStream) => void) => {
    const p = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    p.ontrack = (e) => {
      const s = e.streams[0] || new MediaStream([e.track]);
      remoteStream.current = s;
      onTrack(s);
    };
    return p;
  };

  // ── CALLER: iniciar llamada ──────────────────────────────────────────────────
  const startCall = useCallback(async (type: 'audio' | 'video', targetUserId: string) => {
    try {
      setCallType(type);
      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'video' ? { audio: true, video: { facingMode: 'user' } } : { audio: true, video: false }
      );
      localStream.current = stream;
      setLocalStreamState(stream);

      const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      callIdRef.current = callId;
      roleRef.current = 'caller';

      const p = createPC((s) => setRemoteStreamState(s));
      pc.current = p;
      stream.getTracks().forEach(t => p.addTrack(t, stream));

      const iceCandidates: RTCIceCandidate[] = [];
      p.onicecandidate = (e) => { if (e.candidate) iceCandidates.push(e.candidate); };

      const offer = await p.createOffer();
      await p.setLocalDescription(offer);

      // Esperar a que se recojan ICE candidates
      await new Promise(r => setTimeout(r, 1000));

      await sigFetch('/call/offer', 'POST', { callId, offer: p.localDescription, targetUserId, type });
      // Enviar ICE candidates
      for (const c of iceCandidates) await sigFetch('/call/ice', 'POST', { callId, candidate: c, role: 'caller' });

      setCallState('calling');

      // Polling para recibir answer
      pollingRef.current = setInterval(async () => {
        try {
          const session = await sigFetch(`/call/${callId}`);
          if (session.answer && p.signalingState !== 'stable') {
            await p.setRemoteDescription(new RTCSessionDescription(session.answer));
            for (const c of (session.calleeCandidates || [])) {
              try { await p.addIceCandidate(new RTCIceCandidate(c)); } catch {}
            }
            setCallState('connected');
          }
        } catch { cleanup(); }
      }, 1500);

    } catch (err) {
      console.error('startCall error:', err);
      // Fallback: llamada simulada si no hay permisos
      setCallState('calling');
      setTimeout(() => setCallState('connected'), 2000);
    }
  }, [cleanup]);

  // ── CALLEE: responder llamada ────────────────────────────────────────────────
  const answerCall = useCallback(async (callId: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') => {
    try {
      setCallType(type);
      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'video' ? { audio: true, video: { facingMode: 'user' } } : { audio: true, video: false }
      );
      localStream.current = stream;
      setLocalStreamState(stream);
      callIdRef.current = callId;
      roleRef.current = 'callee';

      const p = createPC((s) => setRemoteStreamState(s));
      pc.current = p;
      stream.getTracks().forEach(t => p.addTrack(t, stream));

      await p.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await p.createAnswer();
      await p.setLocalDescription(answer);

      const iceCandidates: RTCIceCandidate[] = [];
      p.onicecandidate = (e) => { if (e.candidate) iceCandidates.push(e.candidate); };
      await new Promise(r => setTimeout(r, 800));

      await sigFetch('/call/answer', 'POST', { callId, answer: p.localDescription });
      for (const c of iceCandidates) await sigFetch('/call/ice', 'POST', { callId, candidate: c, role: 'callee' });

      // Añadir ICE candidates del caller
      const session = await sigFetch(`/call/${callId}`);
      for (const c of (session.callerCandidates || [])) {
        try { await p.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }

      setCallState('connected');
    } catch (err) {
      console.error('answerCall error:', err);
      setCallState('connected'); // fallback
    }
  }, []);

  const endCall = useCallback(async () => {
    if (callIdRef.current) {
      try { await sigFetch(`/call/${callIdRef.current}`, 'DELETE'); } catch {}
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStream.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  // Polling para llamadas entrantes
  const pollIncoming = useCallback(async (myUserId: string, onIncoming: (call: any) => void) => {
    const check = async () => {
      try {
        const calls = await sigFetch(`/call/incoming/${myUserId}`);
        if (calls.length > 0) onIncoming(calls[0]);
      } catch {}
    };
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  return {
    callState, callType, isMuted, isCamOff,
    localStream: localStreamState, remoteStream: remoteStreamState,
    startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
  };
}
