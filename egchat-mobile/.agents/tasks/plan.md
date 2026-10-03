# Plan: Conectar pantallas de monetización con Supabase

---

## 1. Importar el cliente Supabase

**Path exacto:** `src/supabase.ts`  
**Export nombrado:** `export const supabase`  
**Import pattern a usar en el hook:**

```ts
import { supabase } from '../supabase';        // desde src/hooks/
import { supabase } from '../../src/supabase'; // desde app/monetizacion/ si se usa directo
```

El cliente ya está configurado con la URL y anon key de producción. No hace falta crear uno nuevo.

---

## 2. TypeScript interfaces necesarias

Crear el archivo `src/types/monetizacion.ts` (no existe en mobile, sí en kyc-dashboard). Copiar y adaptar desde `kyc-dashboard/src/types/monetizacion.ts`, que ya está alineado con el schema real de Supabase.

### Interfaces requeridas (con campos exactos de la tabla)

```ts
// — Compartidas —
export type EstadoPago = 'pagado' | 'pendiente' | 'vencido';
export type DocStatus  = 'vigente' | 'proximo' | 'vencido';

// — Tabla monetizacion_empresas —
export interface Empresa {
  id: string;
  nombre: string;
  responsable: string;
  email: string | null;
  tipo_servicio: string;           // pantalla usa 'tipo', tabla usa 'tipo_servicio'
  cuota_mensual: number;
  comision_pct: number;
  total_ventas_mes: number;        // pantalla usa 'ventas_mes'
  estado_pago: EstadoPago;
  activa: boolean;
}

// — Vista v_taxistas_documentacion (incluye taxistas + docs calculados) —
export interface Taxista {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  num_licencia: string;
  marca_vehiculo: string | null;
  modelo_vehiculo: string | null;
  color_vehiculo: string | null;
  fecha_venc_carnet: string | null;
  fecha_venc_seguro: string | null;
  fecha_venc_revision_tecnica: string | null;   // pantalla usa 'fecha_venc_revision'
  total_viajes_mes: number;
  horas_activo_mes: number;
  activo: boolean;
  verificado: boolean;
  // campos calculados por la vista
  estado_carnet?: DocStatus;
  estado_seguro?: DocStatus;
  estado_revision?: DocStatus;
  comisiones_mes_actual?: number;  // equivale a 'ingresos_viajes_mes * 5%' en demo
}

// — Tabla monetizacion_taxista_viajes —
export interface TaxistaViaje {
  taxista_id: string;
  monto_viaje: number;
  comision_monto: number;
  mes: number;
  anio: number;
}

// — Tabla monetizacion_barcos —
export interface Barco {
  id: string;
  nombre_operador: string;
  nombre_barco: string;
  matricula: string | null;
  ruta: string;
  origen: string | null;
  destino: string | null;
  capacidad_pasajeros: number;     // pantalla usa 'capacidad'
  precio_billete_base: number;     // pantalla usa 'precio_base'
  activo: boolean;
}

// — Tabla monetizacion_billetes —
export interface Billete {
  barco_id: string;
  num_pasajeros: number;
  monto_total: number;
  comision_monto: number;
  mes: number;
  anio: number;
}

// — Tabla monetizacion_wallet_movimientos —
export interface WalletMovimiento {
  id: string;
  user_id: string;
  tipo: 'recarga_banco' | 'retiro_banco' | 'recarga_otro';
  monto: number;
  comision_monto: number;
  banco: string | null;
  estado: 'completado' | 'pendiente' | 'fallido';
  mes: number;
  anio: number;
  fecha: string;
}

// — Vista v_ingresos_mensuales —
export interface ResumenMensualAgrupado {
  mes: number;
  anio: number;
  total_general: number;
  ingresos_empresas: number;
  ingresos_taxis: number;
  ingresos_barcos: number;
  ingresos_wallet: number;
}

// — Tabla monetizacion_resumen_mensual —
export interface ResumenMensual {
  categoria: 'empresas' | 'taxis' | 'barcos' | 'wallet';
  mes: number;
  anio: number;
  total_comisiones: number;
  total_cuotas: number;
  total_ingresos: number;
  num_transacciones: number;
}

// — Tabla perfiles_financieros_usuarios —
export interface PerfilFinancieroUsuario {
  user_id: string;
  nombre_completo: string | null;
  score_financiero: number;
  total_movido: number;
  num_transacciones: number;
  monto_promedio_mensual: number;
  meses_activo: number;
  usa_taxi: boolean;
  usa_barcos: boolean;
  usa_servicios: boolean;
  usa_wallet: boolean;
  ultima_transaccion: string | null;
}

// — Tabla historial_transacciones_usuarios —
export interface HistorialTxUsuario {
  id: string;
  user_id: string;
  tipo: string;
  descripcion: string | null;
  monto: number;
  estado: string;
  mes: number;
  anio: number;
  fecha: string;
}

// — Tabla perfiles_financieros_negocios —
export interface PerfilFinancieroNegocio {
  empresa_id: string;
  razon_social: string;
  nif: string | null;
  sector: string | null;
  score_financiero: number;
  facturacion_mensual_promedio: number;
  facturacion_total: number;
  meses_operacion: number;
  num_transacciones_total: number;
  servicios_activos: string[];
}

// — Tabla historial_transacciones_negocios —
export interface HistorialTxNegocio {
  id: string;
  empresa_id: string;
  tipo: string;
  descripcion: string | null;
  monto: number;
  comision: number;
  estado: string;
  mes: number;
  anio: number;
  fecha: string;
}
```

---

## 3. Hook a crear: `src/hooks/useMonetizacion.ts`

Un único archivo con sub-hooks por módulo. No fragmentar en múltiples archivos — mantiene un sólo punto de importación.

### 3.1 `useResumenDashboard()`

**Propósito:** Reemplaza `RESUMEN_HISTORICO`, `MES_ACTUAL`, `MES_ANTERIOR`, `TOP_FUENTES` y `MODULES` sub-labels en `index.tsx`.

```ts
function useResumenDashboard(): {
  historico: ResumenMensualAgrupado[];  // últimos 6 meses, de la vista v_ingresos_mensuales
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

**Query Supabase:**
```ts
const { data, error } = await supabase
  .from('v_ingresos_mensuales')
  .select('*')
  .order('anio', { ascending: false })
  .order('mes', { ascending: false })
  .limit(6);
// Invertir el array para que el más antiguo quede primero (igual que RESUMEN_HISTORICO)
```

**Stats (para alertas en dashboard):**
```ts
// Empresas vencidas → filtrar de monetizacion_empresas donde estado_pago = 'vencido'
// Taxistas con doc próxima → filtrar de v_taxistas_documentacion
// Se hace en una segunda query paralela: Promise.all([query1, query2])
```

---

### 3.2 `useEmpresas()`

**Propósito:** Reemplaza `EMPRESAS_DEMO` en `empresas.tsx`.

```ts
function useEmpresas(): {
  empresas: Empresa[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  crearEmpresa: (data: NuevaEmpresa) => Promise<void>;
  marcarPago: (id: string, estado: EstadoPago) => Promise<void>;
}

type NuevaEmpresa = {
  nombre: string;
  responsable: string;
  email: string;
  tipo_servicio: string;   // mapeado desde field.key='tipo' en el form
  cuota_mensual: number;
  comision_pct: number;
};
```

**Query principal:**
```ts
const { data, error } = await supabase
  .from('monetizacion_empresas')
  .select('id, nombre, responsable, email, tipo_servicio, cuota_mensual, comision_pct, total_ventas_mes, estado_pago, activa')
  .order('activa', { ascending: false })
  .order('nombre', { ascending: true });
```

**`crearEmpresa`:**
```ts
await supabase.from('monetizacion_empresas').insert({
  nombre, responsable, email, tipo_servicio, cuota_mensual, comision_pct,
  total_ventas_mes: 0, estado_pago: 'pendiente', activa: true,
});
// Luego llamar a refresh()
```

**`marcarPago`:**
```ts
await supabase.from('monetizacion_empresas')
  .update({ estado_pago: estado, updated_at: new Date().toISOString() })
  .eq('id', id);
// Actualizar optimistamente en el estado local antes de confirmar
```

**Tipo retorno:** `Empresa[]`

---

### 3.3 `useTaxistas()`

**Propósito:** Reemplaza `TAXISTAS_DEMO` en `taxis.tsx`.

```ts
function useTaxistas(): {
  taxistas: Taxista[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

**Query:**
```ts
const { data, error } = await supabase
  .from('v_taxistas_documentacion')  // vista que ya calcula estado_carnet, estado_seguro, estado_revision
  .select('*')
  .order('activo', { ascending: false })
  .order('nombre', { ascending: true });
```

**Mapeo de campos** (vista → pantalla):
- `fecha_venc_revision_tecnica` → `fecha_venc_revision` (la pantalla usa el nombre corto)
- `comisiones_mes_actual` → equivale a `ingresos_viajes_mes * 5%`; si la vista no lo incluye, calcularlo: `total_viajes_mes * avg_viaje` o dejarlo en 0 hasta confirmar el schema de la vista. **Nota:** la pantalla usa `ingresos_viajes_mes` que NO existe en la tabla real. Se debe calcular agregando `monetizacion_taxista_viajes` o usar `comisiones_mes_actual / 0.05` si la vista lo expone.

**Recomendación:** Añadir una sub-query para sumar ingresos del mes actual:
```ts
// Query adicional para totales por taxista del mes actual
const now = new Date();
const { data: viajes } = await supabase
  .from('monetizacion_taxista_viajes')
  .select('taxista_id, monto_viaje, comision_monto')
  .eq('mes', now.getMonth() + 1)
  .eq('anio', now.getFullYear());
// Reducir a mapa: taxistaId -> { totalViajes: number, totalComisiones: number }
// Hacer join manual en JS antes de retornar
```

---

### 3.4 `useBarcos()`

**Propósito:** Reemplaza `BARCOS_DEMO` y `VENTAS_HISTORICO` en `barcos.tsx`.

```ts
function useBarcos(): {
  barcos: BarcoConStats[];   // Barco + campos calculados del mes actual
  historico: { mes: number; anio: number; recaudacion: number; billetes: number }[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

type BarcoConStats = Barco & {
  billetes_mes: number;
  recaudacion_mes: number;
};
```

**Queries:**
```ts
// 1. Barcos base
const { data: barcos } = await supabase
  .from('monetizacion_barcos')
  .select('*')
  .order('activo', { ascending: false });

// 2. Billetes del mes actual agrupados por barco
const { data: billetes } = await supabase
  .from('monetizacion_billetes')
  .select('barco_id, monto_total, comision_monto')
  .eq('mes', now.getMonth() + 1)
  .eq('anio', now.getFullYear())
  .eq('estado', 'vendido');

// 3. Histórico 6 meses desde monetizacion_resumen_mensual
const { data: historico } = await supabase
  .from('monetizacion_resumen_mensual')
  .select('mes, anio, total_ingresos, num_transacciones')
  .eq('categoria', 'barcos')
  .order('anio', { ascending: false })
  .order('mes', { ascending: false })
  .limit(6);
```

**Cálculo join JS:** Iterar `barcos`, para cada uno reducir `billetes` donde `barco_id` coincide y sumar `monto_total` → `recaudacion_mes`, contar registros → `billetes_mes`.

**Nota campo:** `capacidad_pasajeros` (tabla) se mapea como `capacidad` en la pantalla. `precio_billete_base` se mapea como `precio_base`.

---

### 3.5 `useMonedero()`

**Propósito:** Reemplaza `MOVIMIENTOS_DEMO`, `TOP_USUARIOS`, `CHART_DATA`, `BANCOS_DATA` y los totales hardcodeados (`totalMovimientos = 2100`, etc.) en `monedero.tsx`.

```ts
function useMonedero(): {
  movimientos: MovimientoConNombre[];   // últimos 20 del mes actual
  topUsuarios: TopUsuario[];
  historico: { label: string; value: number }[];   // comisiones 6 meses
  bancos: { banco: string; movimientos: number; volumen: number }[];
  totales: { movimientos: number; volumen: number; comisiones: number };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

type MovimientoConNombre = WalletMovimiento & { usuario: string };  // user_id → nombre via join o perfil

type TopUsuario = {
  user_id: string;
  nombre: string;
  numMovimientos: number;
  totalMovido: number;
  comisionesTotales: number;
};
```

**Queries:**
```ts
// 1. Últimas transacciones del mes
const { data: movs } = await supabase
  .from('monetizacion_wallet_movimientos')
  .select('*')
  .eq('mes', now.getMonth() + 1)
  .eq('anio', now.getFullYear())
  .order('fecha', { ascending: false })
  .limit(20);

// 2. Totales del mes desde resumen_mensual
const { data: resumen } = await supabase
  .from('monetizacion_resumen_mensual')
  .select('total_ingresos, num_transacciones')
  .eq('categoria', 'wallet')
  .eq('mes', now.getMonth() + 1)
  .eq('anio', now.getFullYear())
  .single();

// 3. Histórico comisiones (6 meses) para el gráfico
const { data: hist } = await supabase
  .from('monetizacion_resumen_mensual')
  .select('mes, anio, total_ingresos')
  .eq('categoria', 'wallet')
  .order('anio', { ascending: false })
  .order('mes', { ascending: false })
  .limit(6);

// 4. Top usuarios: agregar desde wallet_movimientos del mes
const { data: topRaw } = await supabase
  .from('monetizacion_wallet_movimientos')
  .select('user_id, monto, comision_monto')
  .eq('mes', now.getMonth() + 1)
  .eq('anio', now.getFullYear());
// Reducir en JS: agrupar por user_id → sum(monto), sum(comision_monto), count

// 5. Por banco: desde los movimientos del mes
// Agrupar en JS desde movs: banco → {movimientos, volumen}
```

**Nota sobre nombres de usuario:** `WalletMovimiento` solo tiene `user_id`. Para mostrar nombre se puede: a) hacer join con `perfiles_financieros_usuarios` (tiene `nombre_completo`), o b) mostrar el `user_id` truncado si no hay join disponible. El plan recomienda la opción (a) con una segunda query de `perfiles_financieros_usuarios` filtrando por los user_ids únicos del resultado.

---

### 3.6 `usePerfilFinanciero()`

**Propósito:** Reemplaza `PERFILES_DEMO` en `perfil-financiero.tsx`.

```ts
function usePerfilFinanciero(): {
  perfiles: PerfilConHistorial[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fetchHistorial: (userId: string) => Promise<HistorialTxUsuario[]>;
}

type PerfilConHistorial = PerfilFinancieroUsuario & {
  historial?: HistorialTxUsuario[];
};
```

**Queries:**
```ts
// 1. Todos los perfiles
const { data } = await supabase
  .from('perfiles_financieros_usuarios')
  .select('*')
  .order('score_financiero', { ascending: false });

// 2. Historial bajo demanda (cuando se expande una card)
const fetchHistorial = async (userId: string) => {
  const { data } = await supabase
    .from('historial_transacciones_usuarios')
    .select('*')
    .eq('user_id', userId)
    .order('fecha', { ascending: false })
    .limit(10);
  return data ?? [];
};
```

**Mapeo** (tabla → pantalla):
- `nombre_completo` → `nombre` (la pantalla usa `perfil.nombre`)
- `monto_promedio_mensual` → `montoPromedio`
- `meses_activo` → `mesesActivo`
- `usa_taxi` / `usa_barcos` / `usa_servicios` / `usa_wallet` → directo
- `ultima_transaccion` → directo (pantalla lo usa como string)
- `historial` → array vacío por defecto, se popula con `fetchHistorial` al expandir

**InformeData mapping:**
- `serviciosUsados`: construir desde los flags `usa_*`
- `mesesActivo`, `totalMovido`, `numTransacciones`, `montoPromedio`, `scoreFinanciero`: directo del perfil

---

### 3.7 `usePerfilNegocio()`

**Propósito:** Reemplaza `PERFILES_DEMO` en `perfil-negocio.tsx`.

```ts
function usePerfilNegocio(): {
  perfiles: PerfilNegocioConHistorial[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fetchHistorial: (empresaId: string) => Promise<HistorialTxNegocio[]>;
}

type PerfilNegocioConHistorial = PerfilFinancieroNegocio & {
  historial?: HistorialTxNegocio[];
};
```

**Query:**
```ts
// La tabla perfiles_financieros_negocios tiene empresa_id, no un join automático
// Se requiere join con monetizacion_empresas para obtener responsable y nif
const { data } = await supabase
  .from('perfiles_financieros_negocios')
  .select(`
    *,
    empresa:empresa_id (
      nombre, responsable, email, estado_pago
    )
  `)
  .order('score_financiero', { ascending: false });
```

**Mapeo** (tabla → pantalla):
- `razon_social` → `razonSocial`
- `sector` → `sector`
- `facturacion_mensual_promedio` → `facturacionMensual` (pantalla usa array de 6 meses; la tabla solo tiene promedio y total — se debe construir un array simulado de 6 valores igual al promedio, o cambiar la pantalla para mostrar solo promedio y total en lugar del gráfico por meses)
- **DECISIÓN:** El campo `facturacionMensual: number[]` de la pantalla no existe en la tabla. La tabla tiene `facturacion_mensual_promedio` y `facturacion_total`. Dos opciones:
  1. **Opción A (recomendada):** Agregar query a `historial_transacciones_negocios` para sumar montos por mes de los últimos 6 meses → construir el array real.
  2. **Opción B:** Eliminar el gráfico de barras de la pantalla y mostrar solo los datos planos del perfil.
  
  El plan recomienda **Opción A**: si no hay datos históricos reales, el array sale vacío y el gráfico no dibuja barras.

**Query histórico facturación:**
```ts
const now = new Date();
// Últimos 6 meses: calcular los (mes, anio) y hacer filtro OR
const { data: hist } = await supabase
  .from('historial_transacciones_negocios')
  .select('empresa_id, monto, mes, anio')
  .eq('empresa_id', empresaId)
  .order('anio', { ascending: false })
  .order('mes', { ascending: false })
  .limit(6 * 50);  // hasta 50 tx por mes
// Reducir: agrupar por (mes, anio) y sumar monto → array de 6 valores
```

---

## 4. Mapeo exacto demo → Supabase por pantalla

### `app/monetizacion/index.tsx`

| Demo constant | Reemplazar con | Hook |
|---|---|---|
| `RESUMEN_HISTORICO` | `historico` (array de `ResumenMensualAgrupado`) | `useResumenDashboard()` |
| `MES_ACTUAL` | `historico[historico.length - 1]` | ídem |
| `MES_ANTERIOR` | `historico[historico.length - 2]` | ídem |
| `CHART_DATA` | mapear `historico` a `{label, value}` | ídem |
| `TOP_FUENTES` | calculado desde `historico[last]` y resúmenes | ídem |
| Alertas hardcodeadas | `stats.empresas_vencidas`, `stats.taxistas_alerta_docs` | segunda query en `useResumenDashboard` |
| `MODULES[].sub` | totales reales por categoría | ídem |
| `onRefresh` `setTimeout` | llamar `refresh()` del hook | ídem |

**Lógica mes/año actual:** `new Date()` para extraer `mes` y `anio`, usarlos para el badge en el header (actualmente hardcodeado como `"Sep 2026"`).

---

### `app/monetizacion/empresas.tsx`

| Demo | Tabla | Campo tabla |
|---|---|---|
| `empresa.tipo` | `monetizacion_empresas` | `tipo_servicio` |
| `empresa.ventas_mes` | ídem | `total_ventas_mes` |
| `EMPRESAS_DEMO` array | query supabase | `useEmpresas()` |
| `setEmpresas(prev => [...])` optimista en `handleAdd` | insert + refresh | `crearEmpresa()` |
| `handleToggleEstado` local | update + optimistic | `marcarPago()` |
| `totalCuotas`, `totalComisiones`, `totalIngresos` (constantes) | calcular en JS sobre `empresas` del hook | ídem |
| `refreshing` + `setTimeout` | `loading` del hook + `refresh()` | ídem |

---

### `app/monetizacion/taxis.tsx`

| Demo | Tabla/Vista | Campo |
|---|---|---|
| `TAXISTAS_DEMO` | `v_taxistas_documentacion` | directo |
| `taxista.fecha_venc_revision` | vista | `fecha_venc_revision_tecnica` |
| `taxista.ingresos_viajes_mes` | calculado desde `monetizacion_taxista_viajes` | `sum(monto_viaje)` por taxista_id |
| `totalIngresos` | suma de `ingresos_viajes_mes` calculados | JS |
| `totalViajes` | suma de `total_viajes_mes` | directo de la vista |
| `totalHoras` | suma de `horas_activo_mes` | directo |
| `totalComisiones` | `totalIngresos * 0.05` | JS |
| Filtro activos/alertas | basado en `activo` y `estado_carnet/seguro/revision` de la vista | ídem |

---

### `app/monetizacion/barcos.tsx`

| Demo | Tabla | Campo |
|---|---|---|
| `BARCOS_DEMO` | `monetizacion_barcos` + billetes agregados | `useBarcos()` |
| `barco.capacidad` | tabla | `capacidad_pasajeros` |
| `barco.precio_base` | tabla | `precio_billete_base` |
| `barco.billetes_mes` | calculado desde `monetizacion_billetes` | `count` por barco_id del mes |
| `barco.recaudacion_mes` | ídem | `sum(monto_total)` |
| `VENTAS_HISTORICO` | `monetizacion_resumen_mensual` | categoria='barcos' |
| `chartData` | `historico` del hook mapeado | ídem |
| Totales | calculados en JS desde el array | ídem |

---

### `app/monetizacion/monedero.tsx`

| Demo | Tabla | Campo |
|---|---|---|
| `MOVIMIENTOS_DEMO` | `monetizacion_wallet_movimientos` | últimos 20 del mes |
| `mov.comision` | tabla | `comision_monto` |
| `totalMovimientos = 2100` | `monetizacion_resumen_mensual` | `num_transacciones` where categoria='wallet' |
| `totalVolumen = 15200000` | ídem | calculado desde sum de monto en wallet_movimientos |
| `TOP_USUARIOS` | agrupado desde `wallet_movimientos` | ver query §3.5 |
| `CHART_DATA` (comisiones por mes) | `monetizacion_resumen_mensual` | 6 meses categoria='wallet' |
| `BANCOS_DATA` | agrupado en JS desde `movimientos` | banco → movimientos, volumen |
| `mov.usuario` | join con `perfiles_financieros_usuarios` | `nombre_completo` |

---

### `app/monetizacion/perfil-financiero.tsx`

| Demo | Tabla | Campo |
|---|---|---|
| `perfil.nombre` | `perfiles_financieros_usuarios` | `nombre_completo` |
| `perfil.totalMovido` | ídem | `total_movido` |
| `perfil.numTransacciones` | ídem | `num_transacciones` |
| `perfil.montoPromedio` | ídem | `monto_promedio_mensual` |
| `perfil.mesesActivo` | ídem | `meses_activo` |
| `perfil.scoreFinanciero` | ídem | `score_financiero` |
| `perfil.usaTaxi` etc. | ídem | `usa_taxi`, `usa_barcos`, `usa_servicios`, `usa_wallet` |
| `perfil.ultimaTransaccion` | ídem | `ultima_transaccion` |
| `perfil.historial` | `historial_transacciones_usuarios` | lazy load al expandir |
| `totalUsuarios`, `scorePromedio`, `totalMovido` | calcular en JS desde el array | ídem |
| Búsqueda por nombre | filtro JS sobre `nombre_completo` | ídem |

---

### `app/monetizacion/perfil-negocio.tsx`

| Demo | Tabla | Campo |
|---|---|---|
| `perfil.razonSocial` | `perfiles_financieros_negocios` | `razon_social` |
| `perfil.nif` | ídem | `nif` |
| `perfil.responsable` | join con `monetizacion_empresas` | `responsable` |
| `perfil.scoreFinanciero` | ídem | `score_financiero` |
| `perfil.numTransacciones` | ídem | `num_transacciones_total` |
| `perfil.mesesOperacion` | ídem | `meses_operacion` |
| `perfil.serviciosActivos` | ídem | `servicios_activos` (array) |
| `perfil.facturacionMensual[]` | `historial_transacciones_negocios` | sum(monto) por mes — ver §3.7 |
| `facturacionActual` | `facturacion_mensual_promedio` fallback si sin historial | ídem |
| Búsqueda | filtro JS sobre `razon_social` | ídem |

---

## 5. Patrón de hook (plantilla común)

Todos los hooks siguen este patrón para uniformidad con los hooks existentes en `src/hooks/`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useEjemplo() {
  const [data, setData] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: raw, error: err } = await supabase
        .from('tabla')
        .select('*');
      if (err) throw err;
      setData(raw ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
```

**Estado de carga en pantallas:** Mientras `loading === true`, mostrar los datos demo existentes (como skeleton) para no romper la UI. Al llegar datos reales, reemplazar. Esto permite hacer la transición sin pantallas en blanco.

---

## 6. Orden de implementación recomendado

El orden minimiza dependencias: primero lo que más pantallas comparten, luego lo específico.

```
- [ ] 1. Crear src/types/monetizacion.ts
         Copiar y adaptar tipos desde kyc-dashboard/src/types/monetizacion.ts.
         Ajustar: quitar campos que no están en mobile (id, created_at opcionales).
         Verify: npx tsc --noEmit desde egchat-mobile/

- [ ] 2. Crear src/hooks/useMonetizacion.ts con useResumenDashboard()
         Es la query del index.tsx. Dependencia: tipos del paso 1.
         Verify: npx expo start --web y verificar que el dashboard carga sin error.

- [ ] 3. Implementar useEmpresas() en useMonetizacion.ts
         Agregar crearEmpresa() y marcarPago() con optimistic update.
         Verify: abrir pantalla Empresas, verificar que la lista carga desde Supabase.

- [ ] 4. Implementar useTaxistas() en useMonetizacion.ts
         Incluye la sub-query de viajes para calcular ingresos_viajes_mes.
         Verify: abrir pantalla Taxis, verificar datos reales y alertas de docs.

- [ ] 5. Implementar useBarcos() en useMonetizacion.ts
         Incluye join JS de billetes por barco y query histórico.
         Verify: abrir pantalla Barcos, verificar que el gráfico muestra datos reales.

- [ ] 6. Implementar useMonedero() en useMonetizacion.ts
         La más compleja: movimientos + top usuarios + bancos + histórico.
         Verify: abrir pantalla Monedero, verificar totales y transacciones reales.

- [ ] 7. Implementar usePerfilFinanciero() en useMonetizacion.ts
         Lazy load de historial al expandir una card.
         Verify: abrir pantalla Perfiles Usuarios, expandir un perfil.

- [ ] 8. Implementar usePerfilNegocio() en useMonetizacion.ts
         Incluye join con empresas y query de historial por negocio.
         Verify: abrir pantalla Perfiles Negocios, expandir un negocio.

- [ ] 9. Conectar index.tsx con useResumenDashboard()
         Reemplazar RESUMEN_HISTORICO, MES_ACTUAL, alertas hardcodeadas.
         Usar datos demo como valor inicial del state para evitar flash vacío.

- [ ] 10. Conectar empresas.tsx con useEmpresas()
          Reemplazar EMPRESAS_DEMO, totalCuotas, handleAdd, handleToggleEstado.

- [ ] 11. Conectar taxis.tsx con useTaxistas()
          Reemplazar TAXISTAS_DEMO, totales.

- [ ] 12. Conectar barcos.tsx con useBarcos()
          Reemplazar BARCOS_DEMO, VENTAS_HISTORICO, chartData.

- [ ] 13. Conectar monedero.tsx con useMonedero()
          Reemplazar MOVIMIENTOS_DEMO, TOP_USUARIOS, CHART_DATA, BANCOS_DATA, totales.

- [ ] 14. Conectar perfil-financiero.tsx con usePerfilFinanciero()
          Reemplazar PERFILES_DEMO, búsqueda, historial lazy.

- [ ] 15. Conectar perfil-negocio.tsx con usePerfilNegocio()
          Reemplazar PERFILES_DEMO, gráfico de facturación por mes.

- [ ] 16. Exportar hooks desde src/hooks/index.ts
          Añadir: export * from './useMonetizacion';
          Verify: npx tsc --noEmit — sin errores de tipos.
```

---

## 7. Notas y riesgos

**RLS (Row Level Security):** Las tablas de monetización son de administración. Si tienen RLS activo que requiera `auth.uid()`, las queries con el anon key fallarán silenciosamente (retornarán array vacío). Si las pantallas muestran 0 registros, verificar que las políticas RLS permitan SELECT con anon role, o que el user esté autenticado via Supabase Auth. La app usa JWT custom (no Supabase Auth), por lo que el `auth.uid()` en Supabase estará vacío — las tablas deben tener política `FOR SELECT USING (true)` o `TO anon USING (true)`.

**Campo `usuario` en monedero:** `monetizacion_wallet_movimientos` tiene `user_id` (UUID), no nombre de usuario. La demo muestra nombres. La solución es hacer join con `perfiles_financieros_usuarios` o `historial_transacciones_usuarios`. Si el join es costoso, mostrar los últimos 3-4 caracteres del `user_id` como identificador corto hasta que se implemente.

**Gráfico de 6 meses en perfil-negocio:** Si `historial_transacciones_negocios` está vacío para un negocio, el array `facturacionMensual` tendrá todos los valores en 0. El componente `BarChart` debe manejar este caso (actualmente lo haría sin problemas, mostraría barras de altura 0).

**Datos de ingresos por taxista (`ingresos_viajes_mes`):** Este campo no existe en `monetizacion_taxistas` ni en `v_taxistas_documentacion` según el schema indicado. Se debe calcular desde `monetizacion_taxista_viajes`. Confirmar que la vista no lo expone ya como `sum_monto_viajes` o similar antes de hacer la query adicional.
