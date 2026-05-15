import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Chat {
  id: string;
  title?: string;
  name?: string;
  avatar?: string;
  avatarUrl?: string;
}

interface Props {
  url: string;
  onClose: () => void;
  chats: Chat[];
  onForward: (chatId: string, imageUrl: string) => void;
  onShowToast: (msg: string, type: string) => void;
}

export default function ImageViewerModal({ url, onClose, chats, onForward, onShowToast }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showForward, setShowForward] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editMode, setEditMode] = useState<'crop' | 'draw' | 'text' | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [forwardSearch, setForwardSearch] = useState('');
  const [selectedForward, setSelectedForward] = useState<string[]>([]);
  const [forwardCaption, setForwardCaption] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const lastTouchDist = useRef<number>(0);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Zoom con rueda del ratón
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(5, Math.max(0.5, z - e.deltaY * 0.001)));
  }, []);

  // Doble tap para zoom
  const lastTap = useRef(0);
  const onImgClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setZoom(z => z > 1 ? 1 : 2.5);
      setPan({ x: 0, y: 0 });
    }
    lastTap.current = now;
  };

  // Drag para pan
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setIsDragging(false);

  // Pinch zoom táctil
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist - lastTouchDist.current;
      lastTouchDist.current = dist;
      setZoom(z => Math.min(5, Math.max(0.5, z + delta * 0.005)));
    }
  };

  // Descargar imagen
  const handleDownload = async () => {
    try {
      const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp',
      };
      const mime = mimeMap[ext] || 'image/jpeg';
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `egchat_${Date.now()}.${ext}`;
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) { a.target = '_blank'; a.rel = 'noopener'; }
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      onShowToast('🖼️ Foto guardada', 'success');
    } catch {
      window.open(url, '_blank');
      onShowToast('Abre la imagen y guárdala manualmente', 'info');
    }
  };

  // Compartir: abre el picker de contactos de EGCHAT
  const handleShare = () => {
    setShowForward(true);
  };

  // Reenviar a contactos seleccionados
  const handleForwardSend = () => {
    if (selectedForward.length === 0) return;
    selectedForward.forEach(chatId => onForward(chatId, url));
    onShowToast(`📤 Reenviado a ${selectedForward.length} chat${selectedForward.length > 1 ? 's' : ''}`, 'success');
    setShowForward(false);
    setSelectedForward([]);
    setForwardCaption('');
    onClose();
  };

  const filteredChats = chats.filter(c =>
    (c.title || c.name || '').toLowerCase().includes(forwardSearch.toLowerCase())
  );

  const imgStyle: React.CSSProperties = {
    maxWidth: '100%', maxHeight: '100%',
    objectFit: 'contain',
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.15s ease',
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
    userSelect: 'none',
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
    borderRadius: '2px',
  };

  const btnStyle = (active = false): React.CSSProperties => ({
    background: active ? 'rgba(0,200,160,0.3)' : 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${active ? 'rgba(0,200,160,0.6)' : 'rgba(255,255,255,0.2)'}`,
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    minWidth: '56px',
    outline: 'none',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: '#000', display: 'flex', flexDirection: 'column', animation: 'imgViewerIn 0.18s ease' }}>
      <style>{`
        @keyframes imgViewerIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .iv-btn:hover { background: rgba(255,255,255,0.22) !important; }
        .iv-fwd-item:hover { background: rgba(255,255,255,0.08) !important; }
        .iv-fwd-item.selected { background: rgba(0,200,160,0.15) !important; }
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        {/* Cerrar */}
        <button className="iv-btn" onClick={onClose} style={btnStyle()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '20px', padding: '4px 12px', color: '#fff', fontSize: '13px', fontWeight: '600' }}>
            {Math.round(zoom * 100)}%
          </div>
        )}

        {/* Acciones top */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="iv-btn" onClick={() => setShowEdit(e => !e)} style={btnStyle(showEdit)} title="Editar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span style={{ fontSize: '10px' }}>Editar</span>
          </button>
          <button className="iv-btn" onClick={handleShare} style={btnStyle()} title="Compartir">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span style={{ fontSize: '10px' }}>Compartir</span>
          </button>
        </div>
      </div>

      {/* ── IMAGEN PRINCIPAL ── */}
      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        <img
          ref={imgRef}
          src={url}
          alt="foto"
          style={imgStyle}
          onClick={onImgClick}
          draggable={false}
        />

        {/* Panel de edición */}
        {showEdit && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            padding: '16px', animation: 'slideUp 0.2s ease',
          }}>
            {/* Herramientas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center' }}>
              {[
                { id: 'crop', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 2 6 8 2 8"/><polyline points="18 22 18 16 22 16"/><path d="M2 8h14a2 2 0 0 1 2 2v10"/><path d="M6 2v10a2 2 0 0 0 2 2h10"/></svg>, label: 'Recortar' },
                { id: 'draw', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>, label: 'Dibujar' },
                { id: 'text', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>, label: 'Texto' },
              ].map(tool => (
                <button key={tool.id} className="iv-btn" onClick={() => setEditMode(m => m === tool.id as any ? null : tool.id as any)} style={btnStyle(editMode === tool.id)}>
                  {tool.icon}
                  <span style={{ fontSize: '10px' }}>{tool.label}</span>
                </button>
              ))}
              {/* Rotar */}
              <button className="iv-btn" onClick={() => setRotation(r => (r + 90) % 360)} style={btnStyle()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                <span style={{ fontSize: '10px' }}>Rotar</span>
              </button>
            </div>

            {/* Sliders brillo/contraste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', width: '60px' }}>☀️ Brillo</span>
                <input type="range" min="50" max="200" value={brightness} onChange={e => setBrightness(+e.target.value)}
                  style={{ flex: 1, accentColor: '#00c8a0', height: '4px' }} />
                <span style={{ color: '#fff', fontSize: '11px', width: '32px', textAlign: 'right' }}>{brightness}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', width: '60px' }}>◑ Contraste</span>
                <input type="range" min="50" max="200" value={contrast} onChange={e => setContrast(+e.target.value)}
                  style={{ flex: 1, accentColor: '#00c8a0', height: '4px' }} />
                <span style={{ color: '#fff', fontSize: '11px', width: '32px', textAlign: 'right' }}>{contrast}%</span>
              </div>
            </div>

            {/* Reset */}
            <button onClick={() => { setBrightness(100); setContrast(100); setRotation(0); setZoom(1); setPan({x:0,y:0}); }}
              style={{ marginTop: '12px', width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', cursor: 'pointer' }}>
              Restablecer
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM BAR ── */}
      {!showEdit && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '14px 16px',
          paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        }}>
          {/* Guardar */}
          <button className="iv-btn" onClick={handleDownload} style={btnStyle()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span style={{ fontSize: '11px' }}>Guardar</span>
          </button>

          {/* Zoom out */}
          <button className="iv-btn" onClick={() => { setZoom(1); setPan({x:0,y:0}); }} style={btnStyle(zoom !== 1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <span style={{ fontSize: '11px' }}>Zoom</span>
          </button>

          {/* Reenviar */}
          <button className="iv-btn" onClick={() => setShowForward(true)} style={{ ...btnStyle(), background: 'rgba(0,200,160,0.2)', border: '1px solid rgba(0,200,160,0.4)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#00c8a0' }}>Reenviar</span>
          </button>

          {/* Copiar enlace */}
          <button className="iv-btn" onClick={async () => { await navigator.clipboard.writeText(url); onShowToast('🔗 Enlace copiado', 'success'); }} style={btnStyle()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span style={{ fontSize: '11px' }}>Copiar</span>
          </button>
        </div>
      )}

      {/* ── MODAL REENVIAR ── */}
      {showForward && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowForward(false)}>
          <div style={{ width: '100%', background: '#1a1a2e', borderRadius: '20px 20px 0 0', padding: '0 0 calc(16px + env(safe-area-inset-bottom,0px))', animation: 'slideUp 0.22s ease', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700' }}>Reenviar a...</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{selectedForward.length} seleccionado{selectedForward.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Buscador */}
            <div style={{ padding: '0 16px 12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={forwardSearch} onChange={e => setForwardSearch(e.target.value)}
                  placeholder="Buscar contacto o grupo..."
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px' }} />
              </div>
            </div>

            {/* Lista de chats */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
              {filteredChats.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '24px', fontSize: '14px' }}>
                  No se encontraron contactos
                </div>
              )}
              {filteredChats.map(chat => {
                const name = chat.title || chat.name || 'Chat';
                const initials = name.slice(0, 2).toUpperCase();
                const isSelected = selectedForward.includes(chat.id);
                return (
                  <div key={chat.id} className={`iv-fwd-item${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedForward(prev => isSelected ? prev.filter(id => id !== chat.id) : [...prev, chat.id])}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s' }}>
                    {/* Avatar */}
                    <div style={{ width: '44px', height: '44px', borderRadius: '22px', background: 'rgba(0,200,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {chat.avatarUrl
                        ? <img src={chat.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: '#00c8a0', fontWeight: '800', fontSize: '15px' }}>{initials}</span>
                      }
                    </div>
                    <span style={{ flex: 1, color: '#fff', fontSize: '15px', fontWeight: '500' }}>{name}</span>
                    {/* Checkbox */}
                    <div style={{ width: '22px', height: '22px', borderRadius: '11px', border: `2px solid ${isSelected ? '#00c8a0' : 'rgba(255,255,255,0.3)'}`, background: isSelected ? '#00c8a0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Caption + Enviar */}
            {selectedForward.length > 0 && (
              <div style={{ padding: '12px 16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <input value={forwardCaption} onChange={e => setForwardCaption(e.target.value)}
                    placeholder="Añadir un mensaje..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '10px 16px', color: '#fff', fontSize: '14px', outline: 'none' }} />
                  <button onClick={handleForwardSend}
                    style={{ width: '46px', height: '46px', borderRadius: '23px', background: 'linear-gradient(135deg,#00c8a0,#0099cc)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
