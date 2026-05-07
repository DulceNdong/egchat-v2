import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI, contactsAPI } from './api';
import { Avatar } from './Avatar';
import { CameraModal } from './CameraModal';
import {
  saveMessageOffline,
  getConversationMessages,
  getAllConversations,
  saveConversation,
  updateMessageStatus,
  OfflineMessage,
} from './src/offline-db';
import { syncPendingMessages, syncMessagesForConversation } from './src/sync-manager';
import { useOffline } from './src/useOffline';

interface Message {
  id: string;
  text?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'contact';
  sender_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  reply_to?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  thumbnail_url?: string;
  duration?: number;
  location?: { lat: number; lng: number; address?: string };
  contact_data?: any;
  created_at: string;
  updated_at?: string;
  /** true = guardado solo localmente, pendiente de enviar */
  isOffline?: boolean;
  sender?: {
    id: string;
    phone: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: Array<{
    user_id: string;
    phone?: string;
    full_name?: string;
    avatar_url?: string;
  }>;
  last_message?: Message;
  unread_count: number;
  updated_at: string;
}

interface User {
  id: string;
  phone: string;
  full_name: string;
  avatar_url?: string;
}

export const ChatView: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Estado offline ──────────────────────────────────────────────
  const { isOnline, pendingCount, isSyncing, retrySync } = useOffline();

  // Cargar chats — primero desde local, luego desde servidor si hay conexión
  useEffect(() => {
    loadChats();
  }, []);

  // Recargar chats del servidor cuando se recupera la conexión
  useEffect(() => {
    if (isOnline) {
      loadChatsFromServer();
    }
  }, [isOnline]);

  // Cargar mensajes cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      if (selectedChat.unread_count > 0) {
        markAsRead(selectedChat.id);
      }
    }
  }, [selectedChat]);

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simular usuarios en línea
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (Math.random() > 0.7) {
          const randomUserId = Math.random().toString();
          if (newSet.has(randomUserId)) {
            newSet.delete(randomUserId);
          } else {
            newSet.add(randomUserId);
          }
        }
        return newSet;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ── Carga de chats: primero local, luego servidor ────────────────
  const loadChats = async () => {
    try {
      setIsLoading(true);

      // 1. Mostrar datos locales inmediatamente (sin esperar red)
      const localConvs = await getAllConversations();
      if (localConvs.length > 0) {
        const localChats: Chat[] = localConvs.map(c => ({
          id: c.id,
          type: 'private' as const,
          name: c.contact_name,
          avatar_url: c.contact_avatar,
          participants: [],
          last_message: c.last_message
            ? {
                id: '',
                text: c.last_message,
                type: 'text' as const,
                sender_id: '',
                status: 'delivered' as const,
                created_at: c.last_message_time,
              }
            : undefined,
          unread_count: c.unread_count,
          updated_at: c.updated_at,
        }));
        setChats(localChats);
      }

      // 2. Si hay conexión, actualizar desde servidor
      if (navigator.onLine) {
        await loadChatsFromServer();
      }
    } catch (error) {
      console.error('Error cargando chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatsFromServer = async () => {
    try {
      const data = await chatAPI.getChats();
      if (!data) return;
      setChats(data);

      // Guardar en local para uso offline
      for (const chat of data) {
        const otherParticipant = chat.participants?.find(
          (p: any) => p.user_id !== chat.participants?.[0]?.user_id
        );
        await saveConversation({
          id: chat.id,
          contact_name:
            chat.type === 'private'
              ? otherParticipant?.full_name || 'Usuario'
              : chat.name || 'Grupo',
          contact_avatar: chat.avatar_url || otherParticipant?.avatar_url,
          last_message: chat.last_message?.text || '',
          last_message_time: chat.last_message?.created_at || chat.updated_at,
          unread_count: chat.unread_count || 0,
          updated_at: chat.updated_at,
        });
      }
    } catch (error) {
      console.error('Error cargando chats del servidor:', error);
    }
  };

  // ── Carga de mensajes: primero local, luego servidor ─────────────
  const loadMessages = async (chatId: string) => {
    try {
      // 1. Mostrar mensajes locales inmediatamente
      const localMsgs = await getConversationMessages(chatId, 100);
      if (localMsgs.length > 0) {
        setMessages(
          localMsgs.map(m => ({
            id: m.id,
            text: m.text,
            type: m.type as Message['type'],
            sender_id: m.sender_id,
            status: m.status as Message['status'],
            file_url: m.media_url,
            file_type: m.file_type,
            created_at: m.timestamp,
            isOffline: m.synced === 0,
          }))
        );
      }

      // 2. Si hay conexión, descargar mensajes nuevos del servidor
      if (navigator.onLine) {
        const lastTimestamp =
          localMsgs.length > 0
            ? localMsgs[localMsgs.length - 1].timestamp
            : undefined;

        await syncMessagesForConversation(chatId, lastTimestamp);

        // Recargar desde local (ahora incluye los del servidor)
        const updatedMsgs = await getConversationMessages(chatId, 100);
        setMessages(
          updatedMsgs.map(m => ({
            id: m.id,
            text: m.text,
            type: m.type as Message['type'],
            sender_id: m.sender_id,
            status: m.status as Message['status'],
            file_url: m.media_url,
            file_type: m.file_type,
            created_at: m.timestamp,
            isOffline: m.synced === 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        await chatAPI.markAsRead(chatId, lastMessage.id);
      }
    } catch (error) {
      console.error('Error marcando como leído:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const text = newMessage.trim();
    const now = new Date().toISOString();
    const currentUserId =
      localStorage.getItem('user_id') ||
      localStorage.getItem('egchat_user_id') ||
      'me';

    // ID temporal local (UUID-like)
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // 1. Mostrar el mensaje en la UI inmediatamente (optimistic update)
    const optimisticMsg: Message = {
      id: localId,
      text,
      type: 'text',
      sender_id: currentUserId,
      status: isOnline ? 'sent' : 'pending',
      created_at: now,
      isOffline: !isOnline,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    // 2. Guardar en IndexedDB (synced=0 si offline, synced=1 si online)
    await saveMessageOffline({
      id: localId,
      conversation_id: selectedChat.id,
      sender_id: currentUserId,
      text,
      type: 'text',
      timestamp: now,
      status: isOnline ? 'sent' : 'pending',
      synced: 0, // siempre 0 hasta confirmar con servidor
    });

    // 3. Si hay conexión, enviar al servidor ahora mismo
    if (isOnline) {
      try {
        const sentMessage = await chatAPI.sendMessage(selectedChat.id, {
          text,
          type: 'text',
        });

        // Reemplazar el mensaje optimista con el del servidor
        setMessages(prev =>
          prev.map(m =>
            m.id === localId
              ? { ...sentMessage, isOffline: false }
              : m
          )
        );

        // Marcar como sincronizado en local
        await updateMessageStatus(localId, 'sent');

        // Actualizar lista de chats
        setChats(prev =>
          prev.map(chat =>
            chat.id === selectedChat.id
              ? { ...chat, last_message: sentMessage, updated_at: now }
              : chat
          )
        );
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        // Marcar como fallido en la UI
        setMessages(prev =>
          prev.map(m =>
            m.id === localId ? { ...m, status: 'failed', isOffline: true } : m
          )
        );
        await updateMessageStatus(localId, 'failed');
      }
    } else {
      // Sin conexión — actualizar lista de chats con el mensaje local
      setChats(prev =>
        prev.map(chat =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                last_message: optimisticMsg,
                updated_at: now,
              }
            : chat
        )
      );
    }
  };

  const sendFile = async (file: File) => {
    if (!selectedChat) return;

    try {
      // Subir archivo primero
      const uploadResult = await chatAPI.uploadFile(selectedChat.id, file);
      
      // Luego enviar mensaje con el archivo
      const messageData = {
        type: file.type.startsWith('image/') ? 'image' : 'file',
        file_url: uploadResult.file_url,
        file_type: file.type,
        file_size: file.size,
        thumbnail_url: uploadResult.thumbnail_url
      };

      const sentMessage = await chatAPI.sendMessage(selectedChat.id, messageData);
      setMessages(prev => [...prev, sentMessage]);
      
      // Actualizar chats
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, last_message: sentMessage, updated_at: new Date().toISOString() }
          : chat
      ));
    } catch (error) {
      console.error('Error enviando archivo:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await chatAPI.searchUsers(query);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    }
  };

  const createPrivateChat = async (userId: string) => {
    try {
      const chat = await chatAPI.createPrivate(userId);
      setChats(prev => [chat, ...prev]);
      setSelectedChat(chat);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creando chat privado:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === message.sender?.id ||
      message.sender_id === (localStorage.getItem('user_id') || localStorage.getItem('egchat_user_id') || 'me');
    const showAvatar = !isOwn || (selectedChat?.type === 'group');

    // Ícono de estado para mensajes propios
    const statusIcon = () => {
      if (!isOwn) return null;
      if (message.status === 'pending' || message.isOffline) {
        return <span title="Pendiente de envío" style={{ color: '#9ca3af' }}>🕐</span>;
      }
      if (message.status === 'failed') {
        return (
          <span
            title="Error — toca para reintentar"
            style={{ color: '#ef4444', cursor: 'pointer' }}
            onClick={() => retrySync()}
          >
            ❌
          </span>
        );
      }
      if (message.status === 'read') return <span style={{ color: '#00c8a0' }}>✓✓</span>;
      if (message.status === 'delivered') return <span style={{ color: '#9ca3af' }}>✓✓</span>;
      return <span style={{ color: '#9ca3af' }}>✓</span>;
    };

    return (
      <div
        key={message.id}
        data-message-id={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 ${
          message.isOffline ? 'message-pending' : ''
        }`}
      >
        {showAvatar && (
          <div className="flex-shrink-0 mr-2">
            <Avatar
              src={message.sender?.avatar_url}
              name={message.sender?.full_name || 'Usuario'}
              size="sm"
            />
          </div>
        )}

        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwn
                ? message.isOffline
                  ? 'bg-blue-300 text-white'   // más claro cuando es offline
                  : 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.type === 'text' && (
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            )}

            {message.type === 'image' && message.file_url && (
              <div className="space-y-2">
                <img
                  src={message.thumbnail_url || message.file_url}
                  alt="Imagen"
                  className="rounded-lg max-w-full cursor-pointer"
                  onClick={() => window.open(message.file_url, '_blank')}
                />
                {message.text && <p className="text-sm">{message.text}</p>}
              </div>
            )}

            {message.type === 'file' && (
              <div className="flex items-center space-x-2 p-2">
                <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs">📄</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Archivo</p>
                  <p className="text-xs opacity-70">
                    {message.file_size
                      ? `${(message.file_size / 1024).toFixed(1)} KB`
                      : ''}
                  </p>
                </div>
              </div>
            )}

            {message.reply_to && (
              <div className="text-xs opacity-70 mb-1 border-l-2 border-gray-400 pl-2">
                Respondiendo a un mensaje
              </div>
            )}
          </div>

          <div
            className={`flex items-center space-x-1 mt-1 text-xs ${
              isOwn ? 'justify-end text-blue-200' : 'text-gray-500'
            }`}
          >
            <span>{formatTime(message.created_at)}</span>
            {isOwn && (
              <span className="ml-1 msg-status-icon">
                {statusIcon()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChatItem = (chat: Chat) => {
    const otherParticipant = chat.participants.find(p => p.user_id !== chat.participants[0]?.user_id);
    const chatName = chat.type === 'private' 
      ? otherParticipant?.full_name || 'Usuario'
      : chat.name || 'Grupo';
    
    const lastMessageText = chat.last_message?.type === 'text' 
      ? chat.last_message.text 
      : chat.last_message?.type === 'image' 
        ? '📷 Foto' 
        : chat.last_message?.type === 'file'
          ? '📄 Archivo'
          : 'Mensaje';

    return (
      <div
        key={chat.id}
        onClick={() => setSelectedChat(chat)}
        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b ${
          selectedChat?.id === chat.id ? 'bg-blue-50' : ''
        }`}
      >
        <div className="flex-shrink-0 mr-3">
          <Avatar 
            src={chat.avatar_url || otherParticipant?.avatar_url} 
            name={chatName} 
            size="md" 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {chatName}
            </h3>
            <span className="text-xs text-gray-500 ml-2">
              {formatTime(chat.updated_at)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 truncate">
              {lastMessageText}
            </p>
            {chat.unread_count > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                {chat.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (selectedChat) {
    const chatName = selectedChat.type === 'private'
      ? selectedChat.participants.find(p => p.user_id !== selectedChat.participants[0]?.user_id)?.full_name || 'Usuario'
      : selectedChat.name || 'Grupo';

    return (
      <div
        className="flex flex-col bg-white"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        {/* Banner offline — aparece encima del header cuando no hay conexión */}
        {!isOnline && (
          <div
            style={{
              background: '#1a1a2e',
              color: '#fff',
              fontSize: 12,
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span>📡</span>
            <span>Sin conexión — los mensajes se enviarán al reconectar</span>
            {pendingCount > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  background: '#f59e0b',
                  borderRadius: 10,
                  padding: '1px 8px',
                  fontSize: 11,
                }}
              >
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Indicador de sincronización */}
        {isOnline && isSyncing && (
          <div
            style={{
              background: '#00c8a0',
              color: '#fff',
              fontSize: 11,
              padding: '4px 16px',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            ↻ Sincronizando mensajes...
          </div>
        )}

        {/* Header — sticky so it stays visible when the keyboard opens */}
        <div
          className="flex items-center p-4 border-b bg-white z-10"
          style={{ position: 'sticky', top: 0, flexShrink: 0 }}
        >
          <button
            onClick={() => setSelectedChat(null)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>

          <Avatar
            src={selectedChat.avatar_url}
            name={chatName}
            size="md"
          />

          <div className="ml-3 flex-1">
            <h2 className="font-semibold text-gray-900">{chatName}</h2>
            <p className={`text-sm ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
              {!isOnline
                ? 'Sin conexión'
                : selectedChat.type === 'group'
                ? `${selectedChat.participants.length} miembros`
                : 'En línea'}
            </p>
          </div>

          <button className="p-2 hover:bg-gray-100 rounded-full">⋮</button>
        </div>

        {/* Messages — takes remaining space and scrolls internally */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — stays above the keyboard */}
        <div className="border-t p-4 bg-white" style={{ flexShrink: 0 }}>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) sendFile(file);
              }}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              📎
            </button>
            
            <button
              onClick={() => setShowCamera(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              📷
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {/* Banner offline global */}
      {!isOnline && (
        <div
          style={{
            background: '#1a1a2e',
            color: '#fff',
            fontSize: 12,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span>📡</span>
          <span>Sin conexión</span>
          {pendingCount > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                background: '#f59e0b',
                borderRadius: 10,
                padding: '1px 8px',
                fontSize: 11,
              }}
            >
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Indicador de sincronización */}
      {isOnline && isSyncing && (
        <div
          style={{
            background: '#00c8a0',
            color: '#fff',
            fontSize: 11,
            padding: '4px 16px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          ↻ Sincronizando...
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b p-4" style={{ position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              🔍
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              ✏️
            </button>
          </div>
        </div>
        
        {showSearch && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Buscar usuarios..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
            
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => createPrivateChat(user.id)}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b"
                  >
                    <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                    <div className="ml-3">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tienes chats aún</p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Buscar usuarios para empezar
            </button>
          </div>
        ) : (
          chats.map(renderChatItem)
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onCapture={(file) => {
            sendFile(file);
            setShowCamera(false);
          }}
        />
      )}
    </div>
  );
};

export default ChatView;
