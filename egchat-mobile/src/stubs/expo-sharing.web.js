// Stub web para expo-sharing — no disponible en navegador
export async function isAvailableAsync() { return false; }
export async function shareAsync(url, options) {
  // En web usar Web Share API si está disponible
  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ url }); } catch {}
  }
}
export default { isAvailableAsync, shareAsync };
