export type ChatMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ChatMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'contact'
  | 'location'
  | 'live_location'
  | 'album';

export interface ChatParticipant {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

export interface ChatMessage {
  id: string;
  text?: string;
  type: ChatMessageType | string;
  sender_id: string;
  status: ChatMessageStatus;
  reply_to?: string;
  file_url?: string;
  imageUrl?: string;
  /** URLs de fotos para mensajes tipo álbum */
  album_urls?: string[];
  uploadProgress?: number;
  uploadState?: 'queued' | 'uploading' | 'processing';
  created_at: string;
  edited?: boolean;
  /** Historial de versiones anteriores del mensaje */
  edit_history?: Array<{ text: string; edited_at: string }>;
  expires_at?: string;
  view_once?: boolean;
  /** Envío programado — ISO string de cuando debe enviarse */
  scheduled_at?: string;
  /** Transcripción de nota de voz (generada localmente, no se sube) */
  voice_transcript?: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ChatSummary {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: ChatParticipant[];
  last_message?: {
    text?: string;
    type: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
  updated_at: string;
}
