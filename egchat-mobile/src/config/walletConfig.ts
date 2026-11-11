// ══════════════════════════════════════════════════════════════════
// walletConfig.ts — Control centralizado del requisito KYC para el
// monedero EGPAY. Cambia solo esta constante para activar/desactivar
// ══════════════════════════════════════════════════════════════════

/**
 * WALLET_KYC_REQUIRED
 *
 * true  → El monedero requiere KYC aprobado. Los usuarios sin verificar
 *         ven la pantalla de bloqueo. Nuevos usuarios van al prompt KYC
 *         al registrarse (sin opción de saltárselo).
 *
 * false → Monedero abierto para todos. Usuarios nuevos y antiguos
 *         acceden directamente. El KYC sigue disponible voluntariamente.
 *
 * Para REACTIVAR: cambiar a `true` y hacer build.
 * Para DESACTIVAR (pruebas): cambiar a `false`.
 */
export const WALLET_KYC_REQUIRED = false;

/**
 * WALLET_BANK_SOURCES_ENABLED
 *
 * false → Los pagos salen solo del saldo EGChat. Las cuentas bancarias
 *         guardadas no se ofrecen como fuente de fondos.
 *
 * true  → Se ofrecen las cuentas vinculadas como fuente de fondos.
 *         Activar solo cuando el cargo a banco sea real.
 */
export const WALLET_BANK_SOURCES_ENABLED = false;
