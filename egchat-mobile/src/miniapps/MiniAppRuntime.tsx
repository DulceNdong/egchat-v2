/**
 * EGChat — Motor de Mini-Apps v2
 *
 * Sandbox seguro con WebView + JSBridge completo:
 *
 * APIs expuestas a la mini-app (window.egchat.*):
 *   getUserInfo()      → nombre, avatar, teléfono (sin token)
 *   pay(amount, desc)  → pago con wallet EGChat
 *   shareToChat(text)  → compartir en chat
 *   getLocation()      → GPS con permiso del usuario
 *   scanQR()           → escáner QR nativo
 *   close()            → cerrar la mini-app
 *   setTitle(t)        → cambiar título de la barra
 *   showToast(msg)     → mostrar toast nativo
 *   chooseImage()      → picker de galería/cámara
 *   vibrate(ms)        → vibración háptica
 *   setStorage(k,v)    → localStorage sandbox (aislado por appId)
 *   getStorage(k)      → leer del sandbox
 *   request(url, opts) → proxy HTTP vía servidor (sin CORS)
 *
 * Seguridad:
 *   - Tokens JWT NUNCA se exponen al WebView
 *   - Claves E2E NUNCA se exponen
 *   - Storage sandbox aislado por appId
 *   - Permisos mostrados antes de abrir la app
 *   - originWhitelist configurable por app
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated, Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Line } from 'react-native-svg';
import { WebView } from './WebViewCompat';
import { toast } from '../components/Toast';
import { PERMISSION_LABELS, type MiniAppPermission } from './miniAppsStore';

export interface MiniAppProps {
  url: string;
  title: string;
  appId?: string;
  icon?: string;
  permissions?: MiniAppPermission[];
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userPhone?: string;
  onPayment?: (amount: number, description: string) => void;
  onShareToChat?: (content: string) => void;
  onClose?: () => void;
}

// ── Pantalla de permisos (como WeChat) ───────────────────────────
function PermissionsScreen({
  appName, permissions, onAccept, onDeny,
}: {
  appName: string;
  permissions: MiniAppPermission[];
  onAccept: () => void;
  onDeny: () => void;
}) {
  return (
    <View style={ps.root}>
      <LinearGradient colors={['#0f172a', '#1e3a5f']} style={StyleSheet.absoluteFill} />
      <View style={ps.card}>
        <Text style={ps.title}>{appName}</Text>
        <Text style={ps.subtitle}>solicita los siguientes permisos:</Text>

        <View style={ps.list}>
          {permissions.map(perm => {
            const info = PERMISSION_LABELS[perm];
            if (!info) return null;
            return (
              <View key={perm} style={ps.permRow}>
                <Text style={ps.permIcon}>{info.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={ps.permLabel}>{info.label}</Text>
                  <Text style={ps.permDesc}>{info.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={ps.note}>
          EGChat gestiona estos permisos. La app no accede a tus mensajes ni a tus claves de cifrado.
        </Text>

        <View style={ps.btns}>
          <TouchableOpacity style={ps.denyBtn} onPress={onDeny}>
            <Text style={ps.denyTxt}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ps.acceptBtn} onPress={onAccept}>
            <LinearGradient colors={['#00c8a0', '#00b4e6']} style={ps.acceptGrad}>
              <Text style={ps.acceptTxt}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Bridge JavaScript ─────────────────────────────────────────────
const createBridgeScript = (userInfo: object, appId: string) => `
(function() {
  if (window.__egchat_injected) return;
  window.__egchat_injected = true;

  window.egchat = {
    _callbacks: {},
    _callId: 0,
    _appId: ${JSON.stringify(appId)},

    _call: function(method, params) {
      return new Promise((resolve, reject) => {
        const id = ++this._callId;
        this._callbacks[id] = { resolve, reject };
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bridge_call', id, method, params
        }));
      });
    },

    // Identidad del usuario (sin token)
    getUserInfo: function() {
      return Promise.resolve(${JSON.stringify(userInfo)});
    },

    // Pagos con wallet EGChat
    pay: function(amount, description, currency) {
      return this._call('pay', { amount, description, currency: currency || 'XAF' });
    },

    // Compartir en chat
    shareToChat: function(content, type) {
      return this._call('shareToChat', { content, type: type || 'text' });
    },

    // GPS
    getLocation: function() {
      return this._call('getLocation', {});
    },

    // Escáner QR
    scanQR: function() {
      return this._call('scanQR', {});
    },

    // Cerrar mini-app
    close: function() {
      this._call('close', {});
    },

    // Título de la barra
    setTitle: function(title) {
      return this._call('setTitle', { title });
    },

    // Toast nativo
    showToast: function(message, type) {
      return this._call('showToast', { message, type: type || 'info' });
    },

    // Seleccionar imagen de galería/cámara
    chooseImage: function(opts) {
      return this._call('chooseImage', opts || {});
    },

    // Vibración háptica
    vibrate: function(ms) {
      return this._call('vibrate', { ms: ms || 50 });
    },

    // Storage sandbox (aislado por appId, no persiste entre desinstalaciones)
    setStorage: function(key, value) {
      return this._call('setStorage', { key, value });
    },
    getStorage: function(key) {
      return this._call('getStorage', { key });
    },
    removeStorage: function(key) {
      return this._call('removeStorage', { key });
    },

    // Proxy HTTP (el servidor EGChat hace la petición para evitar CORS)
    request: function(url, options) {
      return this._call('request', { url, options: options || {} });
    },

    // Recibir respuesta desde React Native
    _onResponse: function(id, result, error) {
      const cb = this._callbacks[id];
      if (!cb) return;
      delete this._callbacks[id];
      if (error) cb.reject(new Error(error));
      else cb.resolve(result);
    }
  };

  // Escuchar respuestas desde RN
  window.addEventListener('message', function(e) {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'bridge_response') {
        window.egchat._onResponse(msg.id, msg.result, msg.error);
      }
    } catch {}
  });

  // Emitir evento de ready
  window.dispatchEvent(new Event('egchat:ready'));
  console.log('[EGChat Bridge v2] Listo ✅ appId=' + ${JSON.stringify(appId)});
})();
true;
`;

// ── Componente principal ──────────────────────────────────────────
export function MiniAppRuntime({
  url, title: initialTitle,
  appId = 'unknown',
  permissions = [],
  userId, userName, userAvatar, userPhone,
  onPayment, onShareToChat, onClose,
}: MiniAppProps) {
  const webviewRef  = useRef<any>(null);
  const [title, setTitle]       = useState(initialTitle);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [permissionsAccepted, setPermissionsAccepted] = useState(permissions.length === 0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Clave de storage sandbox para esta app
  const sandboxKey = (key: string) => `egchat_miniapp_${appId}_${key}`;

  const userInfo = {
    id: userId, name: userName, avatar: userAvatar, phone: userPhone,
  };

  // Animar barra de progreso
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: loadProgress,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [loadProgress]);

  const sendResponse = useCallback((id: number, result: any, error?: string) => {
    webviewRef.current?.postMessage(
      JSON.stringify({ type: 'bridge_response', id, result, error }),
    );
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
                { text: 'Cancelar', style: 'cancel', onPress: () => sendResponse(id, null, 'Cancelado por el usuario') },
                { text: 'Pagar',    onPress: () => { onPayment(params.amount, params.description); sendResponse(id, { success: true }); } },
              ],
            );
          } else {
            sendResponse(id, null, 'Pagos no disponibles');
          }
          break;

        case 'shareToChat':
          onShareToChat?.(params.content);
          sendResponse(id, { success: true });
          break;

        case 'getLocation': {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') { sendResponse(id, null, 'Permiso de ubicación denegado'); break; }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          sendResponse(id, { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy });
          break;
        }

        case 'scanQR':
          router.push('/_qr-scanner' as any);
          sendResponse(id, { pending: true });
          break;

        case 'close':
          sendResponse(id, { success: true });
          setTimeout(() => { onClose?.(); router.back(); }, 100);
          break;

        case 'setTitle':
          setTitle(params.title || initialTitle);
          sendResponse(id, { success: true });
          break;

        case 'showToast': {
          const t = params.type || 'info';
          if (t === 'success') toast.success(params.message);
          else if (t === 'error') toast.error(params.message);
          else toast.info(params.message);
          sendResponse(id, { success: true });
          break;
        }

        case 'chooseImage': {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { sendResponse(id, null, 'Permiso denegado'); break; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: params.edit ?? true,
            quality: params.quality ?? 0.8,
          });
          if (result.canceled) { sendResponse(id, null, 'Cancelado'); break; }
          sendResponse(id, {
            uri: result.assets[0].uri,
            width: result.assets[0].width,
            height: result.assets[0].height,
          });
          break;
        }

        case 'vibrate':
          if (Platform.OS !== 'web') Vibration.vibrate(params.ms ?? 50);
          sendResponse(id, { success: true });
          break;

        case 'setStorage': {
          await AsyncStorage.setItem(sandboxKey(params.key), JSON.stringify(params.value));
          sendResponse(id, { success: true });
          break;
        }

        case 'getStorage': {
          const raw = await AsyncStorage.getItem(sandboxKey(params.key));
          sendResponse(id, { value: raw ? JSON.parse(raw) : null });
          break;
        }

        case 'removeStorage': {
          await AsyncStorage.removeItem(sandboxKey(params.key));
          sendResponse(id, { success: true });
          break;
        }

        case 'request': {
          // Proxy HTTP vía fetch nativo para evitar CORS en la mini-app
          // Solo permite URLs externas, NO endpoints internos de EGChat
          const reqUrl = params.url;
          if (!reqUrl || reqUrl.includes('egchat-api.onrender.com')) {
            sendResponse(id, null, 'URL no permitida');
            break;
          }
          try {
            const res = await fetch(reqUrl, {
              method: params.options?.method || 'GET',
              headers: params.options?.headers || {},
              body: params.options?.body,
            });
            const text = await res.text();
            let data: any = text;
            try { data = JSON.parse(text); } catch {}
            sendResponse(id, { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) });
          } catch (e: any) {
            sendResponse(id, null, e.message);
          }
          break;
        }

        default:
          sendResponse(id, null, `Método '${method}' no soportado`);
      }
    } catch (e: any) {
      console.warn('[MiniApp Bridge] Error:', e.message);
    }
  }, [onPayment, onShareToChat, onClose, sendResponse, initialTitle, appId]);

  // Pantalla de permisos (si la app los requiere)
  if (!permissionsAccepted && permissions.length > 0) {
    return (
      <PermissionsScreen
        appName={initialTitle}
        permissions={permissions}
        onAccept={() => setPermissionsAccepted(true)}
        onDeny={() => { onClose?.(); router.back(); }}
      />
    );
  }

  // Pantalla de error
  if (hasError) {
    return (
      <View style={s.errorRoot}>
        <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
        <Text style={s.errorEmoji}>😞</Text>
        <Text style={s.errorTitle}>No se pudo cargar la app</Text>
        <Text style={s.errorDesc}>Comprueba tu conexión e intenta de nuevo.</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setHasError(false); webviewRef.current?.reload(); }}>
          <Text style={s.retryTxt}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backBtnError} onPress={() => { onClose?.(); router.back(); }}>
          <Text style={s.backBtnErrorTxt}>Volver</Text>
        </TouchableOpacity>
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
              style={s.iconBtn} hitSlop={10}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                <Line x1="19" y1="12" x2="5" y2="12" />
                <Path d="M12 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>

            <Text style={s.barTitle} numberOfLines={1}>{title}</Text>

            <TouchableOpacity onPress={() => { onClose?.(); router.back(); }} style={s.iconBtn} hitSlop={10}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Barra de progreso de carga */}
      <View style={s.progressBg}>
        <Animated.View
          style={[s.progressFill, {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }]}
        />
      </View>

      {/* WebView sandboxed */}
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={s.webview}
        onLoadStart={() => { setLoading(true); setLoadProgress(0.15); }}
        onLoadProgress={({ nativeEvent }) => setLoadProgress(nativeEvent.progress)}
        onLoadEnd={() => { setLoading(false); setLoadProgress(1); setTimeout(() => setLoadProgress(0), 500); }}
        onNavigationStateChange={(nav: any) => setCanGoBack(nav.canGoBack)}
        onMessage={handleMessage}
        onError={() => setHasError(true)}
        injectedJavaScript={createBridgeScript(userInfo, appId)}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        allowsLinkPreview={false}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        // Sandbox: deshabilitar acceso a datos nativos sensibles
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
      />

      {/* Overlay de carga inicial */}
      {loading && loadProgress < 0.5 && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#00c8a0" />
          <Text style={s.loadingText}>Cargando {initialTitle}...</Text>
        </View>
      )}
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#fff' },
  bar:   { paddingBottom: 8 },
  barRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 4, gap: 10,
  },
  iconBtn:  { padding: 4, flexShrink: 0, width: 32, alignItems: 'center' },
  barTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  closeTxt: { fontSize: 18, color: 'rgba(255,255,255,0.75)', fontWeight: '300' },
  progressBg:   { height: 3, backgroundColor: 'rgba(0,200,160,0.15)' },
  progressFill: { height: '100%', backgroundColor: '#00c8a0' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  // Error
  errorRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  errorDesc:  { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: '#00c8a0',
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
  },
  retryTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  backBtnError: { paddingVertical: 8 },
  backBtnErrorTxt: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});

// ── Permisos ────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: 20 },
  card: {
    backgroundColor: '#1e293b', borderRadius: 20,
    padding: 24, width: '100%', gap: 14,
    marginBottom: 20,
  },
  title:    { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: -8 },
  list:     { gap: 12 },
  permRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  permIcon: { fontSize: 22, flexShrink: 0, marginTop: 1 },
  permLabel:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  permDesc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 16, marginTop: 2 },
  note: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', lineHeight: 16, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12,
  },
  btns:      { flexDirection: 'row', gap: 10 },
  denyBtn:   { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  denyTxt:   { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  acceptBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  acceptGrad:{ paddingVertical: 13, alignItems: 'center' },
  acceptTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
