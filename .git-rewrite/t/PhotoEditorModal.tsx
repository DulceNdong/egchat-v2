import React from 'react';

interface Props {
  photoUrl: string;
  chatId: string;
  onClose: () => void;
  onSend: (chatId: string, caption: string, editedUrl: string) => void;
}

type Tool = 'filters' | 'adjust' | 'crop' | 'rotate' | 'text';

const FILTERS = [
  { id:'none',   label:'Original', fn:(b:number,c:number,s:number)=>`brightness(${b}%) contrast(${c}%) saturate(${s}%)` },
  { id:'bw',     label:'B&N',      fn:(b:number,c:number,s:number)=>`grayscale(100%) brightness(${b}%) contrast(${c}%)` },
  { id:'warm',   label:'Cálido',   fn:(b:number,c:number,s:number)=>`sepia(40%) saturate(${s*1.2}%) brightness(${b}%) contrast(${c}%)` },
  { id:'cool',   label:'Frío',     fn:(b:number,c:number,s:number)=>`hue-rotate(30deg) saturate(${s*1.1}%) brightness(${b}%) contrast(${c}%)` },
  { id:'vivid',  label:'Vívido',   fn:(b:number,c:number,s:number)=>`saturate(${s*1.8}%) contrast(${c*1.1}%) brightness(${b}%)` },
  { id:'fade',   label:'Fade',     fn:(b:number,c:number,s:number)=>`opacity(0.88) saturate(${s*0.7}%) brightness(${b*1.05}%) contrast(${c*0.9}%)` },
  { id:'drama',  label:'Drama',    fn:(b:number,c:number,s:number)=>`contrast(${c*1.3}%) brightness(${b*0.9}%) saturate(${s*1.2}%)` },
  { id:'retro',  label:'Retro',    fn:(b:number,c:number,s:number)=>`sepia(60%) hue-rotate(-10deg) saturate(${s*0.8}%) brightness(${b}%)` },
];

export const PhotoEditorModal: React.FC<Props> = ({ photoUrl, chatId, onClose, onSend }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const [tool, setTool] = React.useState<Tool>('filters');
  const [filter, setFilter] = React.useState('none');
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [flipH, setFlipH] = React.useState(false);
  const [caption, setCaption] = React.useState('');
  const [overlayText, setOverlayText] = React.useState('');
  const [showTextInput, setShowTextInput] = React.useState(false);
  const [textInput, setTextInput] = React.useState('');

  const currentFilterDef = FILTERS.find(f => f.id === filter) || FILTERS[0];
  const cssFilter = currentFilterDef.fn(brightness, contrast, saturation);
  const transform = `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`;

  const exportAndSend = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Aplicar rotación
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate((rotation * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);
    ctx.translate(-w/2, -h/2);

    // Aplicar filtros CSS via offscreen
    ctx.filter = cssFilter;
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();

    // Texto superpuesto
    if (overlayText) {
      ctx.font = `bold ${Math.max(24, w/20)}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = Math.max(2, w/200);
      ctx.textAlign = 'center';
      ctx.strokeText(overlayText, w/2, h - h/8);
      ctx.fillText(overlayText, w/2, h - h/8);
    }

    const url = canvas.toDataURL('image/jpeg', 0.95);
    onSend(chatId, caption, url);
  };

  const TOOLS: {id:Tool; icon:React.ReactNode; label:string}[] = [
    { id:'filters', label:'Filtros', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
    { id:'adjust',  label:'Ajustar', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
    { id:'rotate',  label:'Rotar',   icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
    { id:'text',    label:'Texto',   icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'#1a1a1a', zIndex:5000, display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'rgba(0,0,0,0.6)', flexShrink:0 }}>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:'6px', display:'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize:'14px', fontWeight:'600', color:'#fff' }}>Editar foto</div>
        <button onClick={exportAndSend}
          style={{ background:'#00c8a0', border:'none', borderRadius:'20px', padding:'7px 18px', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:'pointer' }}>
          Enviar
        </button>
      </div>

      {/* Preview */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'#111', position:'relative' }}>
        <img ref={imgRef} src={photoUrl} alt="edit"
          style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', filter:cssFilter, transform, transition:'all 0.2s' }}
          crossOrigin="anonymous"/>
        {overlayText && (
          <div style={{ position:'absolute', bottom:'12%', left:0, right:0, textAlign:'center', fontSize:'22px', fontWeight:'800', color:'#fff', textShadow:'0 2px 8px rgba(0,0,0,0.8)', pointerEvents:'none', padding:'0 16px' }}>
            {overlayText}
          </div>
        )}
        <canvas ref={canvasRef} style={{ display:'none' }}/>
      </div>

      {/* Panel de herramientas */}
      <div style={{ background:'rgba(0,0,0,0.85)', flexShrink:0 }}>

        {/* Filtros */}
        {tool==='filters'&&(
          <div style={{ padding:'10px 16px 8px' }}>
            <div style={{ display:'flex', gap:'8px', overflowX:'auto', scrollbarWidth:'none', paddingBottom:'4px' }}>
              {FILTERS.map(f=>(
                <button key={f.id} onClick={()=>setFilter(f.id)}
                  style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', padding:'4px' }}>
                  <div style={{ width:'52px', height:'52px', borderRadius:'10px', overflow:'hidden', border:`2px solid ${filter===f.id?'#00c8a0':'transparent'}`, position:'relative' }}>
                    <img src={photoUrl} alt={f.label} style={{ width:'100%', height:'100%', objectFit:'cover', filter:f.fn(brightness,contrast,saturation) }}/>
                  </div>
                  <span style={{ fontSize:'10px', color:filter===f.id?'#00c8a0':'rgba(255,255,255,0.7)', fontWeight:filter===f.id?'700':'500' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ajustes */}
        {tool==='adjust'&&(
          <div style={{ padding:'12px 20px 8px' }}>
            {[
              { label:'Brillo', value:brightness, set:setBrightness, min:50, max:150 },
              { label:'Contraste', value:contrast, set:setContrast, min:50, max:200 },
              { label:'Saturación', value:saturation, set:setSaturation, min:0, max:200 },
            ].map(s=>(
              <div key={s.label} style={{ marginBottom:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', fontWeight:'600' }}>{s.label}</span>
                  <span style={{ fontSize:'11px', color:'#00c8a0', fontWeight:'700' }}>{s.value}%</span>
                </div>
                <input type="range" min={s.min} max={s.max} value={s.value} onChange={e=>s.set(parseInt(e.target.value))}
                  style={{ width:'100%', accentColor:'#00c8a0', cursor:'pointer' }}/>
              </div>
            ))}
            <button onClick={()=>{setBrightness(100);setContrast(100);setSaturation(100);}}
              style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'8px', padding:'6px 14px', color:'rgba(255,255,255,0.7)', fontSize:'11px', cursor:'pointer', fontWeight:'600' }}>
              Restablecer
            </button>
          </div>
        )}

        {/* Rotar / Voltear */}
        {tool==='rotate'&&(
          <div style={{ padding:'12px 20px 8px', display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {[
              { label:'↺ -90°', action:()=>setRotation(r=>(r-90+360)%360) },
              { label:'↻ +90°', action:()=>setRotation(r=>(r+90)%360) },
              { label:'↔ Voltear', action:()=>setFlipH(p=>!p) },
              { label:'⟳ Restablecer', action:()=>{setRotation(0);setFlipH(false);} },
            ].map(b=>(
              <button key={b.label} onClick={b.action}
                style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'9px 16px', color:'#fff', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                {b.label}
              </button>
            ))}
            <div style={{ width:'100%', marginTop:'4px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', fontWeight:'600' }}>Ángulo libre</span>
                <span style={{ fontSize:'11px', color:'#00c8a0', fontWeight:'700' }}>{rotation}°</span>
              </div>
              <input type="range" min="0" max="359" value={rotation} onChange={e=>setRotation(parseInt(e.target.value))}
                style={{ width:'100%', accentColor:'#00c8a0', cursor:'pointer' }}/>
            </div>
          </div>
        )}

        {/* Texto */}
        {tool==='text'&&(
          <div style={{ padding:'12px 20px 8px' }}>
            {showTextInput ? (
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <input autoFocus value={textInput} onChange={e=>setTextInput(e.target.value)}
                  placeholder="Escribe el texto..."
                  style={{ flex:1, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'9px 14px', color:'#fff', fontSize:'13px', outline:'none', fontFamily:'inherit' }}/>
                <button onClick={()=>{setOverlayText(textInput);setShowTextInput(false);}}
                  style={{ background:'#00c8a0', border:'none', borderRadius:'10px', padding:'9px 16px', color:'#fff', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>OK</button>
                <button onClick={()=>{setShowTextInput(false);setTextInput('');}}
                  style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'10px', padding:'9px 12px', color:'#fff', fontSize:'12px', cursor:'pointer' }}>✕</button>
              </div>
            ) : (
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={()=>{setTextInput(overlayText);setShowTextInput(true);}}
                  style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'9px 18px', color:'#fff', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                  {overlayText ? '✏️ Editar texto' : '+ Añadir texto'}
                </button>
                {overlayText && (
                  <button onClick={()=>setOverlayText('')}
                    style={{ background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', padding:'9px 14px', color:'#EF4444', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                    Quitar texto
                  </button>
                )}
              </div>
            )}
            {overlayText && <div style={{ marginTop:'8px', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>Vista previa: "{overlayText}"</div>}
          </div>
        )}

        {/* Barra de herramientas */}
        <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'6px 0' }}>
          {TOOLS.map(t=>(
            <button key={t.id} onClick={()=>setTool(t.id)}
              style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'8px 4px', color:tool===t.id?'#00c8a0':'rgba(255,255,255,0.5)', transition:'color 0.15s' }}>
              {t.icon}
              <span style={{ fontSize:'10px', fontWeight:tool===t.id?'700':'500' }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Caption */}
        <div style={{ padding:'8px 16px 16px', display:'flex', alignItems:'center', gap:'10px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:'24px', padding:'0 16px', height:'40px', display:'flex', alignItems:'center', border:'1px solid rgba(255,255,255,0.15)' }}>
            <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Añade un pie de foto..."
              style={{ flex:1, background:'none', border:'none', outline:'none', color:'#fff', fontSize:'13px', fontFamily:'inherit' }}/>
          </div>
          <button onClick={exportAndSend}
            style={{ width:'44px', height:'44px', borderRadius:'50%', background:'#00c8a0', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(0,200,160,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
