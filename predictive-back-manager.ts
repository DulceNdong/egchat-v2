/**
 * predictive-back-manager.ts
 * Gestión del gesto de atrás predictivo de Android 14+ para EGCHAT.
 *
 * Funcionalidades:
 * - Mantiene un historial de vistas (stack de navegación)
 * - Escucha el evento 'egchat-back-gesture' disparado desde MainActivity.java
 * - Muestra un overlay semi-transparente con la vista anterior (vista previa)
 * - Coordina con el sistema de navegación de App.tsx (setCurrentView)
 *
 * Uso:
 *   import { initPredictiveBack, pushView, popView } from './predictive-back-manager';
 *   initPredictiveBack(setCurrentView);  // llamar al montar App
 *   pushView('Mensajería');              // al navegar a una vista
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────

type NavigateFn = (view: string) => void;

// ── Estado ────────────────────────────────────────────────────────────────────

/** Stack de historial de vistas — el último es la vista actual */
let _viewStack: string[] = ['home'];
let _navigateFn: NavigateFn | null = null;
let _overlayEl: HTMLElement | null = null;
let _overlayTimer: ReturnType<typeof setTimeout> | null = null;

// ── Historial de vistas ───────────────────────────────────────────────────────

/**
 * pushView(view)
 * Añade una vista al historial. Llamar cada vez que el usuario navega.
 */
export function pushView(view: string): void {
  // No duplicar si es la misma vista
  if (_viewStack[_viewStack.length - 1] === view) return;
  _viewStack.push(view);
  // Limitar el stack a 20 entradas
  if (_viewStack.length > 20) _viewStack.shift();
}

/**
 * popView()
 * Elimina la vista actual del historial y devuelve la anterior.
 * Devuelve null si no hay historial (cerrar app).
 */
export function popView(): string | null {
  if (_viewStack.length <= 1) return null;
  _viewStack.pop();
  return _viewStack[_viewStack.length - 1];
}

/**
 * getCurrentView()
 * Devuelve la vista actual según el historial.
 */
export function getCurrentView(): string {
  return _viewStack[_viewStack.length - 1] || 'home';
}

/**
 * getPreviousView()
 * Devuelve la vista anterior (para la vista previa del gesto).
 */
export function getPreviousView(): string | null {
  if (_viewStack.length < 2) return null;
  return _viewStack[_viewStack.length - 2];
}

/**
 * clearHistory()
 * Limpia el historial (al hacer logout).
 */
export function clearHistory(): void {
  _viewStack = ['home'];
}

// ── Overlay de vista previa ───────────────────────────────────────────────────

const OVERLAY_CSS = `
  #egchat-back-preview {
    position: fixed;
    inset: 0;
    z-index: 99998;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #egchat-back-preview.visible {
    opacity: 1;
  }
  #egchat-back-preview .preview-bg {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(4px);
  }
  #egchat-back-preview .preview-card {
    position: relative;
    background: #fff;
    border-radius: 16px;
    padding: 20px 28px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    min-width: 180px;
    animation: preview-in 0.15s ease;
  }
  @keyframes preview-in {
    from { transform: scale(0.92); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
  }
  #egchat-back-preview .preview-icon { font-size: 32px; }
  #egchat-back-preview .preview-label {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  #egchat-back-preview .preview-hint {
    font-size: 11px;
    color: #9ca3af;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
`;

/** Mapa de vistas a iconos y etiquetas para la vista previa */
const VIEW_LABELS: Record<string, { icon: string; label: string }> = {
  home:        { icon: '🏠', label: 'Inicio' },
  Mensajería:  { icon: '💬', label: 'Mensajes' },
  contactos:   { icon: '👥', label: 'Contactos' },
  monedero:    { icon: '💳', label: 'Monedero' },
  servicios:   { icon: '🛍️', label: 'Servicios' },
  ajustes:     { icon: '⚙️', label: 'Ajustes' },
  news:        { icon: '📰', label: 'Noticias' },
};

function createOverlay(): void {
  if (_overlayEl) return;

  const style = document.createElement('style');
  style.textContent = OVERLAY_CSS;
  document.head.appendChild(style);

  _overlayEl = document.createElement('div');
  _overlayEl.id = 'egchat-back-preview';
  _overlayEl.innerHTML = `
    <div class="preview-bg"></div>
    <div class="preview-card">
      <div class="preview-icon">🏠</div>
      <div class="preview-label">Inicio</div>
      <div class="preview-hint">← Desliza para volver</div>
    </div>
  `;
  document.body.appendChild(_overlayEl);
}

function showPreview(targetView: string): void {
  if (!_overlayEl) createOverlay();
  const info = VIEW_LABELS[targetView] || { icon: '◀', label: targetView };
  const card = _overlayEl!.querySelector('.preview-card');
  if (card) {
    card.querySelector('.preview-icon')!.textContent = info.icon;
    card.querySelector('.preview-label')!.textContent = info.label;
  }
  _overlayEl!.classList.add('visible');
  // Auto-ocultar si el usuario no completa el gesto
  if (_overlayTimer) clearTimeout(_overlayTimer);
  _overlayTimer = setTimeout(hidePreview, 800);
}

function hidePreview(): void {
  _overlayEl?.classList.remove('visible');
}

// ── Inicialización ────────────────────────────────────────────────────────────

/**
 * initPredictiveBack(navigateFn)
 * Inicializa el sistema de atrás predictivo.
 * Llamar una vez al montar App.tsx, pasando la función de navegación.
 *
 * @param navigateFn — función que cambia la vista actual (setCurrentView de App.tsx)
 */
export function initPredictiveBack(navigateFn: NavigateFn): void {
  _navigateFn = navigateFn;
  createOverlay();

  window.addEventListener('egchat-back-gesture', (e: Event) => {
    const event = e as CustomEvent;
    const isPredictive = event.detail?.predictive === true;
    const previousView = getPreviousView();

    if (!previousView) {
      // Sin historial — devolver false para que MainActivity cierre la app
      // (el evento no puede devolver valores, usamos una variable global)
      (window as any).__egchat_back_handled = false;
      return;
    }

    // Marcar como manejado
    (window as any).__egchat_back_handled = true;

    if (isPredictive) {
      // Android 14+: mostrar vista previa antes de navegar
      showPreview(previousView);
      // Navegar después de un breve delay para que se vea la animación
      setTimeout(() => {
        hidePreview();
        const view = popView();
        if (view && _navigateFn) _navigateFn(view);
      }, 200);
    } else {
      // Android 13-: navegar directamente sin vista previa
      const view = popView();
      if (view && _navigateFn) _navigateFn(view);
    }
  });

  console.log('[PredictiveBack] Inicializado.');
}

/**
 * removePredictiveBackListeners()
 * Limpia los listeners. Llamar al hacer logout.
 */
export function removePredictiveBackListeners(): void {
  clearHistory();
  hidePreview();
}
