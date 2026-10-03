-- ============================================================
-- EGCHAT MONETIZACIÓN - Setup completo de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- -------------------------
-- 1. EMPRESAS DE SERVICIOS
-- -------------------------
CREATE TABLE IF NOT EXISTS monetizacion_empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  responsable TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  tipo_servicio TEXT DEFAULT 'general', -- general, supermercado, farmacia, restaurante, etc.
  cuota_mensual DECIMAL(12,2) NOT NULL DEFAULT 0,
  comision_pct DECIMAL(5,2) NOT NULL DEFAULT 1.5, -- % sobre ventas
  total_ventas_mes DECIMAL(12,2) DEFAULT 0,
  estado_pago TEXT DEFAULT 'pendiente', -- pagado, pendiente, vencido
  activa BOOLEAN DEFAULT true,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingresos por empresa (cuotas + comisiones)
CREATE TABLE IF NOT EXISTS monetizacion_empresa_ingresos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES monetizacion_empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- cuota_mensual, comision_venta
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  mes INT NOT NULL,
  anio INT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- 2. TAXIS
-- -------------------------
CREATE TABLE IF NOT EXISTS monetizacion_taxistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  num_licencia TEXT NOT NULL UNIQUE,
  num_matricula TEXT,
  marca_vehiculo TEXT,
  modelo_vehiculo TEXT,
  anio_vehiculo INT,
  color_vehiculo TEXT,
  foto_url TEXT,
  -- Documentación
  fecha_venc_carnet DATE,
  fecha_venc_seguro DATE,
  fecha_venc_revision_tecnica DATE,
  fecha_venc_permiso_operacion DATE,
  -- Stats
  total_viajes_mes INT DEFAULT 0,
  horas_activo_mes DECIMAL(8,2) DEFAULT 0,
  -- Estado
  activo BOOLEAN DEFAULT true,
  verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viajes de taxistas
CREATE TABLE IF NOT EXISTS monetizacion_taxista_viajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  taxista_id UUID REFERENCES monetizacion_taxistas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  origen TEXT,
  destino TEXT,
  distancia_km DECIMAL(8,2),
  duracion_min INT,
  monto_viaje DECIMAL(12,2) NOT NULL,
  comision_pct DECIMAL(5,2) DEFAULT 5.0,
  comision_monto DECIMAL(12,2) GENERATED ALWAYS AS (monto_viaje * comision_pct / 100) STORED,
  estado TEXT DEFAULT 'completado', -- completado, cancelado, reembolsado
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Horas activas de taxistas
CREATE TABLE IF NOT EXISTS monetizacion_taxista_horas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  taxista_id UUID REFERENCES monetizacion_taxistas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  horas DECIMAL(5,2) NOT NULL,
  inicio TIMESTAMPTZ,
  fin TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- 3. BARCOS / TRANSPORTE MARÍTIMO
-- -------------------------
CREATE TABLE IF NOT EXISTS monetizacion_barcos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_operador TEXT NOT NULL,
  nombre_barco TEXT NOT NULL,
  matricula TEXT UNIQUE,
  ruta TEXT NOT NULL, -- ej: "Malabo - Bata"
  origen TEXT,
  destino TEXT,
  capacidad_pasajeros INT DEFAULT 0,
  precio_billete_base DECIMAL(12,2) DEFAULT 0,
  horario TEXT, -- JSON string con horarios
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billetes vendidos
CREATE TABLE IF NOT EXISTS monetizacion_billetes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barco_id UUID REFERENCES monetizacion_barcos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  num_pasajeros INT DEFAULT 1,
  monto_total DECIMAL(12,2) NOT NULL,
  comision_pct DECIMAL(5,2) DEFAULT 1.0,
  comision_monto DECIMAL(12,2) GENERATED ALWAYS AS (monto_total * comision_pct / 100) STORED,
  fecha_viaje DATE,
  estado TEXT DEFAULT 'vendido', -- vendido, cancelado, usado
  referencia TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- 4. MONEDERO - MOVIMIENTOS
-- -------------------------
CREATE TABLE IF NOT EXISTS monetizacion_wallet_movimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- recarga_banco, retiro_banco, recarga_otro
  monto DECIMAL(12,2) NOT NULL,
  comision_pct DECIMAL(5,2) DEFAULT 0.5,
  comision_monto DECIMAL(12,2) GENERATED ALWAYS AS (monto * comision_pct / 100) STORED,
  banco TEXT,
  referencia TEXT,
  estado TEXT DEFAULT 'completado', -- completado, pendiente, fallido
  fecha TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- 5. RESUMEN MENSUAL
-- -------------------------
CREATE TABLE IF NOT EXISTS monetizacion_resumen_mensual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL, -- empresas, taxis, barcos, wallet, otros
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INT NOT NULL,
  total_comisiones DECIMAL(12,2) DEFAULT 0,
  total_cuotas DECIMAL(12,2) DEFAULT 0,
  total_ingresos DECIMAL(12,2) DEFAULT 0,
  num_transacciones INT DEFAULT 0,
  actualizado_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(categoria, mes, anio)
);

-- -------------------------
-- 6. PERFILES FINANCIEROS USUARIOS
-- -------------------------
CREATE TABLE IF NOT EXISTS perfiles_financieros_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nombre_completo TEXT,
  score_financiero INT DEFAULT 0 CHECK (score_financiero BETWEEN 0 AND 100),
  -- Actividad
  total_movido DECIMAL(14,2) DEFAULT 0,
  num_transacciones INT DEFAULT 0,
  monto_promedio_mensual DECIMAL(12,2) DEFAULT 0,
  meses_activo INT DEFAULT 0,
  -- Tipos de uso
  usa_taxi BOOLEAN DEFAULT false,
  usa_barcos BOOLEAN DEFAULT false,
  usa_servicios BOOLEAN DEFAULT false,
  usa_wallet BOOLEAN DEFAULT false,
  -- Fechas
  primera_transaccion TIMESTAMPTZ,
  ultima_transaccion TIMESTAMPTZ,
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de transacciones de usuarios (vista consolidada)
CREATE TABLE IF NOT EXISTS historial_transacciones_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- taxi, barco, servicio, wallet_recarga, wallet_retiro
  referencia_id UUID, -- id en la tabla de origen
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  estado TEXT DEFAULT 'completado',
  fecha TIMESTAMPTZ DEFAULT NOW(),
  mes INT GENERATED ALWAYS AS (EXTRACT(MONTH FROM fecha AT TIME ZONE 'UTC')::INT) STORED,
  anio INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM fecha AT TIME ZONE 'UTC')::INT) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- 7. PERFILES FINANCIEROS NEGOCIOS
-- -------------------------
CREATE TABLE IF NOT EXISTS perfiles_financieros_negocios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES monetizacion_empresas(id) ON DELETE CASCADE UNIQUE,
  razon_social TEXT NOT NULL,
  nif TEXT, -- Número de identificación fiscal
  sector TEXT,
  score_financiero INT DEFAULT 0 CHECK (score_financiero BETWEEN 0 AND 100),
  -- Métricas
  facturacion_mensual_promedio DECIMAL(12,2) DEFAULT 0,
  facturacion_total DECIMAL(14,2) DEFAULT 0,
  meses_operacion INT DEFAULT 0,
  num_transacciones_total INT DEFAULT 0,
  -- Estado
  servicios_activos TEXT[], -- array de servicios
  ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial transacciones negocios
CREATE TABLE IF NOT EXISTS historial_transacciones_negocios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES monetizacion_empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- venta, cuota_mensual, comision
  descripcion TEXT,
  monto DECIMAL(12,2) NOT NULL,
  comision DECIMAL(12,2) DEFAULT 0,
  estado TEXT DEFAULT 'completado',
  fecha TIMESTAMPTZ DEFAULT NOW(),
  mes INT GENERATED ALWAYS AS (EXTRACT(MONTH FROM fecha)::INT) STORED,
  anio INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM fecha)::INT) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista de ingresos totales por mes
CREATE OR REPLACE VIEW v_ingresos_mensuales AS
SELECT
  mes, anio,
  SUM(total_ingresos) AS total_general,
  SUM(CASE WHEN categoria = 'empresas' THEN total_ingresos ELSE 0 END) AS ingresos_empresas,
  SUM(CASE WHEN categoria = 'taxis' THEN total_ingresos ELSE 0 END) AS ingresos_taxis,
  SUM(CASE WHEN categoria = 'barcos' THEN total_ingresos ELSE 0 END) AS ingresos_barcos,
  SUM(CASE WHEN categoria = 'wallet' THEN total_ingresos ELSE 0 END) AS ingresos_wallet
FROM monetizacion_resumen_mensual
GROUP BY mes, anio
ORDER BY anio DESC, mes DESC;

-- Vista de taxistas con estado de documentación
CREATE OR REPLACE VIEW v_taxistas_documentacion AS
SELECT
  t.*,
  CASE
    WHEN t.fecha_venc_carnet < CURRENT_DATE THEN 'vencido'
    WHEN t.fecha_venc_carnet < CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    ELSE 'vigente'
  END AS estado_carnet,
  CASE
    WHEN t.fecha_venc_seguro < CURRENT_DATE THEN 'vencido'
    WHEN t.fecha_venc_seguro < CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    ELSE 'vigente'
  END AS estado_seguro,
  CASE
    WHEN t.fecha_venc_revision_tecnica < CURRENT_DATE THEN 'vencido'
    WHEN t.fecha_venc_revision_tecnica < CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    ELSE 'vigente'
  END AS estado_revision,
  COALESCE(SUM(v.comision_monto), 0) AS comisiones_mes_actual
FROM monetizacion_taxistas t
LEFT JOIN monetizacion_taxista_viajes v ON v.taxista_id = t.id
  AND EXTRACT(MONTH FROM v.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM v.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY t.id;

-- ============================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================

ALTER TABLE monetizacion_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_empresa_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_taxistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_taxista_viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_taxista_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_barcos ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_billetes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_wallet_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE monetizacion_resumen_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_financieros_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_financieros_negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_transacciones_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_transacciones_negocios ENABLE ROW LEVEL SECURITY;

-- Solo admins (rol 'admin' en user_metadata) pueden ver todo
CREATE POLICY "admin_all_monetizacion_empresas" ON monetizacion_empresas
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_all_taxistas" ON monetizacion_taxistas
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_all_barcos" ON monetizacion_barcos
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Usuarios ven su propio historial
CREATE POLICY "user_own_historial" ON historial_transacciones_usuarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_own_perfil" ON perfiles_financieros_usuarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_own_wallet" ON monetizacion_wallet_movimientos
  FOR SELECT USING (auth.uid() = user_id);

-- Taxistas ven sus propios viajes
CREATE POLICY "taxista_own_viajes" ON monetizacion_taxista_viajes
  FOR SELECT USING (
    taxista_id IN (
      SELECT id FROM monetizacion_taxistas WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- DATOS DE DEMO (comentar en producción)
-- ============================================================

-- Empresas demo
INSERT INTO monetizacion_empresas (nombre, responsable, email, tipo_servicio, cuota_mensual, comision_pct, estado_pago) VALUES
  ('Supermercados BM Malabo', 'Carlos Ngema', 'c.ngema@bm.gq', 'supermercado', 150000, 1.5, 'pagado'),
  ('Farmacia Central GE', 'María Esono', 'm.esono@farmacia.gq', 'farmacia', 80000, 1.5, 'pagado'),
  ('Restaurante El Patio', 'José Mba', 'j.mba@elpatio.gq', 'restaurante', 60000, 1.5, 'pendiente'),
  ('Hotel Paraíso', 'Ana Nze', 'a.nze@hotel.gq', 'hotel', 200000, 1.5, 'pagado'),
  ('Telecomunicaciones GETESA', 'Pedro Abeso', 'p.abeso@getesa.gq', 'telecomunicaciones', 500000, 1.5, 'pagado'),
  ('Clínica San Carlos', 'Dr. Nguema', 'dr.nguema@clinica.gq', 'salud', 120000, 1.5, 'vencido'),
  ('Agencia Viajes Bioko', 'Rosa Eyama', 'r.eyama@bioko.gq', 'viajes', 90000, 1.5, 'pendiente')
ON CONFLICT DO NOTHING;

-- Resumen mensual demo
INSERT INTO monetizacion_resumen_mensual (categoria, mes, anio, total_comisiones, total_cuotas, total_ingresos, num_transacciones) VALUES
  ('empresas', 9, 2026, 245000, 1200000, 1445000, 342),
  ('taxis', 9, 2026, 387000, 0, 387000, 1240),
  ('barcos', 9, 2026, 156000, 0, 156000, 89),
  ('wallet', 9, 2026, 78500, 0, 78500, 2100),
  ('empresas', 8, 2026, 230000, 1200000, 1430000, 318),
  ('taxis', 8, 2026, 360000, 0, 360000, 1150),
  ('barcos', 8, 2026, 142000, 0, 142000, 81),
  ('wallet', 8, 2026, 72000, 0, 72000, 1950),
  ('empresas', 7, 2026, 210000, 1200000, 1410000, 295),
  ('taxis', 7, 2026, 340000, 0, 340000, 1090),
  ('barcos', 7, 2026, 130000, 0, 130000, 74),
  ('wallet', 7, 2026, 65000, 0, 65000, 1780)
ON CONFLICT (categoria, mes, anio) DO NOTHING;
