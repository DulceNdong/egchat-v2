/**
 * EGChat — Motor de Mini-Apps (WebView + JSBridge)
 *
 * Cada mini-app es una URL web que corre en un WebView seguro.
 * El bridge expone APIs de EGChat:
 *   - egchat.getUserInfo()        → nombre, avatar, teléfono
 *   - egchat.pay(amount, desc)    → abre el monedero de EGChat
 *   - egchat.shareToChat(content) → comparte en un chat
 *   - egchat.getLocation()        → GPS del dispositivo
 *   - egchat.scanQR()             → abre el escáner QR
 *   - egchat.close()              → cierra la mini-app
 *   - egchat.setTitle(title)      → cambia el título de la barra
 *
 * Las mini-apps NO pueden acceder a:
 *   - Tokens de sesión
 *   - Mensajes privados
 *   - Claves E2E
 */
import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import Svg, { Path, Line } from 'react-native-svg';

// WebView solo en nativo
let WebView: any = null;
try {
  if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
  }
} catch {}

export interface MiniAppProps {
  url: string;
  title: string;
  icon?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userPhone?: string;
  onPayment?: (amount: number, description: string) => void;
  onShareToChat?: (content: string) => void;
  onClose?: () => void;
}

// JavaScript inyectado en la mini-app para exponer el bridge
const createBridgeScript = (userInfo: object) => `
(function() {
  window.egchat = {
    _callbacks: {},
    _callId: 0,

    _call: function(method, params) {
      return new Promise((resolve, reject) => {
        const id = ++this._callId;
        this._callbacks[id] = { resolve, reject };
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bridge_call', id, method, params
        }));
      });
    },

    getUserInfo: function() {
      return Promise.resolve(${JSON.stringify(userInfo)});
    },

    pay: function(amount, description, currency) {
      return this._call('pay', { amount, description, currency: currency || 'XAF' });
    },

    shareToChat: function(content, type) {
      return this._call('shareToChat', { content, type: type || 'text' });
    },

    getLocation: function() {
      return this._call('getLocation', {});
    },

    scanQR: function() {
      return this._call('scanQR', {});
    },

    close: function() {
      this._call('close', {});
    },

    setTitle: function(title) {
      this._call('setTitle', { title });
    },

    showToast: function(message) {
      this._call('showToast', { message });
    },

    // Recibir respuesta del native
    _onResponse: function(id, result, error) {
      const cb = this._callbacks[id];
      if (!cb) return;
      delete this._callbacks[id];
      if (error) cb.reject(new Error(error));
      else cb.resolve(result);
    }
  };

  // Escuchar respuestas desde React Native
  document.addEventListener('message', function(e) {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'bridge_response') {
        window.egchat._onResponse(msg.id, msg.result, msg.error);
      }
    } catch {}
  });

  console.log('[EGChat Bridge] Listo ✅');
})();
true;
`;

export function MiniAppRuntime({
  url, title: initialTitle,
  userId, userName, userAvatar, userPhone,
  onPayment, onShareToChat, onClose,
}: MiniAppProps) {
  const webviewRef  = useRef<any>(null);
  const [title, setTitle] = useState(initialTitle);
  const [loading, setLoading]  = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const userInfo = { id: userId, name: userName, avatar: userAvatar, phone: userPhone };

  const sendResponse = useCallback((id: number, result: any, error?: string) => {
    webviewRef.current?.postMessage(JSON.stringify({ type: 'bridge_response', id, result, error }));
  }, []);

  const handleMessage = useCallback(async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type !== 'bridge_call') return;

      const { id, method, params } = msg;

      switch (method) {
        case 'pay':
          if (onPayment) {
            Alert.alert(
              '💳 Pago con EGChat',
              `${params.description}\nImporte: ${params.amount} ${params.currency}`,
              [
                { text: 'Cancelar', onPress: () => sendResponse(id, null, 'Cancelado') },
                { text: 'Pagar', onPress: () => { onPayment(params.amount, params.description); sendResponse(id, { success: true }); } },
              ]
            );
          } else sendResponse(id, null, 'Pagos no disponibles');
          break;

        case 'shareToChat':
          onShareToChat?.(params.content);
          sendResponse(id, { success: true });
          break;

        case 'getLocation': {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') { sendResponse(id, null, 'Permiso denegado'); break; }
          const loc = await Location.getCurrentPositionAsync({});
          sendResponse(id, { lat: loc.coords.latitude, lng: loc.coords.longitude });
          break;
        }

        case 'scanQR':
          router.push('/_qr-scanner' as any);
          sendResponse(id, { pending: true });
          break;

        case 'close':
          onClose?.();
          router.back();
          sendResponse(id, { success: true });
          break;

        case 'setTitle':
          setTitle(params.title || initialTitle);
          sendResponse(id, { success: true });
          break;

        case 'showToast':
          // El toast se muestra en la app nativa
          sendResponse(id, { success: true });
          break;

        default:
          sendResponse(id, null, `Método '${method}' no reconocido`);
      }
    } catch (e: any) {
      console.warn('[MiniApp Bridge] Error:', e.message);
    }
  }, [onPayment, onShareToChat, onClose, sendResponse, initialTitle]);

  if (!WebView) {
    return (
      <View style={s.root}>
        <View style={s.noWebView}>
          <Text style={s.noWebViewText}>
            Las mini-apps requieren una build nativa (EAS Build).{'\n'}
            No están disponibles en el navegador web.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Barra de título */}
      <LinearGradient colors={['#00b4e6', '#0088cc']} style={s.bar}>
        <SafeAreaView edges={['top']}>
          <View style={s.barRow}>
            <TouchableOpacity
              onPress={() => { if (canGoBack) webviewRef.current?.goBack(); else { onClose?.(); router.back(); } }}
              style={s.backBtn} hitSlop={10}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="19" y1="12" x2="5" y2="12"/>
                <Path d="M12 19l-7-7 7-7"/>
              </Svg>
            </TouchableOpacity>
            <Text style={s.barTitle} numberOfLines={1}>{title}</Text>
            <TouchableOpacity onPress={() => { onClose?.(); router.back(); }} style={s.closeBtn} hitSlop={10}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* WebView */}
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={s.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(nav: any) => setCanGoBack(nav.canGoBack)}
        onMessage={handleMessage}
        injectedJavaScript={createBridgeScript(userInfo)}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        // Sandbox de seguridad
        allowsLinkPreview={false}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
      />

      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#00c8a0" />
          <Text style={s.loadingText}>Cargando mini-app...</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  bar: { paddingBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4, gap: 10 },
  backBtn: { padding: 4, flexShrink: 0 },
  barTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  closeBtn: { padding: 4, flexShrink: 0 },
  closeTxt: { fontSize: 18, color: 'rgba(255,255,255,0.8)', fontWeight: '300' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  noWebView: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  noWebViewText: { textAlign: 'center', color: '#9ca3af', fontSize: 15, lineHeight: 22 },
});
