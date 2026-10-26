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
