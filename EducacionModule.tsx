import React, { useState } from 'react';

// ─── DATOS ────────────────────────────────────────────────────────────────────

const CIUDADES = ['Malabo','Bata','Ebebiyin','Mongomo','Añisoc','Evinayong'];

const ESCUELAS = [
  // ── MALABO ──
  { id:'e01', nombre:'Colegio Nacional La Salle', ciudad:'Malabo', barrio:'Centro', tipo:'publica', nivel:'Primaria/Secundaria', tel:'+240 222 26 01 01', horario:'07:30-14:00', modalidades:['Presencial'], plazas:800, descripcion:'Centro educativo nacional de referencia en Malabo.' },
  { id:'e02', nombre:'Instituto Nacional Malabo', ciudad:'Malabo', barrio:'Ela Nguema', tipo:'publica', nivel:'Bachillerato', tel:'+240 222 26 01 02', horario:'07:30-14:00', modalidades:['Presencial'], plazas:600, descripcion:'Instituto público de bachillerato con especialidades científicas y humanísticas.' },
  { id:'e03', nombre:'Colegio Español de Malabo', ciudad:'Malabo', barrio:'Caracolas', tipo:'privada', nivel:'Primaria/Secundaria/Bachillerato', tel:'+240 222 26 01 03', horario:'08:00-15:00', modalidades:['Presencial'], plazas:500, descripcion:'Centro privado con currículo español homologado.' },
  { id:'e04', nombre:'Colegio San Francisco de Asís', ciudad:'Malabo', barrio:'Centro', tipo:'privada', nivel:'Primaria/Secundaria', tel:'+240 222 26 01 04', horario:'07:30-14:30', modalidades:['Presencial'], plazas:400, descripcion:'Colegio privado católico con alta calidad educativa.' },
  { id:'e05', nombre:'Colegio Bilingüe Malabo', ciudad:'Malabo', barrio:'Malabo II', tipo:'privada', nivel:'Primaria/Secundaria', tel:'+240 222 26 01 05', horario:'08:00-15:00', modalidades:['Presencial'], plazas:350, descripcion:'Enseñanza en español y francés. Currículo internacional.' },
  { id:'e06', nombre:'Centro Profesional INAP', ciudad:'Malabo', barrio:'Puerto', tipo:'profesional', nivel:'Formación Profesional', tel:'+240 222 26 01 06', horario:'08:00-17:00', modalidades:['Presencial','Semipresencial'], plazas:300, descripcion:'Formación en informática, electricidad, mecánica y administración.' },
  { id:'e07', nombre:'Centro de Formación CEFOR', ciudad:'Malabo', barrio:'Sipopo', tipo:'profesional', nivel:'Formación Profesional', tel:'+240 222 26 01 07', horario:'08:00-17:00', modalidades:['Presencial','Online'], plazas:250, descripcion:'Cursos de formación profesional y certificaciones internacionales.' },
  { id:'e08', nombre:'Escuela Primaria Ela Nguema', ciudad:'Malabo', barrio:'Ela Nguema', tipo:'publica', nivel:'Primaria', tel:'+240 222 26 01 08', horario:'07:30-13:30', modalidades:['Presencial'], plazas:500, descripcion:'Escuela pública de primaria en el barrio de Ela Nguema.' },
  // ── BATA ──
  { id:'e09', nombre:'Instituto Nacional Bata', ciudad:'Bata', barrio:'Centro', tipo:'publica', nivel:'Bachillerato', tel:'+240 222 26 02 01', horario:'07:30-14:00', modalidades:['Presencial'], plazas:700, descripcion:'Principal instituto público de bachillerato en Bata.' },
  { id:'e10', nombre:'Colegio San José Bata', ciudad:'Bata', barrio:'Litoral', tipo:'privada', nivel:'Primaria/Secundaria', tel:'+240 222 26 02 02', horario:'08:00-15:00', modalidades:['Presencial'], plazas:450, descripcion:'Colegio privado con excelente nivel académico en Bata.' },
  { id:'e11', nombre:'Centro Profesional Bata', ciudad:'Bata', barrio:'Nkolombong', tipo:'profesional', nivel:'Formación Profesional', tel:'+240 222 26 02 03', horario:'08:00-17:00', modalidades:['Presencial'], plazas:280, descripcion:'Formación en hostelería, construcción y tecnología.' },
  { id:'e12', nombre:'Escuela Primaria Bata Norte', ciudad:'Bata', barrio:'Nkolombong', tipo:'publica', nivel:'Primaria', tel:'+240 222 26 02 04', horario:'07:30-13:30', modalidades:['Presencial'], plazas:600, descripcion:'Escuela pública de primaria en el norte de Bata.' },
  // ── EBEBIYIN ──
  { id:'e13', nombre:'Instituto Ebebiyin', ciudad:'Ebebiyin', barrio:'Centro', tipo:'publica', nivel:'Secundaria/Bachillerato', tel:'+240 222 26 03 01', horario:'07:30-14:00', modalidades:['Presencial'], plazas:400, descripcion:'Centro educativo público de secundaria y bachillerato.' },
  { id:'e14', nombre:'Colegio Privado Ebebiyin', ciudad:'Ebebiyin', barrio:'Centro', tipo:'privada', nivel:'Primaria/Secundaria', tel:'+240 222 26 03 02', horario:'08:00-15:00', modalidades:['Presencial'], plazas:250, descripcion:'Colegio privado con enseñanza bilingüe.' },
  // ── MONGOMO ──
  { id:'e15', nombre:'Instituto Mongomo', ciudad:'Mongomo', barrio:'Centro', tipo:'publica', nivel:'Secundaria/Bachillerato', tel:'+240 222 26 04 01', horario:'07:30-14:00', modalidades:['Presencial'], plazas:350, descripcion:'Instituto público de referencia en Mongomo.' },
];

const UNIVERSIDADES = [
  { id:'u01', nombre:'Universidad Nacional de Guinea Ecuatorial (UNGE)', ciudad:'Malabo', barrio:'Malabo II', tipo:'publica', tel:'+240 222 26 10 01', web:'unge.gq', descripcion:'Principal universidad pública del país. Fundada en 1995.', facultades:['Ciencias','Derecho','Medicina','Ingeniería','Humanidades','Económicas'], plazas:2000, modalidades:['Presencial'], requisitos:['Título de Bachillerato','Nota de corte mínima 6.0','Prueba de acceso UNGE','DNI / Pasaporte','2 fotos carnet','Certificado médico'] },
  { id:'u02', nombre:'Universidad Nacional de Educación a Distancia (UNED-GQ)', ciudad:'Malabo', barrio:'Centro', tipo:'publica', tel:'+240 222 26 10 02', web:'uned.gq', descripcion:'Universidad a distancia con convenio con UNED España.', facultades:['Derecho','Económicas','Psicología','Educación','Informática'], plazas:1500, modalidades:['Online','Semipresencial'], requisitos:['Título de Bachillerato','DNI / Pasaporte','Formulario de inscripción online','Pago de matrícula','Foto carnet'] },
  { id:'u03', nombre:'Universidad de Bata (UNIBATA)', ciudad:'Bata', barrio:'Centro', tipo:'publica', tel:'+240 222 26 10 03', web:'unibata.gq', descripcion:'Universidad pública de la región continental. Fundada en 2002.', facultades:['Ciencias Agrarias','Ingeniería','Medicina','Derecho','Económicas'], plazas:1800, modalidades:['Presencial'], requisitos:['Título de Bachillerato','Nota de corte mínima 5.5','Prueba de acceso UNIBATA','DNI / Pasaporte','2 fotos carnet','Certificado médico','Certificado de buena conducta'] },
  { id:'u04', nombre:'Universidad Privada de Guinea Ecuatorial (UPGE)', ciudad:'Malabo', barrio:'Caracolas', tipo:'privada', tel:'+240 222 26 10 04', web:'upge.gq', descripcion:'Primera universidad privada del país. Convenios internacionales.', facultades:['Administración de Empresas','Derecho','Informática','Comunicación','Turismo'], plazas:800, modalidades:['Presencial','Semipresencial'], requisitos:['Título de Bachillerato','Entrevista de admisión','DNI / Pasaporte','2 fotos carnet','Certificado médico','Extracto bancario (solvencia)','Carta de motivación'] },
  { id:'u05', nombre:'Instituto Superior de Ciencias de la Educación (ISCE)', ciudad:'Malabo', barrio:'Ela Nguema', tipo:'publica', tel:'+240 222 26 10 05', web:'isce.gq', descripcion:'Formación de docentes y profesionales de la educación.', facultades:['Pedagogía','Psicología Educativa','Educación Física','Lenguas Modernas'], plazas:600, modalidades:['Presencial'], requisitos:['Título de Bachillerato','Nota de corte mínima 6.5','Prueba de aptitud pedagógica','DNI / Pasaporte','2 fotos carnet','Certificado médico'] },
  { id:'u06', nombre:'Escuela Nacional de Administración (ENA-GQ)', ciudad:'Malabo', barrio:'Centro', tipo:'publica', tel:'+240 222 26 10 06', web:'ena.gq', descripcion:'Formación de funcionarios y gestores públicos.', facultades:['Administración Pública','Gestión Financiera','Relaciones Internacionales','Derecho Administrativo'], plazas:400, modalidades:['Presencial'], requisitos:['Título de Bachillerato o Universitario','Concurso de oposición','DNI / Pasaporte','Certificado de buena conducta','Certificado médico','Carta de recomendación'] },
];

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type EduScreen = 'home'|'escuela'|'universidad'|'solicitud'|'ok';
type TipoFiltro = 'todos'|'publica'|'privada'|'profesional';

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export const EducacionModule: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [screen, setScreen] = useState<EduScreen>('home');
  const [ciudad, setCiudad] = useState('Malabo');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ nombre:'', dni:'', telefono:'', email:'', modalidad:'', curso:'', notas:'' });
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const escuelasFiltradas = ESCUELAS.filter(e =>
    e.ciudad === ciudad &&
    (tipoFiltro === 'todos' || e.tipo === tipoFiltro)
  );
  const universidadesFiltradas = UNIVERSIDADES.filter(u => u.ciudad === ciudad);

  const tipoColor = (t: string) => t === 'publica' ? '#1B5E20' : t === 'privada' ? '#1565C0' : '#7B1FA2';
  const tipoLabel = (t: string) => t === 'publica' ? 'Pública' : t === 'privada' ? 'Privada' : 'Profesional';
  const tipoIcon = (t: string) => t === 'publica' ? '🏫' : t === 'privada' ? '🎓' : '🔧';

  // ── Pantalla de éxito ──
  if (screen === 'ok') return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
      <div style={{ fontSize: '20px', fontWeight: '900', color: '#1A2B4A', marginBottom: '8px' }}>¡Solicitud enviada!</div>
      <div style={{ fontSize: '13px', color: '#8A9BB5', marginBottom: '6px' }}>{selected?.nombre}</div>
      <div style={{ background: '#F0FAF5', borderRadius: '14px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#16A34A', marginBottom: '8px' }}>¿Qué pasa ahora?</div>
        {['El centro revisará tu solicitud en 5-10 días hábiles', 'Recibirás una llamada o email de confirmación', 'Si es aprobada, deberás presentar los documentos originales', 'La matrícula se formaliza en la secretaría del centro'].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: '#16A34A', fontWeight: '700', flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ fontSize: '12px', color: '#5A7090' }}>{s}</span>
          </div>
        ))}
      </div>
      <button onClick={() => { setScreen('home'); setSelected(null); setForm({ nombre: '', dni: '', telefono: '', email: '', modalidad: '', curso: '', notas: '' }); }}
        style={{ background: 'linear-gradient(135deg,#4C1D95,#6B5BD6)', border: 'none', borderRadius: '12px', padding: '13px 32px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
        Volver al inicio
      </button>
    </div>
  );

  // ── Formulario de solicitud ──
  if (screen === 'solicitud' && selected) return (
    <div style={{ padding: '14px 16px 24px' }}>
      <div style={{ background: 'linear-gradient(135deg,#4C1D95,#6B5BD6)', borderRadius: '14px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '28px' }}>📋</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{selected.nombre}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{selected.ciudad} · {selected.nivel || selected.facultades?.join(', ')}</div>
        </div>
      </div>

      {/* Documentos requeridos */}
      {selected.requisitos && (
        <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#1D4ED8', marginBottom: '8px' }}>📎 Documentos requeridos</div>
          {selected.requisitos.map((r: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#3B82F6', flexShrink: 0 }}>•</span>
              <span style={{ fontSize: '12px', color: '#1E40AF' }}>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Formulario */}
      {[
        { k: 'nombre', l: 'Nombre completo del solicitante', t: 'text' },
        { k: 'dni', l: 'DNI / Pasaporte', t: 'text' },
        { k: 'telefono', l: 'Teléfono de contacto', t: 'tel' },
        { k: 'email', l: 'Correo electrónico', t: 'email' },
        { k: 'curso', l: 'Curso / Facultad solicitada', t: 'text' },
        { k: 'notas', l: 'Notas adicionales (opcional)', t: 'text' },
      ].map(f => (
        <div key={f.k} style={{ background: '#fff', borderRadius: '10px', padding: '0 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', height: '50px', border: '1px solid #F0F2F5' }}>
          <input type={f.t} placeholder={f.l} value={(form as any)[f.k]} onChange={e => setF(f.k, e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#111827', fontFamily: 'inherit' }} />
        </div>
      ))}

      {/* Modalidad */}
      {selected.modalidades && (
        <>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#9CA3AF', margin: '12px 0 8px' }}>Modalidad</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {selected.modalidades.map((m: string) => (
              <button key={m} onClick={() => setF('modalidad', m)}
                style={{ background: form.modalidad === m ? '#EDE9FE' : '#F9FAFB', border: `1.5px solid ${form.modalidad === m ? '#6B5BD6' : '#E5E7EB'}`, borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', color: form.modalidad === m ? '#6B5BD6' : '#6B7280', cursor: 'pointer' }}>
                {m}
              </button>
            ))}
          </div>
        </>
      )}

      <button onClick={() => { if (form.nombre && form.dni && form.telefono) setScreen('ok'); }}
        style={{ width: '100%', background: form.nombre && form.dni && form.telefono ? 'linear-gradient(135deg,#4C1D95,#6B5BD6)' : '#E5E7EB', border: 'none', borderRadius: '12px', padding: '14px', color: form.nombre && form.dni && form.telefono ? '#fff' : '#9CA3AF', fontSize: '14px', fontWeight: '700', cursor: form.nombre && form.dni && form.telefono ? 'pointer' : 'default' }}>
        Enviar solicitud de plaza
      </button>
    </div>
  );

  // ── Pantalla principal ──
  return (
    <div style={{ paddingBottom: '24px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#4C1D95,#6B5BD6)', padding: '16px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🎓</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>Educación</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Centros educativos · Guinea Ecuatorial</div>
          </div>
        </div>
        {/* Filtro ciudad */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CIUDADES.map(c => (
            <button key={c} onClick={() => setCiudad(c)}
              style={{ flexShrink: 0, background: ciudad === c ? '#fff' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '20px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', color: ciudad === c ? '#4C1D95' : '#fff', cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 0' }}>

        {/* ── BLOQUE 1: ESCUELAS ── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1A2B4A' }}>🏫 Centros Escolares</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['todos', 'publica', 'privada', 'profesional'] as TipoFiltro[]).map(t => (
                <button key={t} onClick={() => setTipoFiltro(t)}
                  style={{ background: tipoFiltro === t ? '#4C1D95' : '#F3F4F6', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '10px', fontWeight: '700', color: tipoFiltro === t ? '#fff' : '#6B7280', cursor: 'pointer' }}>
                  {t === 'todos' ? 'Todos' : tipoLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {escuelasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '13px' }}>No hay centros en {ciudad} con este filtro</div>
          ) : (
            escuelasFiltradas.map(e => (
              <div key={e.id} style={{ background: '#fff', borderRadius: '14px', padding: '14px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer' }}
                onClick={() => { setSelected(e); setScreen('solicitud'); }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${tipoColor(e.tipo)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {tipoIcon(e.tipo)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#1A2B4A', marginBottom: '2px' }}>{e.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#8A9BB5', marginBottom: '4px' }}>{e.barrio} · {e.nivel}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: `${tipoColor(e.tipo)}15`, color: tipoColor(e.tipo), borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '700' }}>{tipoLabel(e.tipo)}</span>
                      {e.modalidades.map((m: string) => (
                        <span key={m} style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '600' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', color: '#8A9BB5' }}>{e.plazas} plazas</div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" style={{ marginTop: '4px' }}><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── BLOQUE 2: UNIVERSIDADES ── */}
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#1A2B4A', marginBottom: '10px' }}>🏛️ Universidades</div>

          {universidadesFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '13px' }}>No hay universidades en {ciudad}</div>
          ) : (
            universidadesFiltradas.map(u => (
              <div key={u.id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', cursor: 'pointer' }}
                onClick={() => { setSelected(u); setScreen('solicitud'); }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: u.tipo === 'publica' ? '#1B5E2015' : '#1565C015', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
                    🏛️
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#1A2B4A', marginBottom: '2px', lineHeight: '1.3' }}>{u.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#8A9BB5' }}>{u.barrio} · {u.ciudad}</div>
                    <span style={{ background: u.tipo === 'publica' ? '#1B5E2015' : '#1565C015', color: u.tipo === 'publica' ? '#1B5E20' : '#1565C0', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginTop: '4px' }}>
                      {u.tipo === 'publica' ? 'Pública' : 'Privada'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A9BB5', textAlign: 'right', flexShrink: 0 }}>
                    {u.plazas} plazas
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#5A7090', marginBottom: '10px', lineHeight: '1.4' }}>{u.descripcion}</div>
                {/* Facultades */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {u.facultades.map((f: string) => (
                    <span key={f} style={{ background: '#F3F4F6', color: '#374151', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: '600' }}>{f}</span>
                  ))}
                </div>
                {/* Modalidades */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {u.modalidades.map((m: string) => (
                    <span key={m} style={{ background: '#EDE9FE', color: '#6B5BD6', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: '700' }}>{m}</span>
                  ))}
                  <span style={{ fontSize: '11px', color: '#8A9BB5', marginLeft: 'auto' }}>📞 {u.tel}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); setSelected(u); setScreen('solicitud'); }}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#4C1D95,#6B5BD6)', border: 'none', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
                  Solicitar plaza
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
