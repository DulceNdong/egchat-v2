// Clave con la que la Edge Function escribe en la base.
// Las claves secretas nuevas llegan en SUPABASE_SECRET_KEYS (diccionario JSON);
// SUPABASE_SERVICE_ROLE_KEY desaparece cuando se desactivan las claves legacy.
export function serviceKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (raw) {
    try {
      const dict = JSON.parse(raw) as Record<string, string>;
      for (const value of Object.values(dict)) {
        if (typeof value === 'string' && value.startsWith('sb_secret_')) return value;
      }
    } catch {
      // diccionario mal formado: se usa la legacy
    }
  }
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!legacy) throw new Error('No hay clave secret ni service_role configurada en la Edge Function');
  return legacy;
}
