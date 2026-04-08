import React from 'react';

interface Props {
  chatId: string;
  onClose: () => void;
  onPhotoTaken: (url: string, chatId: string) => void;
}

export const CameraModal: React.FC<Props> = ({ chatId, onClose, onPhotoTaken }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = React.useState(false);
  const [camError, setCamError] = React.useState('');
  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('environment');
  const [flash, setFlash] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);

  const startCamera = React.useCallback(async () => {
    setCamReady(false); setCamError('');
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      // Máxima calidad posible
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setCamReady(true); };
      }
    } catch {
      // Fallback a calidad estándar
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setCamReady(true); };
        }
      } catch (e: any) { setCamError(e.message || 'No se pudo acceder a la cámara'); }
    }
  }, [facingMode]);

  React.useEffect(() => { startCamera(); return () => { streamRef.current?.getTracks().forEach(t => t.stop()); }; }, [startCamera]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !camReady) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    // Captura en resolución nativa del stream
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    if (facingMode === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0);
    // Máxima calidad JPEG
    const url = c.toDataURL('image/jpeg', 1.0);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onPhotoTaken(url, chatId);
  };

  const pickFromGallery = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
      if (inp.files?.[0]) {
        const r = new FileReader();
        r.onload = e => { streamRef.current?.getTracks().forEach(t => t.stop()); onPhotoTaken(e.target?.result as string, chatId); };
        r.readAsDataURL(inp.files[0]);
      }
    };
    inp.click();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:5000, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(0,0,0,0.5)', flexShrink:0 }}>
        <button onClick={() => { streamRef.current?.getTracks().forEach(t=>t.stop()); onClose(); }}
          style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', padding:'6px', display:'flex', borderRadius:'50%' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ fontSize:'14px', fontWeight:'600', color:'#fff' }}>Cámara</div>
        <button onClick={() => setFacingMode(p => p==='environment'?'user':'environment')}
          style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', cursor:'pointer', padding:'8px', display:'flex', borderRadius:'50%' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
      </div>

      {/* Visor */}
      <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
        {camError ? (
          <div style={{ textAlign:'center', color:'#fff', padding:'32px' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" style={{ margin:'0 auto 16px', display:'block' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
            <div style={{ fontSize:'15px', fontWeight:'700', marginBottom:'8px' }}>Sin acceso a la cámara</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginBottom:'20px', lineHeight:'1.5' }}>{camError}</div>
            <button onClick={pickFromGallery} style={{ background:'#00c8a0', border:'none', borderRadius:'12px', padding:'11px 24px', color:'#fff', fontSize:'13px', fontWeight:'700', cursor:'pointer', marginBottom:'10px', display:'block', width:'100%' }}>
              Elegir de la galería
            </button>
            <button onClick={() => { streamRef.current?.getTracks().forEach(t=>t.stop()); onClose(); }}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'12px', padding:'11px 24px', color:'#fff', fontSize:'13px', fontWeight:'600', cursor:'pointer', width:'100%' }}>
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width:'100%', height:'100%', objectFit:'cover', transform:`scale(${zoom}) ${facingMode==='user'?'scaleX(-1)':''}`, transition:'transform 0.2s' }}/>
            {/* Guía de encuadre */}
            {camReady && (
              <div style={{ position:'absolute', inset:'12%', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'4px', pointerEvents:'none' }}>
                {(['tl','tr','bl','br'] as const).map(c=>(
                  <div key={c} style={{ position:'absolute', width:'22px', height:'22px',
                    top:c.startsWith('t')?'-1px':'auto', bottom:c.startsWith('b')?'-1px':'auto',
                    left:c.endsWith('l')?'-1px':'auto', right:c.endsWith('r')?'-1px':'auto',
                    borderTop:c.startsWith('t')?'3px solid #fff':'none', borderBottom:c.startsWith('b')?'3px solid #fff':'none',
                    borderLeft:c.endsWith('l')?'3px solid #fff':'none', borderRight:c.endsWith('r')?'3px solid #fff':'none',
                  }}/>
                ))}
              </div>
            )}
            {/* Flash overlay */}
            {flash && <div style={{ position:'absolute', inset:0, background:'#fff', opacity:0.8, pointerEvents:'none' }}/>}
            {/* Zoom slider */}
            {camReady && (
              <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                <span style={{ color:'#fff', fontSize:'10px', fontWeight:'700' }}>{zoom.toFixed(1)}x</span>
                <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={e=>setZoom(parseFloat(e.target.value))}
                  style={{ writingMode:'vertical-lr', direction:'rtl', height:'80px', cursor:'pointer', accentColor:'#00c8a0' }}/>
              </div>
            )}
            {!camReady && (
              <div style={{ position:'absolute', color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff' }}/>
                Iniciando cámara...
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} style={{ display:'none' }}/>
      </div>

      {/* Controles */}
      {!camError && (
        <div style={{ background:'rgba(0,0,0,0.75)', padding:'20px 32px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <button onClick={pickFromGallery}
            style={{ width:'50px', height:'50px', borderRadius:'12px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          {/* Disparador */}
          <button onClick={() => { setFlash(true); setTimeout(()=>setFlash(false),150); setTimeout(capture,80); }}
            disabled={!camReady}
            style={{ width:'76px', height:'76px', borderRadius:'50%', background:'transparent', border:'4px solid rgba(255,255,255,0.6)', cursor:camReady?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.1s' }}
            onMouseDown={e=>{e.currentTarget.style.transform='scale(0.92)';}} onMouseUp={e=>{e.currentTarget.style.transform='scale(1)';}}>
            <div style={{ width:'62px', height:'62px', borderRadius:'50%', background:camReady?'#fff':'rgba(255,255,255,0.3)' }}/>
          </button>
          <div style={{ width:'50px' }}/>
        </div>
      )}
    </div>
  );
};
