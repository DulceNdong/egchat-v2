/**
 * EGChat — FCM HTTP v1 sender
 *
 * Envía mensajes FCM usando la API HTTP v1 con autenticación OAuth 2.0
 * (Service Account). La API Legacy (server key) está deprecated desde 2024.
 *
 * Variables de entorno requeridas:
 *   FCM_SERVICE_ACCOUNT_JSON — contenido del JSON de Service Account de Firebase
 *   FCM_PROJECT_ID           — p.ej. "egchat-4efe7"
 *
 * IMPORTANTE para llamadas:
 *   - data-only message (sin notification key) con priority=high
 *   - El FirebaseMessagingService.kt lo recibe aunque la app esté terminada
 *   - NO usar notificaciones convencionales para llamadas — no se garantiza
 *     la entrega inmediata y no activan ConnectionService
 */

interface FCMCallPayload {
  callId:       string;
  callerName:   string;
  callerAvatar?: string;
  callType:     'audio' | 'video';
  offer?:       object;
}

interface FCMResult {
  success:    boolean;
  token:      string;   // últimos 8 chars
  messageId?: string;
  error?:     string;
  code?:      string;
}

/**
 * Obtiene un access token OAuth 2.0 desde las credenciales de Service Account.
 * Válido 3600s — en producción cachear para no regenerar en cada request.
 */
async function getFCMAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);

  const header  = { alg: 'RS256', typ: 'JWT' };
  const now     = Math.floor(Date.now() / 1000);
  const payload = {
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Importar clave privada RSA del Service Account
  const keyPem    = sa.private_key as string;
  const keyBody   = keyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sigBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = `${signingInput}.${sig}`;

  // Intercambiar JWT por access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`FCM OAuth failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json() as { access_token: string };
  return tokenData.access_token;
}

/**
 * Envía un FCM data-only message de alta prioridad para llamadas.
 * data-only = sin campo "notification" → EGChatFirebaseMessagingService lo procesa
 * directamente aunque la app esté terminada.
 */
export async function sendFCMCallPush(
  deviceToken: string,
  payload:     FCMCallPayload,
): Promise<FCMResult> {
  const tokenSuffix = deviceToken.slice(-8);

  const saJson    = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');
  const projectId = Deno.env.get('FCM_PROJECT_ID') || 'egchat-4efe7';

  if (!saJson) {
    return {
      success: false,
      token:   tokenSuffix,
      error:   'FCM service account not configured',
      code:    'NO_CREDENTIALS',
    };
  }

  try {
    const accessToken = await getFCMAccessToken(saJson);

    // Data-only message — todos los campos como strings (requisito FCM)
    const fcmMessage = {
      message: {
        token: deviceToken,
        // SIN campo "notification" — evita que el sistema muestre una notificación
        // automática antes de que FirebaseMessagingService la procese
        data: {
          notificationType: 'incoming_call',
          callId:           payload.callId,
          callerName:       payload.callerName,
          callerAvatar:     payload.callerAvatar || '',
          callType:         payload.callType,
          offer:            payload.offer ? JSON.stringify(payload.offer) : '',
        },
        android: {
          priority: 'HIGH',     // OBLIGATORIO para entrega en background/terminada
          ttl: '90s',
          direct_boot_ok: true,
        },
      },
    };

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(fcmMessage),
      },
    );

    if (response.ok) {
      const data = await response.json() as { name?: string };
      return { success: true, token: tokenSuffix, messageId: data.name };
    }

    const errorData = await response.json().catch(() => ({})) as {
      error?: { status?: string; message?: string }
    };
    const status  = errorData?.error?.status || `HTTP_${response.status}`;
    const message = errorData?.error?.message || 'Unknown error';

    const invalidTokenStatuses = ['UNREGISTERED', 'INVALID_ARGUMENT'];
    return {
      success: false,
      token:   tokenSuffix,
      error:   message,
      code:    invalidTokenStatuses.includes(status) ? 'INVALID_TOKEN' : 'DELIVERY_FAILED',
    };
  } catch (err) {
    return {
      success: false,
      token:   tokenSuffix,
      error:   err instanceof Error ? err.message : 'Unknown error',
      code:    'EXCEPTION',
    };
  }
}
