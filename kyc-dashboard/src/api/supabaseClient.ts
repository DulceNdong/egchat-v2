/**
 * Cliente Supabase para el dashboard de monetización.
 * Lee directo de las tablas de monetizacion_* con la service role key
 * (solo disponible en el dashboard admin — nunca exponer en la app móvil).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no definidos. ' +
    'Añádelos al .env del kyc-dashboard.'
  );
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');
