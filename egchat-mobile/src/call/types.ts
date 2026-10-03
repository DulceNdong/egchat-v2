// ══════════════════════════════════════════════════════════════════
// EGChat — Tipos globales del sistema de llamadas
// ══════════════════════════════════════════════════════════════════

/** Estado de comunicación de la llamada */
export type CallCommState =
  | 'idle'          // sin llamada
  | 'calling'       // caller enviando offer, esperando respuesta
  | 'ringing'       // callee: recibió offer, sonando
  | 'accepted'      // callee aceptó, estableciendo WebRTC
  | 'connecting'    // ICE en progreso
  | 'connected'     // audio/video activo
  | 'reconnecting'  // ICE disconnected, intentando recuperar
  | 'rejected'      // callee rechazó
  | 'missed'        // no contestó antes del timeout
  | 'ended'         // llamada terminada normalmente
  | 'failed';       // error técnico (ICE failed, etc.)

/** Estado de la UI de llamada */
export type CallUIState =
  | 'full'          // pantalla completa /call/[callId]
  | 'minimized'     // FloatingCallBar visible
  | 'hidden';       // CallKit/notificación nativa gestiona la UI

/** Rol del usuario en la llamada actual */
export type CallRole = 'caller' | 'callee';

/** Información completa de una sesión de llamada */
export interface CallSession {
  callId: string;
  callType: 'audio' | 'video';
  role: CallRole;
  targetUserId: string;
  targetName: string;
  targetAvatar?: string;
  chatId?: string;
  offer?: object;
  /** Timestamp Unix en ms de cuando empezó la llamada */
  startedAt?: number;
  /** Segundos de duración (solo cuando está connected) */
  duration: number;
}

/** Payload de llamada entrante (viene de push/PushKit/notificación) */
export interface IncomingCallPayload {
  callId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
  targetUserId?: string;
  offer?: object;
  chatId?: string;
}

/** Controles que la UI puede invocar sobre la llamada activa */
export interface CallControls {
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => Promise<void>;
  isMuted: boolean;
  isCamOff: boolean;
  isSpeakerOn: boolean;
}

/** Snapshot de estado que el CallManager expone a los observers */
export interface CallManagerState {
  commState: CallCommState;
  uiState: CallUIState;
  session: CallSession | null;
  localStream: any | null;
  remoteStream: any | null;
  isMuted: boolean;
  isCamOff: boolean;
  isSpeakerOn: boolean;
  isSignalingOnly: boolean;
}

/** Función de observer para cambios de estado */
export type CallStateObserver = (state: CallManagerState) => void;
