/**
 * offline-ui.ts
 * ─────────────────────────────────────────────────────────────────
 * Maneja los elementos visuales del modo offline:
 *  - Banner superior "Sin conexión"
 *  - Indicadores de estado en mensajes (⏳ pendiente, ✓ enviado, ❌ error)
 *
 * Diseñado para integrarse con React via eventos del DOM y refs,
 * pero también funciona standalone inyectando el CSS/HTML necesario.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Constantes ────────────────────────────────────────────────────

const BANNER_ID = 'egchat-offline-banner';
const BANNER_CSS_ID = 'egchat-offline-styles';

// ── Inyección de estilos ──────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById(BANNER_CSS_ID)) return;

  const style = document.createElement('style');
  style.id = BANNER_CSS_ID;
  style.textContent = `
    /* ── Banner offline ── */
    #${BANNER_ID} {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: #1a1a2e;
      color: #fff;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      transform: translateY(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      /* Respetar safe area en notch/isla dinámica */
      padding-top: calc(8px + env(safe-area-inset-top, 0px));
    }

    #${BANNER_ID}.visible {
      transform: translateY(0);
    }

    #${BANNER_ID} .offline-icon {
      font-size: 16px;
      animation: pulse-offline 1.5s ease-in-out infinite;
    }

    #${BANNER_ID} .offline-text {
      font-weight: 500;
    }

    #${BANNER_ID} .offline-sub {
      font-size: 11px;
      opacity: 0.7;
      margin-left: 4px;
    }

    @keyframes pulse-offline {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Indicadores de estado en mensajes ── */
    .msg-status-icon {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      margin-left: 4px;
      transition: all 0.2s ease;
    }

    .msg-status-icon[data-status="pending"] {
      color: #9ca3af;
    }

    .msg-status-icon[data-status="sending"] {
      color: #60a5fa;
      animation: spin-sending 1s linear infinite;
    }

    .msg-status-icon[data-status="sent"] {
      color: #9ca3af;
    }

    .msg-status-icon[data-status="delivered"] {
      color: #9ca3af;
    }

    .msg-status-icon[data-status="read"] {
      color: #00c8a0;
    }

    .msg-status-icon[data-status="failed"] {
      color: #ef4444;
      cursor: pointer;
    }

    @keyframes spin-sending {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ── Mensaje con estado pendiente (fondo ligeramente diferente) ── */
    .message-pending {
      opacity: 0.85;
    }

    /* ── Toast de reconexión ── */
    #egchat-reconnect-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #00c8a0;
      color: #fff;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 9998;
      pointer-events: none;
      white-space: nowrap;
    }

    #egchat-reconnect-toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  `;

  document.head.appendChild(style);
}

// ── Banner offline ────────────────────────────────────────────────

function getOrCreateBanner(): HTMLElement {
  let banner = document.getElementById(BANNER_ID);
  if (!banner) {
    banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.innerHTML = `
      <span class="offline-icon">📡</span>
      <span class="offline-text">Sin conexión</span>
      <span class="offline-sub">Los mensajes se enviarán al reconectar</span>
    `;
    document.body.appendChild(banner);
  }
  return banner;
}

/**
 * Muestra el banner de "Sin conexión" en la parte superior.
 */
export function showOfflineBanner(): void {
  injectStyles();
  const banner = getOrCreateBanner();
  // Forzar reflow para que la transición funcione
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });
  });

  // Empujar el contenido principal hacia abajo para que no quede tapado
  const appRoot = document.getElementById('root');
  if (appRoot) {
    const bannerHeight = banner.offsetHeight || 44;
    appRoot.style.paddingTop = `${bannerHeight}px`;
    appRoot.style.transition = 'padding-top 0.3s ease';
  }
}

/**
 * Oculta el banner de "Sin conexión" y muestra un toast de reconexión.
 */
export function hideOfflineBanner(): void {
  const banner = document.getElementById(BANNER_ID);
  if (banner) {
    banner.classList.remove('visible');
  }

  // Restaurar padding del contenido
  const appRoot = document.getElementById('root');
  if (appRoot) {
    appRoot.style.paddingTop = '';
  }

  // Mostrar toast de "Conectado"
  showReconnectToast();
}

// ── Toast de reconexión ───────────────────────────────────────────

function showReconnectToast(): void {
  let toast = document.getElementById('egchat-reconnect-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'egchat-reconnect-toast';
    toast.textContent = '✓ Conexión restaurada';
    document.body.appendChild(toast);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast!.classList.add('visible');
    });
  });

  // Ocultar después de 2.5 segundos
  setTimeout(() => {
    toast!.classList.remove('visible');
  }, 2_500);
}

// ── Indicadores de estado en mensajes ────────────────────────────

const STATUS_ICONS: Record<string, string> = {
  pending:   '🕐',
  sending:   '↻',
  sent:      '✓',
  delivered: '✓✓',
  read:      '✓✓',
  failed:    '❌',
};

const STATUS_TITLES: Record<string, string> = {
  pending:   'Pendiente de envío',
  sending:   'Enviando...',
  sent:      'Enviado',
  delivered: 'Entregado',
  read:      'Leído',
  failed:    'Error al enviar — toca para reintentar',
};

/**
 * Muestra el indicador de "enviando..." en un mensaje.
 * @param messageId  ID del mensaje (se usa como data-message-id en el DOM)
 */
export function showPendingMessageIndicator(messageId: string): void {
  const el = document.querySelector(`[data-message-id="${messageId}"] .msg-status-icon`);
  if (el) {
    el.setAttribute('data-status', 'pending');
    el.textContent = STATUS_ICONS.pending;
    el.setAttribute('title', STATUS_TITLES.pending);
  }
}

/**
 * Actualiza el ícono de estado de un mensaje.
 * @param messageId  ID del mensaje
 * @param status     Nuevo estado
 * @param onRetry    Callback opcional para cuando el usuario toca "reintentar"
 */
export function updatePendingStatus(
  messageId: string,
  status: 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed',
  onRetry?: () => void
): void {
  const el = document.querySelector(
    `[data-message-id="${messageId}"] .msg-status-icon`
  ) as HTMLElement | null;

  if (!el) return;

  el.setAttribute('data-status', status);
  el.textContent = STATUS_ICONS[status] || '?';
  el.setAttribute('title', STATUS_TITLES[status] || status);

  // Añadir/quitar clase de opacidad en el contenedor del mensaje
  const msgContainer = document.querySelector(
    `[data-message-id="${messageId}"]`
  ) as HTMLElement | null;

  if (msgContainer) {
    if (status === 'pending' || status === 'sending') {
      msgContainer.classList.add('message-pending');
    } else {
      msgContainer.classList.remove('message-pending');
    }
  }

  // Si es "failed", añadir handler de reintento
  if (status === 'failed' && onRetry) {
    el.onclick = (e) => {
      e.stopPropagation();
      onRetry();
    };
  } else {
    el.onclick = null;
  }
}

// ── Inicialización automática ─────────────────────────────────────

/**
 * Inicializa los listeners de online/offline para el banner.
 * Llama esto UNA VEZ al arrancar la app.
 */
export function initOfflineUI(): void {
  injectStyles();

  // Estado inicial
  if (!navigator.onLine) {
    showOfflineBanner();
  }

  window.addEventListener('offline', () => {
    showOfflineBanner();
  });

  window.addEventListener('online', () => {
    hideOfflineBanner();
  });

  console.log('[OfflineUI] Inicializado, online:', navigator.onLine);
}

// ── Hook React helper ─────────────────────────────────────────────
// Exportamos también el estado como función para que componentes React
// puedan leerlo sin necesidad de listeners adicionales.

export function isOnline(): boolean {
  return navigator.onLine;
}
