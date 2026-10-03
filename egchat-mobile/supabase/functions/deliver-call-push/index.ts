/**
 * EGChat — Edge Function: deliver-call-push
 *
 * Recibe una solicitud de llamada del backend Render y entrega
 * las notificaciones push al receptor usando el canal más adecuado:
 *   iOS  → APNs VoIP (PushKit) — única forma de activar CallKit con app cerrada
 *   Android → FCM data-only high-priority
 *   Fallback → Expo Push
 *
 * FLUJO:
 *   1. Validar token de servicio (solo el backend Render puede llamar esto)
 *   2. Obtener tokens del receptor via RPC get_call_delivery_tokens
 *   3. Para iOS: enviar VoIP push directo a APNs
 *   4. Para Android: enviar FCM data-only high-priority
 *   5. Registrar resultado en push_delivery_log
 *   6. Si hay tokens inválidos, marcarlos via mark_token_failed
 *   7. Devolver resultado detallado al backend Render
 *
 * Autenticación: header X-Service-Token (secreto compartido entre
 * Render y Supabase, NUNCA expuesto al cliente)
 *
 * Variables de entorno (Supabase Dashboard → Project → Edge Functions → Secrets):
 *   SUPABASE_URL              — auto-inyectada por Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-inyectada por Supabase
 *   SERVICE_TOKEN             — secreto compartido con Render
 *   APNS_KEY_P8               — clave privada APNs .p8 (sin headers BEGIN/END)
 *   APNS_KEY_ID               — Key ID de APNs (10 chars)
 *   APNS_TEAM_ID              — Team ID de Apple Developer (10 chars)
 *   APNS_BUNDLE_ID            — Bundle ID de la app (com.jallzstores.egchat)
 *   APNS_ENV                  — "production" | "sandbox"
 *   FCM_SERVICE_ACCOUNT_JSON  — JSON completo del Service Account de Firebase
 *   FCM_PROJECT_ID            — ID del proyecto Firebase
 *   EXPO_ACCESS_TOKEN         — token Expo para enviar via Expo Push (opcional, fallback)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendAPNsVoIPPush } from '../_shared/apns.ts';
import { sendFCMCallPush   } from '../_shared/fcm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-service-token',
};

interface DeliverCallPushRequest {
  callId:        string;
  callerId:      string;
  callerName:    string;
  callerAvatar?: string;
  calleeId:      string;
  callType:      'audio' | 'video';
  offer?:        object;
}

interface DeliveryResult {
  channel:  string;
  platform: string;
  success:  boolean;
  code?:    string;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // ── 1. Autenticación de servicio ─────────────────────────────────
  // Solo el backend Render puede llamar esta función.
  // NUNCA exponer al cliente JavaScript.
  const serviceToken    = req.headers.get('x-service-token');
  const expectedToken   = Deno.env.get('SERVICE_TOKEN');

  if (!expectedToken || serviceToken !== expectedToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── 2. Parsear y validar body ────────────────────────────────────
  let body: DeliverCallPushRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const { callId, callerId, callerName, callerAvatar, calleeId, callType, offer } = body;

  if (!callId || !callerId || !calleeId || !callerName) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: callId, callerId, callerName, calleeId' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── 3. Supabase con service_role ─────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // ── 4. Validar llamante y destinatario ───────────────────────────
  const [callerCheck, calleeCheck] = await Promise.all([
    supabase.from('users').select('id').eq('id', callerId).single(),
    supabase.from('users').select('id').eq('id', calleeId).single(),
  ]);

  if (callerCheck.error || !callerCheck.data) {
    return new Response(
      JSON.stringify({ error: 'Caller not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  if (calleeCheck.error || !calleeCheck.data) {
    return new Response(
      JSON.stringify({ error: 'Callee not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // ── 5. Obtener tokens del receptor ───────────────────────────────
  const { data: tokens, error: tokensError } = await supabase
    .rpc('get_call_delivery_tokens', { p_user_id: calleeId });

  if (tokensError) {
    console.error('[deliver-call-push] get_call_delivery_tokens error:', tokensError.message);
    return new Response(
      JSON.stringify({ error: 'Failed to get device tokens', details: tokensError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const voipTokens: Array<{ token: string; device_id?: string }> = tokens?.voip  || [];
  const fcmTokens:  Array<{ token: string; device_id?: string }> = tokens?.fcm   || [];
  const expoTokens: Array<{ token: string; device_id?: string }> = tokens?.expo  || [];

  const hasAnyToken = voipTokens.length + fcmTokens.length + expoTokens.length > 0;

  if (!hasAnyToken) {
    // Registrar intento sin token
    await supabase.from('push_delivery_log').insert({
      call_id:  callId,
      user_id:  calleeId,
      channel:  'none',
      status:   'no_token',
      platform: 'unknown',
      attempt:  1,
    });

    return new Response(
      JSON.stringify({ delivered: false, reason: 'no_registered_tokens', results: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const callPayload = { callId, callerName, callerAvatar, callType, offer };
  const results: DeliveryResult[] = [];
  const deliveryLogEntries: object[] = [];

  // ── 6a. iOS — APNs VoIP (canal prioritario) ──────────────────────
  for (const { token } of voipTokens) {
    const result = await sendAPNsVoIPPush(token, callPayload);
    results.push({ channel: 'voip', platform: 'ios', success: result.success, code: result.code });

    deliveryLogEntries.push({
      call_id:      callId,
      user_id:      calleeId,
      token_suffix: token.slice(-8),
      token_type:   'voip',
      platform:     'ios',
      channel:      'voip',
      status:       result.success ? 'sent' : (result.code === 'INVALID_TOKEN' ? 'invalid_token' : 'failed'),
      error_code:   result.code || null,
      attempt:      1,
    });

    // Invalidar token si APNs lo reporta como inválido
    if (!result.success && result.code === 'INVALID_TOKEN') {
      await supabase.rpc('mark_token_failed', { p_token: token, p_error_code: result.code });
    }
  }

  // ── 6b. Android — FCM data-only high-priority ─────────────────────
  for (const { token } of fcmTokens) {
    const result = await sendFCMCallPush(token, callPayload);
    results.push({ channel: 'fcm', platform: 'android', success: result.success, code: result.code });

    deliveryLogEntries.push({
      call_id:      callId,
      user_id:      calleeId,
      token_suffix: token.slice(-8),
      token_type:   'fcm',
      platform:     'android',
      channel:      'fcm',
      status:       result.success ? 'sent' : (result.code === 'INVALID_TOKEN' ? 'invalid_token' : 'failed'),
      error_code:   result.code || null,
      attempt:      1,
    });

    if (!result.success && result.code === 'INVALID_TOKEN') {
      await supabase.rpc('mark_token_failed', { p_token: token, p_error_code: result.code });
    }
  }

  // ── 6c. Expo Push — fallback para tokens no migrados ─────────────
  // Solo enviar si NO hay voip/fcm con éxito (para no duplicar en iOS/Android)
  const iosDelivered     = results.some(r => r.channel === 'voip'  && r.success);
  const androidDelivered = results.some(r => r.channel === 'fcm'   && r.success);

  const expoToSend = expoTokens.filter(({ token }) => {
    const isIosExpo     = token.startsWith('ExponentPushToken') && !iosDelivered;
    const isAndroidExpo = token.startsWith('ExponentPushToken') && !androidDelivered;
    return isIosExpo || isAndroidExpo;
  });

  if (expoToSend.length > 0) {
    const expoMessages = expoToSend.map(({ token }) => ({
      to:        token,
      title:     callType === 'video' ? `📹 Videollamada de ${callerName}` : `📞 Llamada de ${callerName}`,
      body:      callType === 'video' ? 'Toca para responder la videollamada' : 'Toca para responder',
      sound:     'default',
      channelId: 'egchat-calls',
      priority:  'high',
      ttl:       90,
      data: {
        notificationType: 'incoming_call',
        callId,
        callerName,
        callerAvatar:  callerAvatar || '',
        callType,
        offer:         offer ? JSON.stringify(offer) : '',
      },
    }));

    try {
      const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
          ...(Deno.env.get('EXPO_ACCESS_TOKEN')
            ? { 'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}` }
            : {}),
        },
        body: JSON.stringify(expoMessages),
      });

      const expoData = await expoRes.json() as { data?: Array<{ status: string; details?: { error?: string } }> };

      (expoData.data || []).forEach((r, idx) => {
        const token = expoToSend[idx]?.token || '';
        const ok    = r.status === 'ok';
        results.push({ channel: 'expo', platform: 'unknown', success: ok });

        deliveryLogEntries.push({
          call_id:      callId,
          user_id:      calleeId,
          token_suffix: token.slice(-8),
          token_type:   'expo',
          platform:     'unknown',
          channel:      'expo',
          status:       ok ? 'sent' : (r.details?.error === 'DeviceNotRegistered' ? 'invalid_token' : 'failed'),
          error_code:   r.details?.error || null,
          attempt:      1,
        });

        if (!ok && r.details?.error === 'DeviceNotRegistered') {
          supabase.rpc('mark_token_failed', { p_token: token }).catch(() => {});
        }
      });
    } catch (expoErr) {
      console.error('[deliver-call-push] Expo push error:', expoErr);
    }
  }

  // ── 7. Guardar log de entregas ────────────────────────────────────
  if (deliveryLogEntries.length > 0) {
    await supabase.from('push_delivery_log').insert(deliveryLogEntries);
  }

  // ── 8. Respuesta ─────────────────────────────────────────────────
  const anySuccess = results.some(r => r.success);

  return new Response(
    JSON.stringify({
      delivered:       anySuccess,
      results_summary: {
        voip_sent:  results.filter(r => r.channel === 'voip' && r.success).length,
        fcm_sent:   results.filter(r => r.channel === 'fcm'  && r.success).length,
        expo_sent:  results.filter(r => r.channel === 'expo' && r.success).length,
        failed:     results.filter(r => !r.success).length,
      },
      // No incluir tokens ni detalles de error con PII en la respuesta
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
