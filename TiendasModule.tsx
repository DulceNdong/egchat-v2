import React, { useState } from 'react';
import { DocUploader, DocFile } from './DocUploader';

// ─── DATOS ────────────────────────────────────────────────────────────────────

const CIUDADES_T = ['Malabo', 'Bata', 'Ebebiyin', 'Mongomo'];

const TIENDAS = [
  // ── MALABO ──
  { id:'t01', nombre:'Boutique Elegance', ciudad:'Malabo', barrio:'Centro', tipo:'Moda', color:'#C0392B', color2:'#E74C3C', lat:3.7523, lng:8.7741,
    descripcion:'Moda femenina y masculina de marcas internacionales. Ropa, calzado y accesorios.',
    tel:'+240 222 28 01 01', horario:'09:00-20:00', marcas:['Zara','H&M','Mango','Nike','Adidas'],
    categorias:[
      {nombre:'Ropa Mujer', items:[{prod:'Vestido de verano',precio:25000},{prod:'Blusa elegante',precio:18000},{prod:'Pantalón vaquero',precio:22000},{prod:'Falda midi',precio:20000}]},
      {nombre:'Ropa Hombre', items:[{prod:'Camisa formal',precio:20000},{prod:'Pantalón chino',precio:22000},{prod:'Polo casual',precio:15000},{prod:'Traje completo',precio:85000}]},
      {nombre:'Calzado', items:[{prod:'Zapatos de tacón',precio:35000},{prod:'Zapatillas deportivas',precio:28000},{prod:'Mocasines',precio:30000}]},
      {nombre:'Accesorios', items:[{prod:'Bolso de mano',precio:40000},{prod:'Cinturón de cuero',precio:15000},{prod:'Gafas de sol',precio:18000}]},
    ]},
  { id:'t02', nombre:'TechStore Malabo', ciudad:'Malabo', barrio:'Centro', tipo:'Electrónica', color:'#1B3A6B', color2:'#2A5298', lat:3.7512, lng:8.7723,
    descripcion:'Electrónica, smartphones, ordenadores y accesorios tecnológicos.',
    tel:'+240 222 28 01 02', horario:'09:00-19:00', marcas:['Samsung','Apple','Huawei','Xiaomi','HP','Dell','Sony'],
    categorias:[
      {nombre:'Smartphones', items:[{prod:'Samsung Galaxy A54',precio:280000},{prod:'iPhone 14',precio:650000},{prod:'Huawei P50',precio:320000},{prod:'Xiaomi Redmi Note 12',precio:180000}]},
      {nombre:'Ordenadores', items:[{prod:'HP Laptop 15"',precio:450000},{prod:'Dell Inspiron 14"',precio:520000},{prod:'MacBook Air M2',precio:1200000}]},
      {nombre:'Accesorios', items:[{prod:'Auriculares Bluetooth',precio:45000},{prod:'Cargador rápido',precio:15000},{prod:'Funda móvil',precio:8000},{prod:'Smartwatch',precio:85000}]},
      {nombre:'TV y Audio', items:[{prod:'Smart TV 55" Samsung',precio:650000},{prod:'Altavoz Bluetooth',precio:55000},{prod:'Barra de sonido',precio:120000}]},
    ]},
  { id:'t03', nombre:'Hogar & Deco Malabo', ciudad:'Malabo', barrio:'Malabo II', tipo:'Hogar', color:'#065F46', color2:'#00c8a0', lat:3.7389, lng:8.7867,
    descripcion:'Muebles, decoración y artículos para el hogar. Diseño moderno y funcional.',
    tel:'+240 222 28 01 03', horario:'09:00-19:00', marcas:['IKEA','Conforama','Leroy Merlin'],
    categorias:[
      {nombre:'Muebles', items:[{prod:'Sofá 3 plazas',precio:350000},{prod:'Mesa de comedor',precio:180000},{prod:'Cama matrimonial',precio:250000},{prod:'Armario 3 puertas',precio:220000}]},
      {nombre:'Decoración', items:[{prod:'Cuadro decorativo',precio:25000},{prod:'Lámpara de pie',precio:45000},{prod:'Alfombra 2x3m',precio:85000},{prod:'Espejo grande',precio:55000}]},
      {nombre:'Cocina', items:[{prod:'Juego de ollas',precio:65000},{prod:'Batidora',precio:35000},{prod:'Microondas',precio:95000},{prod:'Cafetera',precio:45000}]},
    ]},
  { id:'t04', nombre:'Farmacia Central Malabo', ciudad:'Malabo', barrio:'Centro', tipo:'Farmacia', color:'#16A34A', color2:'#22C55E', lat:3.7534, lng:8.7756,
    descripcion:'Farmacia completa con medicamentos, parafarmacia y productos de salud.',
    tel:'+240 222 28 01 04', horario:'08:00-22:00', marcas:['Bayer','Pfizer','Roche','Novartis'],
    categorias:[
      {nombre:'Medicamentos', items:[{prod:'Paracetamol 500mg x20',precio:2500},{prod:'Ibuprofeno 400mg x20',precio:3000},{prod:'Amoxicilina 500mg x12',precio:8500},{prod:'Vitamina C 1000mg x30',precio:5000}]},
      {nombre:'Higiene', items:[{prod:'Crema hidratante',precio:8000},{prod:'Protector solar SPF50',precio:12000},{prod:'Champú anticaída',precio:9000}]},
      {nombre:'Bebé', items:[{prod:'Pañales Pampers T3 x30',precio:12000},{prod:'Leche de fórmula',precio:18000},{prod:'Crema de pañal',precio:5000}]},
    ]},
  { id:'t05', nombre:'Librería Nacional', ciudad:'Malabo', barrio:'Centro', tipo:'Librería', color:'#7C3AED', color2:'#8B5CF6', lat:3.7521, lng:8.7748,
    descripcion:'Libros, material escolar, papelería y artículos de oficina.',
    tel:'+240 222 28 01 05', horario:'08:30-19:00', marcas:['Santillana','Anaya','SM','Oxford'],
    categorias:[
      {nombre:'Libros Escolares', items:[{prod:'Matemáticas 1º ESO',precio:8500},{prod:'Lengua Española 2º ESO',precio:8000},{prod:'Historia Universal',precio:9000}]},
      {nombre:'Literatura', items:[{prod:'Don Quijote de la Mancha',precio:12000},{prod:'Cien años de soledad',precio:10000},{prod:'El Principito',precio:6000}]},
      {nombre:'Papelería', items:[{prod:'Pack bolígrafos x10',precio:2500},{prod:'Cuaderno A4 x5',precio:4000},{prod:'Mochila escolar',precio:18000}]},
    ]},
  // ── BATA ──
  { id:'t06', nombre:'Moda Bata', ciudad:'Bata', barrio:'Centro', tipo:'Moda', color:'#C0392B', color2:'#E74C3C', lat:1.8639, lng:9.7742,
    descripcion:'Ropa y calzado para toda la familia. Marcas nacionales e internacionales.',
    tel:'+240 222 28 02 01', horario:'09:00-20:00', marcas:['Zara','Nike','Adidas','Puma'],
    categorias:[
      {nombre:'Ropa', items:[{prod:'Camiseta básica',precio:8000},{prod:'Pantalón vaquero',precio:20000},{prod:'Vestido casual',precio:22000}]},
      {nombre:'Calzado', items:[{prod:'Zapatillas deportivas',precio:25000},{prod:'Sandalias',precio:12000},{prod:'Zapatos formales',precio:28000}]},
    ]},
  { id:'t07', nombre:'ElectroShop Bata', ciudad:'Bata', barrio:'Litoral', tipo:'Electrónica', color:'#1B3A6B', color2:'#2A5298', lat:1.8712, lng:9.7698,
    descripcion:'Electrónica y electrodomésticos en Bata. Servicio técnico incluido.',
    tel:'+240 222 28 02 02', horario:'09:00-19:00', marcas:['Samsung','LG','Sony','Xiaomi'],
    categorias:[
      {nombre:'Smartphones', items:[{prod:'Samsung Galaxy A34',precio:220000},{prod:'Xiaomi Redmi 12',precio:150000}]},
      {nombre:'Electrodomésticos', items:[{prod:'Nevera 200L',precio:350000},{prod:'Lavadora 7kg',precio:280000},{prod:'Aire acondicionado',precio:420000}]},
    ]},
  { id:'t08', nombre:'Farmacia Bata Centro', ciudad:'Bata', barrio:'Centro', tipo:'Farmacia', color:'#16A34A', color2:'#22C55E', lat:1.8645, lng:9.7756,
    descripcion:'Farmacia de guardia en el centro de Bata. Abierta 24 horas.',
    tel:'+240 222 28 02 03', horario:'24h', marcas:['Bayer','Pfizer','Roche'],
    categorias:[
      {nombre:'Medicamentos', items:[{prod:'Paracetamol 500mg x20',precio:2500},{prod:'Ibuprofeno 400mg x20',precio:3000},{prod:'Antibióticos',precio:8500}]},
      {nombre:'Higiene', items:[{prod:'Crema solar',precio:10000},{prod:'Champú',precio:7000}]},
    ]},
];

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type TScreen = 'home'|'tienda'|'categoria'|'carrito'|'ok';
type CartItem = { prod: string; precio: number; qty: number; tienda: string };

const TIPO_EMOJI: Record<string,string> = { 'Moda':'👗', 'Electrónica':'📱', 'Hogar':'🏠', 'Farmacia':'💊', 'Librería':'📚' };
const TIPO_FILTROS = ['Todos','Moda','Electrónica','Hogar','Farmacia','Librería'];

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export const TiendasModule: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [screen, setScreen] = useState<TScreen>('home');
  const [ciudad, setCiudad] = useState('Malabo');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [tienda, setTienda] = useState<any>(null);
  const [catIdx, setCatIdx] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState({ nombre:'', telefono:'', direccion:'', pago:'' });
  const setF = (k:string,v:string) => setForm(p=>({...p,[k]:v}));

  const tiendasFiltradas = TIENDAS.filter(t =>
    t.ciudad === ciudad && (tipoFiltro === 'Todos' || t.tipo === tipoFiltro)
  );
  const cartTotal = cart.reduce((s,i)=>s+i.precio*i.qty,0);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const addToCart = (prod:string, precio:number) => {
    setCart(prev => {
      const ex = prev.find(i=>i.prod===prod&&i.tienda===tienda?.nombre);
      if (ex) return prev.map(i=>i.prod===prod&&i.tienda===tienda?.nombre?{...i,qty:i.qty+1}:i);
      return [...prev, {prod,precio,qty:1,tienda:tienda?.nombre||''}];
    });
  };
  const removeFromCart = (prod:string) => setCart(prev=>prev.filter(i=>!(i.prod===prod&&i.tienda===tienda?.nombre)));

  // ── OK ──
  if (screen === 'ok') return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:'56px',marginBottom:'12px'}}>✅</div>
      <div style={{fontSize:'20px',fontWeight:'900',color:'#1A2B4A',marginBottom:'8px'}}>¡Pedido confirmado!</div>
      <div style={{fontSize:'13px',color:'#8A9BB5',marginBottom:'4px'}}>{cart.length} artículo{cart.length>1?'s':''} de {tienda?.nombre}</div>
      <div style={{fontSize:'22px',fontWeight:'900',color:'#065F46',marginBottom:'20px'}}>{cartTotal.toLocaleString()} XAF</div>
      <button onClick={()=>{setScreen('home');setCart([]);setTienda(null);setForm({nombre:'',telefono:'',direccion:'',pago:''});}}
        style={{background:'linear-gradient(135deg,#065F46,#00c8a0)',border:'none',borderRadius:'12px',padding:'13px 32px',color:'#fff',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>
        Seguir comprando
      </button>
    </div>
  );

  // ── CARRITO ──
  if (screen === 'carrito') return (
    <div style={{padding:'14px 16px 24px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
        <button onClick={()=>setScreen('tienda')} style={{background:'#F3F4F6',border:'none',borderRadius:'8px',padding:'6px 12px',fontSize:'12px',fontWeight:'700',color:'#374151',cursor:'pointer'}}>← Volver</button>
        <div style={{fontSize:'16px',fontWeight:'800',color:'#1A2B4A'}}>🛒 Carrito ({cartCount})</div>
      </div>
      {cart.map((item,i)=>(
        <div key={i} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{item.prod}</div>
            <div style={{fontSize:'11px',color:'#8A9BB5'}}>{item.tienda}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'13px',fontWeight:'800',color:'#065F46'}}>{(item.precio*item.qty).toLocaleString()} XAF</div>
            <div style={{fontSize:'10px',color:'#8A9BB5'}}>x{item.qty} · {item.precio.toLocaleString()} c/u</div>
          </div>
          <button onClick={()=>removeFromCart(item.prod)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'4px 8px',fontSize:'12px',color:'#DC2626',cursor:'pointer'}}>✕</button>
        </div>
      ))}
      {cart.length === 0 && <div style={{textAlign:'center',padding:'20px',color:'#9CA3AF',fontSize:'13px'}}>El carrito está vacío</div>}
      {cart.length > 0 && (
        <>
          <div style={{background:'#F0FAF5',borderRadius:'10px',padding:'12px 14px',marginBottom:'12px',border:'1px solid #BBF7D0'}}>
            <div style={{fontSize:'11px',color:'#065F46',marginBottom:'4px',fontWeight:'600'}}>Total del pedido</div>
            <div style={{fontSize:'22px',fontWeight:'900',color:'#065F46'}}>{cartTotal.toLocaleString()} XAF</div>
          </div>
          {[{k:'nombre',l:'Nombre completo',t:'text'},{k:'telefono',l:'Teléfono',t:'tel'},{k:'direccion',l:'Dirección de entrega',t:'text'}].map(f=>(
            <div key={f.k} style={{background:'#fff',borderRadius:'10px',padding:'0 14px',marginBottom:'8px',display:'flex',alignItems:'center',height:'50px',border:'1px solid #F0F2F5'}}>
              <input type={f.t} placeholder={f.l} value={(form as any)[f.k]} onChange={e=>setF(f.k,e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:'13px',color:'#111827',fontFamily:'inherit'}}/>
            </div>
          ))}
          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            {[{id:'wallet',l:'EGCHAT'},{id:'bank',l:'Banco'},{id:'cash',l:'Efectivo'}].map(m=>(
              <button key={m.id} onClick={()=>setF('pago',m.id)}
                style={{flex:1,background:form.pago===m.id?'#F0FAF5':'#F9FAFB',border:`1.5px solid ${form.pago===m.id?'#065F46':'#E5E7EB'}`,borderRadius:'10px',padding:'8px 4px',fontSize:'10px',fontWeight:'700',color:form.pago===m.id?'#065F46':'#6B7280',cursor:'pointer'}}>
                {m.l}
              </button>
            ))}
          </div>
          <button onClick={()=>{if(form.nombre&&form.telefono&&form.direccion&&form.pago)setScreen('ok');}}
            style={{width:'100%',background:form.nombre&&form.telefono&&form.direccion&&form.pago?'linear-gradient(135deg,#065F46,#00c8a0)':'#E5E7EB',border:'none',borderRadius:'12px',padding:'14px',color:form.nombre&&form.telefono&&form.direccion&&form.pago?'#fff':'#9CA3AF',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>
            Confirmar pedido · {cartTotal.toLocaleString()} XAF
          </button>
        </>
      )}
    </div>
  );

  // ── DETALLE TIENDA ──
  if (screen === 'tienda' && tienda) {
    const cat = tienda.categorias[catIdx];
    return (
      <div style={{paddingBottom:'24px'}}>
        <div style={{background:`linear-gradient(135deg,${tienda.color},${tienda.color2})`,padding:'16px'}}>
          <button onClick={()=>setScreen('home')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'8px',padding:'6px 12px',color:'#fff',fontSize:'12px',fontWeight:'700',cursor:'pointer',marginBottom:'10px'}}>← Volver</button>
          <div style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'17px',fontWeight:'900',color:'#fff'}}>{tienda.nombre}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{TIPO_EMOJI[tienda.tipo]} {tienda.tipo} · {tienda.barrio} · {tienda.horario}</div>
            </div>
            {cartCount>0&&<button onClick={()=>setScreen('carrito')} style={{background:'rgba(255,255,255,0.25)',border:'none',borderRadius:'20px',padding:'6px 12px',color:'#fff',fontSize:'11px',fontWeight:'700',cursor:'pointer'}}>🛒 {cartCount}</button>}
          </div>
        </div>
        <div style={{padding:'12px 16px 0'}}>
          {/* GPS */}
          <a href={`https://maps.google.com/?q=${tienda.lat},${tienda.lng}`} target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',gap:'8px',background:'#EFF5FD',border:'1px solid #BFDBFE',borderRadius:'10px',padding:'8px 14px',marginBottom:'10px',textDecoration:'none',color:'#1B3A6B',fontSize:'12px',fontWeight:'700'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Ver en Google Maps · {tienda.barrio}, {tienda.ciudad}
          </a>
          {/* Marcas */}
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'12px'}}>
            {tienda.marcas.map((m:string)=>(
              <span key={m} style={{background:'#F3F4F6',color:'#374151',borderRadius:'6px',padding:'3px 8px',fontSize:'10px',fontWeight:'600'}}>{m}</span>
            ))}
          </div>
          {/* Tabs categorías */}
          <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'8px',marginBottom:'10px'}}>
            {tienda.categorias.map((c:any,i:number)=>(
              <button key={i} onClick={()=>setCatIdx(i)}
                style={{flexShrink:0,background:catIdx===i?tienda.color:'#F3F4F6',border:'none',borderRadius:'20px',padding:'5px 12px',fontSize:'11px',fontWeight:'700',color:catIdx===i?'#fff':'#6B7280',cursor:'pointer'}}>
                {c.nombre}
              </button>
            ))}
          </div>
          {/* Productos */}
          {cat.items.map((item:any,i:number)=>{
            const inCart = cart.find(c=>c.prod===item.prod&&c.tienda===tienda.nombre);
            return (
              <div key={i} style={{background:'#fff',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#111827'}}>{item.prod}</div>
                  <div style={{fontSize:'13px',fontWeight:'800',color:tienda.color,marginTop:'2px'}}>{item.precio.toLocaleString()} XAF</div>
                </div>
                {inCart ? (
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <button onClick={()=>removeFromCart(item.prod)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',width:'28px',height:'28px',fontSize:'14px',color:'#DC2626',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                    <span style={{fontSize:'13px',fontWeight:'700',color:'#111827',minWidth:'16px',textAlign:'center'}}>{inCart.qty}</span>
                    <button onClick={()=>addToCart(item.prod,item.precio)} style={{background:`${tienda.color}20`,border:'none',borderRadius:'8px',width:'28px',height:'28px',fontSize:'14px',color:tienda.color,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                  </div>
                ) : (
                  <button onClick={()=>addToCart(item.prod,item.precio)}
                    style={{background:`linear-gradient(135deg,${tienda.color},${tienda.color2})`,border:'none',borderRadius:'10px',padding:'7px 14px',fontSize:'11px',fontWeight:'700',color:'#fff',cursor:'pointer'}}>
                    Añadir
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── HOME ──
  return (
    <div style={{paddingBottom:'24px'}}>
      <div style={{background:'linear-gradient(135deg,#065F46,#00c8a0)',padding:'16px 16px 14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
          <div style={{fontSize:'32px'}}>🛍️</div>
          <div>
            <div style={{fontSize:'18px',fontWeight:'900',color:'#fff'}}>Tiendas</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.8)'}}>{TIENDAS.length} tiendas · Guinea Ecuatorial</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
          {CIUDADES_T.map(c=>(
            <button key={c} onClick={()=>setCiudad(c)}
              style={{flexShrink:0,background:ciudad===c?'#fff':'rgba(255,255,255,0.2)',border:'none',borderRadius:'20px',padding:'5px 14px',fontSize:'11px',fontWeight:'700',color:ciudad===c?'#065F46':'#fff',cursor:'pointer'}}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {/* Filtro tipo */}
      <div style={{display:'flex',gap:'6px',padding:'10px 16px 6px',overflowX:'auto'}}>
        {TIPO_FILTROS.map(t=>(
          <button key={t} onClick={()=>setTipoFiltro(t)}
            style={{flexShrink:0,background:tipoFiltro===t?'#065F46':'#fff',border:`1px solid ${tipoFiltro===t?'#065F46':'#E5E7EB'}`,borderRadius:'20px',padding:'5px 12px',fontSize:'11px',fontWeight:'700',color:tipoFiltro===t?'#fff':'#6B7280',cursor:'pointer'}}>
            {t !== 'Todos' ? TIPO_EMOJI[t]+' ' : ''}{t}
          </button>
        ))}
      </div>
      <div style={{padding:'6px 16px 0'}}>
        {/* Mosaico */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          {tiendasFiltradas.map(t=>(
            <div key={t.id} onClick={()=>{setTienda(t);setCatIdx(0);setScreen('tienda');}}
              style={{background:'#fff',borderRadius:'16px',padding:'14px',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',border:'1px solid #F0F2F5',transition:'transform 0.15s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                <div style={{background:`linear-gradient(135deg,${t.color},${t.color2})`,borderRadius:'10px',padding:'8px',fontSize:'20px'}}>{TIPO_EMOJI[t.tipo]}</div>
                <span style={{background:`${t.color}15`,color:t.color,borderRadius:'6px',padding:'2px 8px',fontSize:'10px',fontWeight:'700'}}>{t.tipo}</span>
              </div>
              <div style={{fontSize:'12px',fontWeight:'800',color:'#1A2B4A',marginBottom:'2px',lineHeight:'1.3'}}>{t.nombre}</div>
              <div style={{fontSize:'10px',color:'#8A9BB5',marginBottom:'6px'}}>📍 {t.barrio}</div>
              <div style={{fontSize:'10px',color:'#8A9BB5'}}>🕐 {t.horario}</div>
              <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'6px'}}>
                {t.marcas.slice(0,3).map((m:string)=>(
                  <span key={m} style={{background:'#F3F4F6',color:'#6B7280',borderRadius:'4px',padding:'1px 5px',fontSize:'9px',fontWeight:'600'}}>{m}</span>
                ))}
                {t.marcas.length>3&&<span style={{background:'#F3F4F6',color:'#6B7280',borderRadius:'4px',padding:'1px 5px',fontSize:'9px'}}>+{t.marcas.length-3}</span>}
              </div>
            </div>
          ))}
        </div>
        {tiendasFiltradas.length===0&&<div style={{textAlign:'center',padding:'30px',color:'#9CA3AF',fontSize:'13px'}}>No hay tiendas en {ciudad} con este filtro</div>}
      </div>
    </div>
  );
};
