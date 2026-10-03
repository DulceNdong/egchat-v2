/**
 * EGChat — APNs VoIP Push sender
 *
 * Envía pushes VoIP directamente a APNs usando autenticación por token
 * (archivo .p8 + Key ID + Team ID). Esta es la única forma correcta de
 * enviar pushes al endpoint voip.sandbox/voip de APNs para usar CallKit.
 *
 * NUNCA usar APNs estándar (apns-push-type: alert) para llamadas VoIP.
 * Apple rechaza apps que usan VoIP pushes para cosas que no sean llamadas.
 *
 * Variables de entorno requeridas (en Supabase Dashboard → Edge Functions → Secrets):
 *   APNS_KEY_P8        — contenido del archivo AuthKey_XXXXXXXX.p8 (sin headers)
 *   APNS_KEY_ID        — 10 caracteres, p.ej. "ABC1234567"
 *   APNS_TEAM_ID       — 10 caracteres, p.ej. "XU6YD7ZJ2K"
 *   APNS_BUNDLE_ID     — p.ej. "com.jallzstores.egchat"
 *   APNS_ENV           — "production" | "sandbox"
 */

const APNS_HOST_PROD    = 'https://api.push.apple.com';
const APNS_HOST_SANDBOX = 'https://api.sandbox.push.apple.com';

interface APNsVoIPPayload {
  callId:       string;
  callerName:   string;
  callerAvatar?: string;
  callType:     'audio' | 'video';
  offer?:       object;
}

interface APNsResult {
  success: boolean;
  token:   string;   // últimos 8 chars — no el token completo
  error?:  string;
  code?:   string;
}

/**
 * Genera un JWT firmado para autenticación APNs (token-based auth).
 * Válido 60 minutos — renovar antes de expirar.
 */
async function generateAPNsJWT(
  keyP8: string,
  keyId: string,
  teamId: string,
): Promise<string> {
  const header  = { alg: 'ES256', kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  // Importar la clave privada EC P-256 del archivo .p8
  const keyData = keyP8
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${signingInput}.${signature}`;
}

/**
 * Envía un VoIP push a un token APNs específico.
 * Retorna el resultado sin lanzar excepciones para permitir manejo por lotes.
 */
export async function sendAPNsVoIPPush(
  deviceToken: string,
  payload:     APNsVoIPPayload,
): Promise<APNsResult> {
  const tokenSuffix = deviceToken.slice(-8);

  const keyP8    = Deno.env.get('APNS_KEY_P8');
  const keyId    = Deno.env.get('APNS_KEY_ID');
  const teamId   = Deno.env.get('APNS_TEAM_ID');
  const bundleId = Deno.env.get('APNS_BUNDLE_ID') || 'com.jallzstores.egchat';
  const env      = Deno.env.get('APNS_ENV')       || 'production';

  if (!keyP8 || !keyId || !teamId) {
    return {
      success: false,
      token:   tokenSuffix,
      error:   'APNs credentials not configured',
      code:    'NO_CREDENTIALS',
    };
  }

  try {
    const jwt  = await generateAPNsJWT(keyP8, keyId, teamId);
    const host = env === 'sandbox' ? APNS_HOST_SANDBOX : APNS_HOST_PROD;

    // Payload VoIP: minimalista por requisito Apple.
    // El módulo nativo (EGChatCallModule.swift) extrae callId, callerName, etc.
    const apnsPayload = {
      callId:       payload.callId,
      callerName:   payload.callerName,
      callerAvatar: payload.callerAvatar || '',
      callType:     payload.callType,
      offer:        payload.offer || null,
    };

    const response = await fetch(
      `${host}/3/device/${deviceToken}`,
      {
        method: 'POST',
        headers: {
          'authorization':  `bearer ${jwt}`,
          'apns-push-type': 'voip',                   // OBLIGATORIO para VoIP
          'apns-topic':     `${bundleId}.voip`,        // bundleId + .voip
          'apns-priority':  '10',                      // 10 = inmediato
          'apns-expiration': String(Math.floor(Date.now() / 1000) + 90), // 90s TTL
          'content-type':   'application/json',
        },
        body: JSON.stringify(apnsPayload),
      },
    );

    if (response.ok) {
      return { success: true, token: tokenSuffix };
    }

    const errorBody = await response.json().catch(() => ({})) as { reason?: string };
    const reason    = errorBody?.reason || `HTTP ${response.status}`;

    // Tokens inválidos/expirados
    const invalidTokenCodes = ['BadDeviceToken', 'Unregistered', 'MissingDeviceToken'];
    return {
      success: false,
      token:   tokenSuffix,
      error:   reason,
      code:    invalidTokenCodes.includes(reason) ? 'INVALID_TOKEN' : 'DELIVERY_FAILED',
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
