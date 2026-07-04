/**
 * EGChat — Módulo para recibir contenido compartido desde otras apps
 * Android: Intent ACTION_SEND / ACTION_SEND_MULTIPLE
 * iOS: Share Extension + App Group
 *
 * Uso en cualquier pantalla del chat:
 *   useSharedContent((content) => {
 *     if (content.type === 'image') sendMedia(content.uri, ...);
 *     if (content.type === 'text') setText(content.text);
 *   });
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { useEffect } from 'react';

const { EGChatShareModule } = NativeModules;
const isAvailable = !!EGChatShareModule && Platform.OS !== 'web';

let emitter: NativeEventEmitter | null = null;
if (isAvailable) emitter = new NativeEventEmitter(EGChatShareModule);

export interface SharedContent {
  type: 'image' | 'video' | 'audio' | 'file' | 'text' | 'multiple';
  uri?: string;
  text?: string;
  mimeType?: string;
  files?: Array<{ type: string; uri: string; mimeType: string }>;
}

export const ShareExtension = {
  /** Obtiene el contenido pendiente de compartir (si lo hay) */
  async getSharedContent(): Promise<SharedContent | null> {
    if (!isAvailable) return null;
    try {
      return await EGChatShareModule.getSharedContent();
    } catch { return null; }
  },

  /** Limpia el contenido compartido pendiente */
  clear() {
    if (!isAvailable) return;
    EGChatShareModule.clearSharedContent?.();
  },

  /** Escuchar cuando se recibe un share mientras la app está abierta */
  onShared(callback: (content: SharedContent) => void) {
    if (!emitter) return () => {};
    const sub = emitter.addListener('sharedContent', callback);
    return () => sub.remove();
  },
};

/**
 * Hook para manejar contenido compartido desde otras apps.
 * Verifica contenido pendiente al montar y escucha nuevos shares en tiempo real.
 */
export function useSharedContent(onContent: (content: SharedContent) => void) {
  useEffect(() => {
    if (!isAvailable) return;

    // Verificar si hay contenido pendiente al abrir la app
    ShareExtension.getSharedContent().then(content => {
      if (content) {
        ShareExtension.clear();
        onContent(content);
      }
    });

    // Escuchar shares mientras la app está abierta
    const unsub = ShareExtension.onShared(content => {
      ShareExtension.clear();
      onContent(content);
    });

    return unsub;
  }, []);
}
