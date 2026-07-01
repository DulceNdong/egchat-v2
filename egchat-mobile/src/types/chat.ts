export type ChatMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ChatMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'contact'
  | 'location';

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
  uploadProgress?: number;
  uploadState?: 'queued' | 'uploading' | 'processing';
  created_at: string;
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
