/**
 * offline-ui.ts
 * Componentes de UI para el estado offline de EGCHAT.
 *
 * - Banner "Sin conexión" con animación CSS
 * - Toast de reconexión
 * - Indicadores de estado en mensajes
 */

// ── Estilos inyectados ────────────────────────────────────────────────────────

const CSS = `
  #egchat-offline-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 99999;
    background: #1a1a2e;
    color: #fff;
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  #egchat-offline-banner.visible {
    transform: translateY(0);
  }

  #egchat-offline-banner .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    animation: pulse-red 1.5s infinite;
    flex-shrink: 0;
  }

  @keyframes pulse-red {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.8); }
  }

  #egchat-reconnect-toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: #00c8a0;
    color: #fff;
    padding: 10px 20px;
    border-radius: 24px;
    font-size: 13px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    z-index: 99999;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,200,160,0.4);
  }

  #egchat-reconnect-toast.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

// ── Estado ────────────────────────────────────────────────────────────────────

let banner: HTMLElement | null = null;
let toast:  HTMLElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ── Inicialización ────────────────────────────────────────────────────────────

export function initOfflineUI(): void {
  // Inyectar estilos
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // Crear banner
  banner = document.createElement('div');
  banner.id = 'egchat-offline-banner';
  banner.innerHTML = `
    <span class="dot"></span>
    <span>Sin conexión — los mensajes se enviarán al reconectar</span>
  `;
  document.body.appendChild(banner);

  // Crear toast de reconexión
  toast = document.createElement('div');
  toast.id = 'egchat-reconnect-toast';
  toast.textContent = '✓ Conexión restaurada';
  document.body.appendChild(toast);

  // Escuchar eventos de conexión
  window.addEventListener('egchat-offline', showOfflineBanner);
  window.addEventListener('egchat-online',  showReconnectToast);

  // Estado inicial
  if (!navigator.onLine) showOfflineBanner();

  console.log('[OfflineUI] Inicializado.');
}

// ── Banner offline ────────────────────────────────────────────────────────────

export function showOfflineBanner(): void {
  if (!banner) return;
  banner.classList.add('visible');
  // Empujar el contenido hacia abajo para que no quede tapado
  document.documentElement.style.setProperty('--offline-banner-height', '36px');
}

export function hideOfflineBanner(): void {
  if (!banner) return;
  banner.classList.remove('visible');
  document.documentElement.style.setProperty('--offline-banner-height', '0px');
}

// ── Toast de reconexión ───────────────────────────────────────────────────────

export function showReconnectToast(): void {
  hideOfflineBanner();

  if (!toast) return;
  toast.classList.add('visible');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast?.classList.remove('visible');
  }, 3_000);
}

// ── Indicadores de estado de mensaje ─────────────────────────────────────────

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error';

/**
 * getStatusIcon()
 * Devuelve el icono/texto que representa el estado de un mensaje.
 * Compatible con el sistema de mensajes existente en App.tsx.
 */
export function getStatusIcon(status: MessageStatus): string {
  switch (status) {
    case 'pending':   return '🕐';   // reloj — esperando envío
    case 'sent':      return '✓';    // un tick — enviado al servidor
    case 'delivered': return '✓✓';   // dos ticks grises — entregado
    case 'read':      return '✓✓';   // dos ticks azules (color via CSS)
    case 'error':     return '❌';   // error — toca para reintentar
    default:          return '';
  }
}

/**
 * getStatusColor()
 * Color del indicador de estado.
 */
export function getStatusColor(status: MessageStatus): string {
  switch (status) {
    case 'pending':   return '#9ca3af';
    case 'sent':      return '#9ca3af';
    case 'delivered': return '#9ca3af';
    case 'read':      return '#00c8a0';
    case 'error':     return '#ef4444';
    default:          return '#9ca3af';
  }
}

/**
 * getStatusLabel()
 * Texto accesible del estado (para tooltips).
 */
export function getStatusLabel(status: MessageStatus): string {
  switch (status) {
    case 'pending':   return 'Pendiente de envío';
    case 'sent':      return 'Enviado';
    case 'delivered': return 'Entregado';
    case 'read':      return 'Leído';
    case 'error':     return 'Error al enviar — toca para reintentar';
    default:          return '';
  }
}
