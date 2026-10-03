/**
 * EGChat — Edge Function: register-device-token
 *
 * Registra o actualiza el token push de un dispositivo.
 * Acepta tokens de tipo: expo | fcm | apns | voip
 *
 * Reemplaza el endpoint /api/push/register-expo-token del backend Render
 * con soporte completo para todos los tipos de token.
 *
 * Autenticación: Bearer token JWT del usuario (custom JWT de Render)
 *
 * Variables de entorno:
 *   SUPABASE_URL              — auto-inyectada
 *   SUPABASE_SERVICE_ROLE_KEY — auto-inyectada
 *   JWT_SECRET                — el mismo secreto usado por el backend Render
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegisterTokenRequest {
  token:      string;
  tokenType:  'expo' | 'fcm' | 'apns' | 'voip';
  platform:   'ios' | 'android';
  deviceId?:  string;
}

/** Verifica el JWT custom del backend Render */
async function verifyJWT(token: string, secret: string): Promise<{ id: string } | null> {
  try {
    // Verificación manual HMAC-SHA256 del JWT
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const sig = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0),
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      new TextEncoder().encode(signingInput),
    );

    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    // Verificar expiración
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { id: payload.id || payload.sub || payload.userId };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── Autenticación ─────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^bearer\s+/i, '');

  if (!bearerToken) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const jwtSecret = Deno.env.get('JWT_SECRET');
  if (!jwtSecret) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const user = await verifyJWT(bearerToken, jwtSecret);
  if (!user?.id) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── Parsear body ──────────────────────────────────────────────────
  let body: RegisterTokenRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { token, tokenType, platform, deviceId } = body;

  if (!token || !tokenType || !platform) {
    return new Response(
      JSON.stringify({ error: 'Required: token, tokenType, platform' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const validTypes = ['expo', 'fcm', 'apns', 'voip'];
  if (!validTypes.includes(tokenType)) {
    return new Response(
      JSON.stringify({ error: `tokenType must be one of: ${validTypes.join(', ')}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (token.length < 10 || token.length > 500) {
    return new Response(
      JSON.stringify({ error: 'Invalid token length' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── Registrar via RPC ─────────────────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('register_device_token', {
    p_user_id:    user.id,
    p_token:      token,
    p_token_type: tokenType,
    p_platform:   platform,
    p_device_id:  deviceId || null,
  });

  if (error) {
    console.error('[register-device-token] RPC error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to register token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, tokenType, platform }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
