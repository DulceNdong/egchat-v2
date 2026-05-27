import React, { useState } from 'react';

// ─── DATOS ────────────────────────────────────────────────────────────────────

const CIUDADES_H = ['Malabo', 'Bata', 'Ebebiyin', 'Mongomo'];

const HOTELES = [
  { id:'h01', nombre:'Hotel Bahía', ciudad:'Malabo', barrio:'Puerto', estrellas:4, color:'#0A4A8A', color2:'#00b4e6',
    descripcion:'Hotel de lujo frente al mar con vistas a la bahía de Malabo. Restaurante, piscina y spa.',
    tel:'+240 222 27 01 01', web:'hotelbahia.gq', lat:3.7612, lng:8.7698,
    servicios:['Piscina','Spa','Restaurante','Bar','WiFi','Parking','Gimnasio','Sala de reuniones'],
    habitaciones:[
      {tipo:'Individual',precio:45000,desc:'Cama individual, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
      {tipo:'Doble Estándar',precio:65000,desc:'Cama doble, baño privado, AC, TV, WiFi, minibar',disponible:true,img:'🛏️'},
      {tipo:'Suite Junior',precio:95000,desc:'Sala de estar, cama king, jacuzzi, vistas al mar',disponible:true,img:'🏨'},
      {tipo:'Suite Presidencial',precio:180000,desc:'2 habitaciones, sala, cocina, terraza privada con vistas',disponible:false,img:'👑'},
    ]},
  { id:'h02', nombre:'Hotel Impala', ciudad:'Malabo', barrio:'Centro', estrellas:3, color:'#1B3A6B', color2:'#2A5298',
    descripcion:'Hotel céntrico con excelente relación calidad-precio. Ideal para viajes de negocios.',
    tel:'+240 222 27 01 02', web:'hotelimpala.gq', lat:3.7523, lng:8.7741,
    servicios:['Restaurante','Bar','WiFi','Parking','Sala de reuniones','Lavandería'],
    habitaciones:[
      {tipo:'Individual',precio:28000,desc:'Cama individual, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
      {tipo:'Doble',precio:38000,desc:'Cama doble, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
      {tipo:'Triple',precio:52000,desc:'3 camas individuales, baño privado, AC, TV',disponible:true,img:'🛏️'},
      {tipo:'Suite',precio:75000,desc:'Sala de estar, cama king, baño con bañera',disponible:true,img:'🏨'},
    ]},
  { id:'h03', nombre:'Sofitel Malabo Sipopo', ciudad:'Malabo', barrio:'Sipopo', estrellas:5, color:'#8B0000', color2:'#C0392B',
    descripcion:'El hotel más lujoso de Guinea Ecuatorial. Complejo de lujo con playa privada y campo de golf.',
    tel:'+240 222 27 01 03', web:'sofitel-malabo.com', lat:3.7834, lng:8.8012,
    servicios:['Playa privada','Golf','Piscina','Spa','2 Restaurantes','Bar','WiFi','Parking','Helipuerto','Sala de conferencias'],
    habitaciones:[
      {tipo:'Habitación Deluxe',precio:120000,desc:'Cama king, terraza, vistas al mar, minibar, jacuzzi',disponible:true,img:'🏨'},
      {tipo:'Suite Junior',precio:180000,desc:'Sala de estar, cama king, terraza privada, butler service',disponible:true,img:'👑'},
      {tipo:'Suite Presidencial',precio:350000,desc:'3 habitaciones, sala, cocina, piscina privada, butler 24h',disponible:true,img:'👑'},
    ]},
  { id:'h04', nombre:'Aparthotel GQ Malabo', ciudad:'Malabo', barrio:'Malabo II', estrellas:3, color:'#6B5BD6', color2:'#7C3AED',
    descripcion:'Apartamentos totalmente equipados para estancias largas. Cocina completa en cada unidad.',
    tel:'+240 222 27 01 04', web:'aparthotelgq.gq', lat:3.7389, lng:8.7867,
    servicios:['Cocina equipada','WiFi','Parking','Lavandería','Seguridad 24h'],
    habitaciones:[
      {tipo:'Estudio',precio:35000,desc:'Cama doble, cocina americana, baño, AC, TV',disponible:true,img:'🏠'},
      {tipo:'Apartamento 1 hab.',precio:55000,desc:'Dormitorio, sala, cocina completa, baño, AC',disponible:true,img:'🏠'},
      {tipo:'Apartamento 2 hab.',precio:80000,desc:'2 dormitorios, sala, cocina completa, 2 baños',disponible:true,img:'🏠'},
    ]},
  { id:'h05', nombre:'Hotel Ureca', ciudad:'Malabo', barrio:'Aeropuerto', estrellas:3, color:'#065F46', color2:'#00c8a0',
    descripcion:'Hotel junto al aeropuerto de Malabo. Ideal para tránsitos y viajeros de negocios.',
    tel:'+240 222 27 01 05', web:'hotelureca.gq', lat:3.7267, lng:8.7089,
    servicios:['Shuttle aeropuerto','Restaurante','Bar','WiFi','Parking','Sala de reuniones'],
    habitaciones:[
      {tipo:'Individual',precio:32000,desc:'Cama individual, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
      {tipo:'Doble',precio:45000,desc:'Cama doble, baño privado, AC, TV, WiFi, minibar',disponible:true,img:'🛏️'},
    ]},
  { id:'h06', nombre:'Hotel Bata Plaza', ciudad:'Bata', barrio:'Centro', estrellas:4, color:'#0A4A8A', color2:'#00b4e6',
    descripcion:'Principal hotel de Bata. Vistas al Atlántico, restaurante de mariscos y piscina.',
    tel:'+240 222 27 02 01', web:'hotelbataplaza.gq', lat:1.8639, lng:9.7742,
    servicios:['Piscina','Restaurante','Bar','WiFi','Parking','Sala de reuniones','Spa'],
    habitaciones:[
      {tipo:'Individual',precio:38000,desc:'Cama individual, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
      {tipo:'Doble',precio:55000,desc:'Cama doble, baño privado, AC, TV, WiFi, minibar',disponible:true,img:'🛏️'},
      {tipo:'Suite',precio:90000,desc:'Sala de estar, cama king, jacuzzi, vistas al mar',disponible:true,img:'🏨'},
    ]},
  { id:'h07', nombre:'Hotel Litoral Bata', ciudad:'Bata', barrio:'Litoral', estrellas:3, color:'#C47D2A', color2:'#F59E0B',
    descripcion:'Hotel frente al mar en Bata. Ambiente familiar y precios accesibles.',
    tel:'+240 222 27 02 02', web:'hotellitoralbata.gq', lat:1.8712, lng:9.7698,
    servicios:['Restaurante','Bar','WiFi','Parking','Playa cercana'],
    habitaciones:[
      {tipo:'Individual',precio:22000,desc:'Cama individual, baño privado, AC, TV',disponible:true,img:'🛏️'},
      {tipo:'Doble',precio:32000,desc:'Cama doble, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
      {tipo:'Familiar',precio:48000,desc:'2 camas dobles, baño privado, AC, TV, WiFi',disponible:true,img:'🛏️'},
    ]},
  { id:'h08', nombre:'Hotel Ebebiyin', ciudad:'Ebebiyin', barrio:'Centro', estrellas:2, color:'#374151', color2:'#6B7280',
    descripcion:'Hotel sencillo y cómodo en el centro de Ebebiyin. Buena relación calidad-precio.',
    tel:'+240 222 27 03 01', web:'', lat:1.1512, lng:11.3345,
    servicios:['Restaurante','WiFi','Parking'],
    habitaciones:[
      {tipo:'Individual',precio:15000,desc:'Cama individual, baño compartido, AC, TV',disponible:true,img:'🛏️'},
      {tipo:'Doble',precio:22000,desc:'Cama doble, baño privado, AC, TV',disponible:true,img:'🛏️'},
    ]},
  { id:'h09', nombre:'Hotel Mongomo', ciudad:'Mongomo', barrio:'Centro', estrellas:2, color:'#374151', color2:'#6B7280',
    descripcion:'Alojamiento confortable en Mongomo. Ideal para viajeros de paso.',
    tel:'+240 222 27 04 01', web:'', lat:1.6278, lng:13.6123,
    servicios:['Restaurante','WiFi','Parking'],
    habitaciones:[
      {tipo:'Individual',precio:14000,desc:'Cama individual, baño privado, AC, TV',disponible:true,img:'🛏️'},
      {tipo:'Doble',precio:20000,desc:'Cama doble, baño privado, AC, TV',disponible:true,img:'🛏️'},
    ]},
];

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type HScreen = 'home'|'hotel'|'habitacion'|'reserva'|'ok';

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export const HotelesModule: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [screen, setScreen] = useState<HScreen>('home');
  const [ciudad, setCiudad] = useState('Malabo');
  const [hotel, setHotel] = useState<any>(null);
  const [hab, setHab] = useState<any>(null);
  const [form, setForm] = useState({ nombre:'', dni:'', telefono:'', email:'', checkin:'', checkout:'', huespedes:'1', notas:'', pago:'' });
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const hotelesFiltrados = HOTELES.filter(h => h.ciudad === ciudad);
  const noches = (() => {
    if (!form.checkin || !form.checkout) return 1;
    const [d1,m1,y1] = form.checkin.split('/').map(Number);
    const [d2,m2,y2] = form.checkout.split('/').map(Number);
    const diff = (new Date(y2,m2-1,d2).getTime() - new Date(y1,m1-1,d1).getTime()) / 86400000;
    return diff > 0 ? diff : 1;
  })();
  const total = hab ? hab.precio * noches : 0;

  const estrellas = (n: number) => '⭐'.repeat(n);

  // ── OK ──
  if (screen === 'ok') return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:'56px', marginBottom:'12px' }}>✅</div>
      <div style={{ fontSize:'20px', fontWeight:'900', color:'#1A2B4A', marginBottom:'8px' }}>¡Reserva confirmada!</div>
      <div style={{ fontSize:'13px', color:'#8A9BB5', marginBottom:'4px' }}>{hotel?.nombre} · {hab?.tipo}</div>
      <div style={{ fontSize:'13px', color:'#8A9BB5', marginBottom:'4px' }}>{form.checkin} → {form.checkout} · {noches} noche{noches>1?'s':''}</div>
      <div style={{ fontSize:'22px', fontWeight:'900', color:'#0A4A8A', marginBottom:'20px' }}>{total.toLocaleString()} XAF</div>
      <div style={{ background:'#EFF6FF', borderRadius:'14px', padding:'16px', marginBottom:'20px', textAlign:'left' }}>
        <div style={{ fontSize:'12px', fontWeight:'700', color:'#1D4ED8', marginBottom:'8px' }}>¿Qué pasa ahora?</div>
        {['Recibirás un email de confirmación','El hotel te contactará para confirmar','Presenta tu DNI al hacer el check-in','Cancelación gratuita hasta 48h antes'].map((s,i)=>(
          <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'6px' }}>
            <span style={{ color:'#3B82F6', fontWeight:'700', flexShrink:0 }}>{i+1}.</span>
            <span style={{ fontSize:'12px', color:'#1E40AF' }}>{s}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setScreen('home'); setHotel(null); setHab(null); setForm({ nombre:'', dni:'', telefono:'', email:'', checkin:'', checkout:'', huespedes:'1', notas:'', pago:'' }); }}
        style={{ background:'linear-gradient(135deg,#0A4A8A,#00b4e6)', border:'none', borderRadius:'12px', padding:'13px 32px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
        Ver más hoteles
      </button>
    </div>
  );

  // ── RESERVA ──
  if (screen === 'reserva' && hotel && hab) return (
    <div style={{ padding:'14px 16px 24px' }}>
      <div style={{ background:`linear-gradient(135deg,${hotel.color},${hotel.color2})`, borderRadius:'14px', padding:'14px', marginBottom:'16px' }}>
        <div style={{ fontSize:'14px', fontWeight:'800', color:'#fff', marginBottom:'2px' }}>{hotel.nombre}</div>
        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.85)', marginBottom:'4px' }}>{hab.tipo} · {hab.precio.toLocaleString()} XAF/noche</div>
        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>{hab.desc}</div>
      </div>
      {[
        {k:'nombre',l:'Nombre completo del titular',t:'text'},
        {k:'dni',l:'DNI / Pasaporte',t:'text'},
        {k:'telefono',l:'Teléfono de contacto',t:'tel'},
        {k:'email',l:'Correo electrónico',t:'email'},
        {k:'checkin',l:'Fecha entrada (DD/MM/AAAA)',t:'text'},
        {k:'checkout',l:'Fecha salida (DD/MM/AAAA)',t:'text'},
        {k:'huespedes',l:'Número de huéspedes',t:'number'},
        {k:'notas',l:'Peticiones especiales (opcional)',t:'text'},
      ].map(f=>(
        <div key={f.k} style={{ background:'#fff', borderRadius:'10px', padding:'0 14px', marginBottom:'8px', display:'flex', alignItems:'center', height:'50px', border:'1px solid #F0F2F5' }}>
          <input type={f.t} placeholder={f.l} value={(form as any)[f.k]} onChange={e=>setF(f.k,e.target.value)}
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:'13px', color:'#111827', fontFamily:'inherit' }}/>
        </div>
      ))}
      {total > 0 && (
        <div style={{ background:'#EFF5FD', borderRadius:'10px', padding:'12px 14px', marginBottom:'12px', border:'1px solid #BFDBFE' }}>
          <div style={{ fontSize:'11px', color:'#1B3A6B', marginBottom:'4px', fontWeight:'600' }}>Total estimado</div>
          <div style={{ fontSize:'22px', fontWeight:'900', color:'#0A4A8A' }}>{total.toLocaleString()} XAF</div>
          <div style={{ fontSize:'10px', color:'#6B7280' }}>{noches} noche{noches>1?'s':''} × {hab.precio.toLocaleString()} XAF</div>
        </div>
      )}
      <div style={{ fontSize:'12px', fontWeight:'600', color:'#9CA3AF', margin:'12px 0 8px' }}>Método de pago</div>
      <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
        {[{id:'wallet',l:'EGCHAT'},{id:'bank',l:'Banco'},{id:'card',l:'Tarjeta'},{id:'cash',l:'Efectivo'}].map(m=>(
          <button key={m.id} onClick={()=>setF('pago',m.id)}
            style={{ flex:1, background:form.pago===m.id?'#EFF5FD':'#F9FAFB', border:`1.5px solid ${form.pago===m.id?'#0A4A8A':'#E5E7EB'}`, borderRadius:'10px', padding:'8px 4px', fontSize:'10px', fontWeight:'700', color:form.pago===m.id?'#0A4A8A':'#6B7280', cursor:'pointer' }}>
            {m.l}
          </button>
        ))}
      </div>
      <button onClick={()=>{ if(form.nombre&&form.dni&&form.telefono&&form.checkin&&form.checkout&&form.pago) setScreen('ok'); }}
        style={{ width:'100%', background:form.nombre&&form.dni&&form.telefono&&form.checkin&&form.checkout&&form.pago?`linear-gradient(135deg,${hotel.color},${hotel.color2})`:'#E5E7EB', border:'none', borderRadius:'12px', padding:'14px', color:form.nombre&&form.dni&&form.telefono&&form.checkin&&form.checkout&&form.pago?'#fff':'#9CA3AF', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>
        Confirmar reserva{total>0?` · ${total.toLocaleString()} XAF`:''}
      </button>
    </div>
  );

  // ── DETALLE HOTEL ──
  if (screen === 'hotel' && hotel) return (
    <div style={{ paddingBottom:'24px' }}>
      <div style={{ background:`linear-gradient(135deg,${hotel.color},${hotel.color2})`, padding:'16px' }}>
        <button onClick={()=>setScreen('home')} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'8px', padding:'6px 12px', color:'#fff', fontSize:'12px', fontWeight:'700', cursor:'pointer', marginBottom:'10px' }}>← Volver</button>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
          <div style={{ fontSize:'36px' }}>🏨</div>
          <div>
            <div style={{ fontSize:'18px', fontWeight:'900', color:'#fff' }}>{hotel.nombre}</div>
            <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.85)' }}>{estrellas(hotel.estrellas)} · {hotel.barrio}, {hotel.ciudad}</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)', marginTop:'2px' }}>📞 {hotel.tel}</div>
          </div>
        </div>
      </div>
      <div style={{ padding:'14px 16px 0' }}>
        {/* GPS */}
        <a href={`https://maps.google.com/?q=${hotel.lat},${hotel.lng}`} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', gap:'8px', background:'#EFF5FD', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px', textDecoration:'none', color:'#1B3A6B', fontSize:'12px', fontWeight:'700' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Ver en Google Maps · {hotel.barrio}, {hotel.ciudad}
        </a>
        {/* Descripción */}
        <div style={{ background:'#fff', borderRadius:'12px', padding:'14px', marginBottom:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'13px', color:'#374151', lineHeight:'1.5', marginBottom:'10px' }}>{hotel.descripcion}</div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {hotel.servicios.map((s:string)=>(
              <span key={s} style={{ background:'#F3F4F6', color:'#374151', borderRadius:'6px', padding:'3px 8px', fontSize:'10px', fontWeight:'600' }}>✓ {s}</span>
            ))}
          </div>
        </div>
        {/* Habitaciones */}
        <div style={{ fontSize:'14px', fontWeight:'800', color:'#1A2B4A', marginBottom:'10px' }}>🛏️ Habitaciones disponibles</div>
        {hotel.habitaciones.map((h:any, i:number)=>(
          <div key={i} style={{ background:'#fff', borderRadius:'14px', padding:'14px', marginBottom:'8px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', opacity:h.disponible?1:0.5 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'8px' }}>
              <div style={{ fontSize:'28px', flexShrink:0 }}>{h.img}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ fontSize:'14px', fontWeight:'800', color:'#1A2B4A' }}>{h.tipo}</div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'15px', fontWeight:'900', color:hotel.color }}>{h.precio.toLocaleString()}</div>
                    <div style={{ fontSize:'9px', color:'#8A9BB5' }}>XAF/noche</div>
                  </div>
                </div>
                <div style={{ fontSize:'11px', color:'#6B7280', marginTop:'3px', lineHeight:'1.4' }}>{h.desc}</div>
              </div>
            </div>
            {h.disponible ? (
              <button onClick={()=>{ setHab(h); setScreen('reserva'); }}
                style={{ width:'100%', background:`linear-gradient(135deg,${hotel.color},${hotel.color2})`, border:'none', borderRadius:'10px', padding:'10px', color:'#fff', fontSize:'12px', fontWeight:'700', cursor:'pointer' }}>
                Reservar esta habitación
              </button>
            ) : (
              <div style={{ textAlign:'center', fontSize:'12px', color:'#9CA3AF', fontWeight:'600', padding:'8px' }}>No disponible</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── HOME ──
  return (
    <div style={{ paddingBottom:'24px' }}>
      <div style={{ background:'linear-gradient(135deg,#0A4A8A,#00b4e6)', padding:'16px 16px 14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
          <div style={{ fontSize:'32px' }}>🏨</div>
          <div>
            <div style={{ fontSize:'18px', fontWeight:'900', color:'#fff' }}>Hoteles</div>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.8)' }}>{HOTELES.length} hoteles · Guinea Ecuatorial</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'4px' }}>
          {CIUDADES_H.map(c=>(
            <button key={c} onClick={()=>setCiudad(c)}
              style={{ flexShrink:0, background:ciudad===c?'#fff':'rgba(255,255,255,0.2)', border:'none', borderRadius:'20px', padding:'5px 14px', fontSize:'11px', fontWeight:'700', color:ciudad===c?'#0A4A8A':'#fff', cursor:'pointer' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'14px 16px 0' }}>
        {/* Mosaico de hoteles */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
          {hotelesFiltrados.map(h=>(
            <div key={h.id} onClick={()=>{ setHotel(h); setScreen('hotel'); }}
              style={{ background:'#fff', borderRadius:'16px', padding:'14px', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', border:'1px solid #F0F2F5', transition:'transform 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';}}>
              {/* Badge estrellas */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                <div style={{ background:`linear-gradient(135deg,${h.color},${h.color2})`, borderRadius:'10px', padding:'6px 10px', fontSize:'20px' }}>🏨</div>
                <span style={{ background:'#FEF3C7', color:'#92400E', borderRadius:'6px', padding:'2px 6px', fontSize:'10px', fontWeight:'700' }}>{estrellas(h.estrellas)}</span>
              </div>
              <div style={{ fontSize:'12px', fontWeight:'800', color:'#1A2B4A', marginBottom:'2px', lineHeight:'1.3' }}>{h.nombre}</div>
              <div style={{ fontSize:'10px', color:'#8A9BB5', marginBottom:'8px' }}>📍 {h.barrio}</div>
              {/* Precio desde */}
              <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:'8px' }}>
                <div style={{ fontSize:'9px', color:'#8A9BB5' }}>Desde</div>
                <div style={{ fontSize:'13px', fontWeight:'900', color:h.color }}>{Math.min(...h.habitaciones.map((r:any)=>r.precio)).toLocaleString()} XAF</div>
                <div style={{ fontSize:'9px', color:'#8A9BB5' }}>por noche</div>
              </div>
            </div>
          ))}
        </div>
        {hotelesFiltrados.length === 0 && (
          <div style={{ textAlign:'center', padding:'30px', color:'#9CA3AF', fontSize:'13px' }}>No hay hoteles en {ciudad}</div>
        )}
      </div>
    </div>
  );
};
