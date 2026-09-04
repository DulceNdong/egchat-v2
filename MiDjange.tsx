import React, { useState, useRef, useEffect } from "react";
import {
  Check, Clock, Wallet, Users, Crown, ShieldCheck, Plus, Settings,
  RotateCcw, AlertTriangle, MessageSquare, Send, Bell, TrendingUp,
  ClipboardList, Hourglass, PartyPopper, ListChecks, LayoutDashboard,
  PiggyBank, ArrowDownCircle, ArrowUpCircle, ShieldAlert, X, Menu,
} from "lucide-react";

const TIPOS = { diario: "Día", semanal: "Semana", mensual: "Mes", anual: "Año" };
function periodLabel(tipo, n) { return `${TIPOS[tipo]} ${n + 1}`; }
function money(n) { return "$" + Number(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 }); }
function timeOf(ts) { return new Date(ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }); }

function seedGroup() {
  const members = [
    { id: "m1", name: "Ana Reyes", wallet: 3200 },
    { id: "m2", name: "Luis Peña", wallet: 2600 },
    { id: "m3", name: "Carla Núñez", wallet: 1800 },
    { id: "m4", name: "Diego Ortiz", wallet: 2100 },
    { id: "m5", name: "Sofía Mendoza", wallet: 1500 },
  ];
  return {
    name: "Djangue Familiar",
    slogan: "Ahorrando juntos, cada quien en su turno.",
    logo: null,
    tipo: "mensual",
    cuota: 500,
    penaltyPercent: 10,
    representanteId: "m1",
    secretarioId: "m2",
    members,
    turnIndex: 0,
    periodIndex: 0,
    contributions: {},
    pot: 0,
    totalMora: 0,
    transactions: [],
    foro: [
      { id: 1, type: "system", text: "Djangue Familiar fue creado por Ana Reyes (Representante) con Luis Peña como Secretario.", ts: Date.now() - 1000 * 60 * 60 * 5 },
    ],
  };
}

export default function MiDjange() {
  const [group, setGroup] = useState(seedGroup());
  const [viewerId, setViewerId] = useState("m1");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWallet, setNewWallet] = useState(1000);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");
  const [showIdentity, setShowIdentity] = useState(false);
  const [nameInput, setNameInput] = useState(group.name);
  const [sloganInput, setSloganInput] = useState(group.slogan);
  const [logoPreview, setLogoPreview] = useState(group.logo);
  const [cuotaInput, setCuotaInput] = useState(group.cuota);
  const [tipoInput, setTipoInput] = useState(group.tipo);
  const [penaltyInput, setPenaltyInput] = useState(group.penaltyPercent);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [chatText, setChatText] = useState("");
  const [notifyOpenFor, setNotifyOpenFor] = useState(null);
  const [notifyNote, setNotifyNote] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const foroEndRef = useRef(null);

  const n = group.members.length;
  const beneficiary = group.members[group.turnIndex % n];
  const paidCount = group.members.filter((m) => group.contributions[m.id]?.status === "pagado").length;
  const viewer = group.members.find((m) => m.id === viewerId);
  const role = viewerId === group.representanteId ? "Representante" : viewerId === group.secretarioId ? "Secretario" : "Integrante";
  const isRepresentante = role === "Representante";
  const isAdmin = role === "Representante" || role === "Secretario";
  const midCycleLocked = paidCount > 0 || group.pot > 0;
  const pendientesSinJustificar = group.members.filter((m) => !group.contributions[m.id]);

  useEffect(() => { foroEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [group.foro.length]);

  function roleOf(id) {
    if (id === group.representanteId) return "Representante";
    if (id === group.secretarioId) return "Secretario";
    return "Integrante";
  }
  
  function pushForo(prevForo, entry) {
    return [...prevForo, { id: Date.now() + Math.random(), ts: Date.now(), ...entry }];
  }

  function pagarCuota(memberId) {
    setGroup((prev) => {
      const member = prev.members.find((m) => m.id === memberId);
      if (!member || prev.contributions[memberId]?.status === "pagado" || member.wallet < prev.cuota) return prev;
      const members1 = prev.members.map((m) => (m.id === memberId ? { ...m, wallet: m.wallet - prev.cuota } : m));
      const contributions1 = { ...prev.contributions, [memberId]: { status: "pagado" } };
      const pot1 = prev.pot + prev.cuota;
      const tx1 = [...prev.transactions, { id: Date.now() + Math.random(), ts: Date.now(), type: "aporte", memberName: member.name, amount: prev.cuota, period: periodLabel(prev.tipo, prev.periodIndex) }];
      let foro1 = pushForo(prev.foro, { type: "system", text: `✅ ${member.name} cotizó ${money(prev.cuota)} — ${periodLabel(prev.tipo, prev.periodIndex)}.` });
      const allPaid = members1.every((m) => contributions1[m.id]?.status === "pagado");
      if (!allPaid) return { ...prev, members: members1, contributions: contributions1, pot: pot1, foro: foro1, transactions: tx1 };
      return closePeriod({ ...prev, members: members1, contributions: contributions1, pot: pot1, foro: foro1, transactions: tx1 });
    });
  }

  function closePeriod(state) {
    let members = state.members, pot = state.pot, foro = state.foro, totalMora = state.totalMora, tx = state.transactions;
    state.members.forEach((m) => {
      const entry = state.contributions[m.id];
      if (!entry) {
        const penalty = Math.round((state.cuota * state.penaltyPercent) / 100);
        const applied = Math.min(penalty, m.wallet);
        members = members.map((x) => (x.id === m.id ? { ...x, wallet: x.wallet - applied } : x));
        pot += applied;
        totalMora += applied;
        tx = [...tx, { id: Date.now() + Math.random(), ts: Date.now(), type: "mora", memberName: m.name, amount: applied, period: periodLabel(state.tipo, state.periodIndex) }];
        foro = pushForo(foro, { type: "alert", text: `⚠️ ${m.name} no cotizó ni avisó a tiempo — se aplicó una mora del ${state.penaltyPercent}% (${money(applied)}).` });
      } else if (entry.status === "justificado") {
        foro = pushForo(foro, { type: "system", text: `🔕 ${m.name} quedó justificado este periodo (sin penalización). Nota: "${entry.note || "sin nota"}".` });
      }
    });
    const ben = members[state.turnIndex % members.length];
    const payoutAmount = pot;
    const finalMembers = members.map((m) => (m.id === ben.id ? { ...m, wallet: m.wallet + payoutAmount } : m));
    const fullAmount = state.cuota * state.members.length;
    tx = [...tx, { id: Date.now() + Math.random(), ts: Date.now(), type: "entrega", memberName: ben.name, amount: payoutAmount, period: periodLabel(state.tipo, state.periodIndex) }];
    foro = pushForo(foro, {
      type: "payout",
      text: payoutAmount < fullAmount
        ? `🎉 Se cerró ${periodLabel(state.tipo, state.periodIndex)}. ${ben.name} recibió ${money(payoutAmount)} (bote incompleto por mora/justificaciones).`
        : `🎉 Se cerró ${periodLabel(state.tipo, state.periodIndex)}. ${ben.name} recibió el bote completo de ${money(payoutAmount)}.`,
    });
    return { ...state, members: finalMembers, contributions: {}, pot: 0, turnIndex: state.turnIndex + 1, periodIndex: state.periodIndex + 1, foro, totalMora, transactions: tx };
  }

  function cerrarPeriodoManual() { setGroup((prev) => closePeriod(prev)); }

  function notificarRetraso(memberId, note) {
    setGroup((prev) => {
      const member = prev.members.find((m) => m.id === memberId);
      if (!member || prev.contributions[memberId]) return prev;
      const contributions1 = { ...prev.contributions, [memberId]: { status: "justificado", note } };
      const foro1 = pushForo(prev.foro, { type: "system", text: `🔔 ${member.name} notificó al secretario y al grupo que no podrá cotizar a tiempo: "${note || "sin detalle"}".` });
      return { ...prev, contributions: contributions1, foro: foro1 };
    });
    setNotifyOpenFor(null);
    setNotifyNote("");
  }

  function recordarEnForo() {
    const names = pendientesSinJustificar.map((m) => m.name).join(", ");
    setGroup((prev) => ({ ...prev, foro: pushForo(prev.foro, { type: "system", text: `🔔 Recordatorio enviado a: ${names}. El periodo se cerrará pronto.` }) }));
  }

  function addMember() {
    if (!newName.trim()) return;
    setGroup((prev) => ({
      ...prev,
      members: [...prev.members, { id: "m" + Date.now(), name: newName.trim(), wallet: Number(newWallet) || 0 }],
      foro: pushForo(prev.foro, { type: "system", text: `➕ ${newName.trim()} se unió al djangue.` }),
    }));
    setNewName(""); setNewWallet(1000); setShowAddMember(false);
  }

  function saveSettings() {
    if (midCycleLocked && (Number(cuotaInput) !== group.cuota || tipoInput !== group.tipo)) {
      setSettingsMsg("No se puede cambiar cuota/periodicidad mientras haya cotizaciones pendientes de este periodo.");
      return;
    }
    setGroup((prev) => ({
      ...prev,
      cuota: Number(cuotaInput) || prev.cuota,
      tipo: tipoInput,
      penaltyPercent: Number(penaltyInput) >= 0 ? Number(penaltyInput) : prev.penaltyPercent,
      foro: pushForo(prev.foro, { type: "system", text: `⚙️ Ajustes actualizados: cuota ${money(Number(cuotaInput))}, mora ${penaltyInput}%.` }),
    }));
    setSettingsMsg(""); setShowSettings(false);
  }

  function sendChat() {
    if (!chatText.trim()) return;
    setGroup((prev) => ({ ...prev, foro: pushForo(prev.foro, { type: "chat", author: viewer.name, role: roleOf(viewerId), text: chatText.trim() }) }));
    setChatText("");
  }
  
  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function saveIdentity() {
    if (!nameInput.trim()) return;
    setGroup((prev) => ({
      ...prev,
      name: nameInput.trim(),
      slogan: sloganInput.trim(),
      logo: logoPreview,
      foro: pushForo(prev.foro, { type: "system", text: `🎨 El Representante actualizó la identidad del djangue: nombre, eslogan y logo.` }),
    }));
    setShowIdentity(false);
  }

  function resetDemo() { setGroup(seedGroup()); setViewerId("m1"); setMobileMenuOpen(false); }

  const cx = 150, cy = 150, r = 100;

  // ---------- Componentes compartidos ----------
  function Wheel({ size = 240 }) {
    return (
      <svg viewBox="0 0 300 300" width={size} height={size} className="mdj-wheel">
        <circle cx={cx} cy={cy} r={r} className="mdj-track" />
        {group.members.map((m, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
          const isCurrent = i === group.turnIndex % n;
          const status = group.contributions[m.id]?.status;
          const cls = isCurrent ? "mdj-node-current" : status === "pagado" ? "mdj-node-paid" : status === "justificado" ? "mdj-node-justificado" : "mdj-node-pending";
          const initials = m.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
          return (
            <g key={m.id} className="mdj-node-group">
              <circle cx={x} cy={y} r={22} className={cls} strokeWidth={2} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={status === "pagado" ? "#fff" : "#10202B"} fontFamily="Inter, sans-serif">{initials}</text>
              {status === "pagado" && !isCurrent && <circle cx={x + 15} cy={y - 15} r={7} fill="#2C6E63" className="mdj-check-badge" />}
            </g>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="mdj-mono" fontSize="10" fill="#10202B" opacity="0.55">TURNO</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="#10202B" fontFamily="Fraunces, serif">{beneficiary?.name.split(" ")[0]}</text>
      </svg>
    );
  }

  function ProgressBar() {
    return (
      <div className="mdj-progress-wrapper">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
          <span className="mdj-mono" style={{ opacity: 0.6 }}>Aportes del periodo</span>
          <span className="mdj-mono" style={{ fontWeight: 700 }}>{paidCount}/{n}</span>
        </div>
        <div className="mdj-progress-track">
          <div className="mdj-progress-fill" style={{ width: `${(paidCount / n) * 100}%` }} />
        </div>
        <div className="mdj-mono" style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>Bote actual: {money(group.pot)}</div>
      </div>
    );
  }

  function AlertBanner({ withActions }) {
    if (pendientesSinJustificar.length === 0) return null;
    return (
      <div className="mdj-banner mdj-fade-in">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AlertTriangle size={18} color="#A8432E" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--rust)" }}>Riesgo de mora este periodo</div>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>
              Sin cotizar ni justificar: <b>{pendientesSinJustificar.map((m) => m.name).join(", ")}</b>. Se les aplicará {group.penaltyPercent}% de mora si el periodo se cierra así.
            </div>
            {withActions && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button className="mdj-btn mdj-btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={recordarEnForo}>Recordar en el foro</button>
                {isAdmin && <button className="mdj-btn mdj-btn-rust" style={{ fontSize: 12, padding: "6px 10px" }} onClick={cerrarPeriodoManual}>Cerrar periodo y aplicar mora</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function MembersTable({ showWallet }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {group.members.map((m, i) => {
          const isCurrent = i === group.turnIndex % n;
          const status = group.contributions[m.id]?.status;
          return (
            <div key={m.id} className="mdj-member-row" style={{ background: isCurrent ? "var(--paper2)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {m.id === group.representanteId ? <Crown size={15} color="#C9A227" /> : m.id === group.secretarioId ? <ShieldCheck size={15} color="#2C6E63" /> : <div style={{ width: 15 }} />}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                  <div className="mdj-mono" style={{ fontSize: 11, opacity: 0.55 }}>{roleOf(m.id)} · turno #{i + 1}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {showWallet && <span className="mdj-mono" style={{ fontSize: 12, opacity: 0.65 }}>{money(m.wallet)}</span>}
                {isCurrent && <span className="mdj-chip mdj-chip-gold">En turno</span>}
                {status === "pagado" && <span className="mdj-chip mdj-chip-teal"><Check size={11} /></span>}
                {status === "justificado" && <span className="mdj-chip mdj-chip-amber"><Bell size={11} /></span>}
                {!status && <span className="mdj-chip mdj-chip-rust"><Clock size={11} /></span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function AddMemberBlock() {
    if (!isAdmin) return null;
    return (
      <div className="mdj-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}><Plus size={16} /> Agregar integrante</div>
          <button className="mdj-btn mdj-btn-ghost" onClick={() => setShowAddMember((s) => !s)}>{showAddMember ? "Cerrar" : "Abrir"}</button>
        </div>
        {showAddMember && (
          <div className="mdj-add-member-form">
            <input className="mdj-input" placeholder="Nombre" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className="mdj-input" type="number" placeholder="Saldo inicial" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} />
            <button className="mdj-btn mdj-btn-teal" onClick={addMember}>Añadir</button>
          </div>
        )}
      </div>
    );
  }

  function IdentityBlock() {
    return (
      <div className="mdj-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}>
            {group.logo ? (
              <img src={group.logo} alt="logo" className="mdj-logo-small" />
            ) : (
              <div className="mdj-logo-placeholder-small">
                {group.name.slice(0, 1)}
              </div>
            )}
            Identidad del djangue
          </div>
          <button className="mdj-btn mdj-btn-ghost" onClick={() => setShowIdentity((s) => !s)}>{showIdentity ? "Cerrar" : "Editar"}</button>
        </div>

        {showIdentity ? (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>Nombre del djangue</label>
              <input className="mdj-input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Ej. Djangue Familiar" />
            </div>
            <div>
              <label className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>Eslogan</label>
              <input className="mdj-input" value={sloganInput} onChange={(e) => setSloganInput(e.target.value)} placeholder="Ej. Ahorrando juntos, cada quien en su turno." />
            </div>
            <div>
              <label className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>Logo (foto desde tu dispositivo)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="preview" className="mdj-logo-preview" />
                ) : (
                  <div className="mdj-logo-placeholder" />
                )}
                <label className="mdj-btn mdj-btn-ghost" style={{ cursor: "pointer" }}>
                  Elegir foto
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                </label>
              </div>
            </div>
            <button className="mdj-btn mdj-btn-gold" onClick={saveIdentity}>Guardar identidad</button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div className="mdj-display" style={{ fontSize: 17, fontWeight: 600 }}>{group.name}</div>
            <div style={{ fontSize: 12.5, opacity: 0.65, fontStyle: "italic", marginTop: 2 }}>{group.slogan || "Sin eslogan todavía."}</div>
          </div>
        )}
      </div>
    );
  }

  function SettingsBlock({ fullAccess }) {
    return (
      <div className="mdj-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14 }}><Settings size={16} /> Ajustes del djangue</div>
        </div>
        <div className="mdj-settings-grid">
          <div>
            <label className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>Cuota {!fullAccess && "(solo Representante)"}</label>
            <input className="mdj-input" type="number" disabled={!fullAccess} value={cuotaInput} onChange={(e) => setCuotaInput(e.target.value)} />
          </div>
          <div>
            <label className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>Periodicidad {!fullAccess && "(solo Representante)"}</label>
            <select className="mdj-select" style={{ width: "100%" }} disabled={!fullAccess} value={tipoInput} onChange={(e) => setTipoInput(e.target.value)}>
              {Object.keys(TIPOS).map((t) => <option key={t} value={t}>{TIPOS[t]}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>% de mora (Representante + Secretario)</label>
          <input className="mdj-input" type="number" min="0" max="100" value={penaltyInput} onChange={(e) => setPenaltyInput(e.target.value)} />
        </div>
        {settingsMsg && <div className="mdj-error-msg">{settingsMsg}</div>}
        <button className="mdj-btn mdj-btn-gold" style={{ marginTop: 10 }} onClick={saveSettings}>Guardar cambios</button>
      </div>
    );
  }

  function TabBar() {
    return (
      <div className="mdj-tab-bar">
        {[
          { id: "resumen", label: "Resumen", icon: <LayoutDashboard size={14} /> },
          { id: "monedero", label: "Monedero del djangue", icon: <PiggyBank size={14} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={"mdj-tab " + (activeTab === t.id ? "mdj-tab-active" : "")}
          >
            {t.icon} <span className="mdj-tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function WalletTab({ compact }) {
    const totalAportado = group.transactions.filter((t) => t.type === "aporte").reduce((s, t) => s + t.amount, 0);
    const totalEntregado = group.transactions.filter((t) => t.type === "entrega").reduce((s, t) => s + t.amount, 0);
    const list = group.transactions.slice().reverse().slice(0, compact ? 6 : 40);
    const txMeta = {
      aporte: { label: "Aporte", icon: <ArrowDownCircle size={14} />, cls: "mdj-chip-teal", sign: "+" },
      mora: { label: "Mora", icon: <ShieldAlert size={14} />, cls: "mdj-chip-rust", sign: "+" },
      entrega: { label: "Entrega", icon: <ArrowUpCircle size={14} />, cls: "mdj-chip-gold", sign: "−" },
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="mdj-card mdj-wallet-hero">
          <div className="mdj-mono" style={{ fontSize: 11, opacity: 0.6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <PiggyBank size={14} /> SALDO ACTUAL DEL MONEDERO
          </div>
          <div className="mdj-display mdj-wallet-amount">{money(group.pot)}</div>
          <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 4 }}>
            {compact ? "Aquí se guardan las cuotas de todos antes de entregarse a quien esté en turno." : `${periodLabel(group.tipo, group.periodIndex)} · ${paidCount}/${n} han cotizado`}
          </div>
        </div>

        {!compact && (
          <div className="mdj-stats-grid">
            <div className="mdj-card mdj-stat-card">
              <div className="mdj-mono mdj-stat-label">Total histórico recaudado</div>
              <div className="mdj-display mdj-stat-value">{money(totalAportado)}</div>
            </div>
            <div className="mdj-card mdj-stat-card">
              <div className="mdj-mono mdj-stat-label">Total histórico entregado</div>
              <div className="mdj-display mdj-stat-value">{money(totalEntregado)}</div>
            </div>
            <div className="mdj-card mdj-stat-card">
              <div className="mdj-mono mdj-stat-label">Total en moras</div>
              <div className="mdj-display mdj-stat-value">{money(group.totalMora)}</div>
            </div>
          </div>
        )}

        <div className="mdj-card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{compact ? "Movimientos recientes" : "Historial de movimientos"}</div>
          {list.length === 0 ? (
            <div className="mdj-mono" style={{ fontSize: 12, opacity: 0.5 }}>Todavía no hay movimientos en el monedero.</div>
          ) : (
            <div className="mdj-transactions">
              {list.map((t) => {
                const meta = txMeta[t.type];
                return (
                  <div key={t.id} className="mdj-transaction-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={"mdj-chip " + meta.cls} style={{ display: "flex", alignItems: "center", gap: 4 }}>{meta.icon} {meta.label}</span>
                      <span>{t.memberName}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mdj-mono" style={{ fontWeight: 700 }}>{meta.sign} {money(t.amount)}</div>
                      <div className="mdj-mono" style={{ fontSize: 10.5, opacity: 0.5 }}>{t.period} · {timeOf(t.ts)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  function ForoSection() {
    return (
      <div className="mdj-card mdj-foro-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
          <MessageSquare size={16} /> Foro del grupo
          <span className="mdj-mono" style={{ fontSize: 11, opacity: 0.5, fontWeight: 400 }}>· visible para todos los integrantes</span>
        </div>
        <div className="mdj-foro-messages">
          {group.foro.map((f) => {
            if (f.type === "system") return <div key={f.id} className="mdj-sys">{f.text} <span className="mdj-mono" style={{ opacity: 0.5 }}>· {timeOf(f.ts)}</span></div>;
            if (f.type === "alert") return <div key={f.id} className="mdj-sys-alert">{f.text} <span className="mdj-mono" style={{ opacity: 0.6 }}>· {timeOf(f.ts)}</span></div>;
            if (f.type === "payout") return <div key={f.id} className="mdj-sys-payout">{f.text} <span className="mdj-mono" style={{ opacity: 0.6 }}>· {timeOf(f.ts)}</span></div>;
            const mine = f.author === viewer?.name;
            return (
              <div key={f.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div className={"mdj-bubble" + (mine ? " mdj-bubble-me" : "")}>
                  <div className="mdj-mono" style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 2 }}>{f.author} · {f.role} · {timeOf(f.ts)}</div>
                  {f.text}
                </div>
              </div>
            );
          })}
          <div ref={foroEndRef} />
        </div>
        <div className="mdj-chat-input-wrapper">
          <input className="mdj-input" placeholder="Escribe un mensaje al grupo…" value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
          <button className="mdj-btn mdj-btn-gold" onClick={sendChat}><Send size={14} /></button>
        </div>
      </div>
    );
  }

  function TopBar() {
    const badge = role === "Representante" ? { icon: <Crown size={13} />, cls: "mdj-chip-gold" } : role === "Secretario" ? { icon: <ShieldCheck size={13} />, cls: "mdj-chip-teal" } : { icon: <Users size={13} />, cls: "mdj-chip-amber" };
    return (
      <div className="mdj-header">
        <div className="mdj-header-content">
          <div className="mdj-header-left">
            <div className="mdj-mono" style={{ fontSize: 11, letterSpacing: "0.14em", opacity: 0.7, marginBottom: 4 }}>MI DJANGE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {group.logo ? (
                <img src={group.logo} alt="logo del djangue" className="mdj-logo" />
              ) : (
                <div className="mdj-logo-placeholder">
                  {group.name.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="mdj-display mdj-header-title">{group.name}</div>
                {group.slogan && <div className="mdj-header-slogan">{group.slogan}</div>}
              </div>
            </div>
          </div>
          <button className="mdj-btn mdj-btn-ghost mdj-reset-btn" onClick={resetDemo}>
            <RotateCcw size={14} /> <span className="mdj-reset-label">Reiniciar demo</span>
          </button>
        </div>
        <div className="mdj-viewer-selector">
          <span className="mdj-mono" style={{ fontSize: 12, opacity: 0.7 }}>Viendo como:</span>
          <select className="mdj-select" value={viewerId} onChange={(e) => setViewerId(e.target.value)} style={{ background: "var(--paper)" }}>
            {group.members.map((m) => <option key={m.id} value={m.id}>{m.name} — {roleOf(m.id)}</option>)}
          </select>
          <span className={"mdj-chip " + badge.cls}><span style={{ display: "flex", alignItems: "center", gap: 4 }}>{badge.icon} Vista de {role}</span></span>
        </div>
      </div>
    );
  }

  // ---------- VISTAS POR ROL ----------

  function RepresentanteView() {
    const totalCirculante = group.members.reduce((s, m) => s + m.wallet, 0) + group.pot;
    const kpis = [
      { label: "Recaudado este periodo", value: money(group.pot), icon: <TrendingUp size={16} /> },
      { label: "Al día", value: `${paidCount}/${n}`, icon: <Check size={16} /> },
      { label: "Próximo en turno", value: beneficiary?.name.split(" ")[0], icon: <Hourglass size={16} /> },
      { label: "Moras históricas", value: money(group.totalMora), icon: <AlertTriangle size={16} /> },
    ];
    return (
      <>
        <div className="mdj-view-header">
          <LayoutDashboard size={18} />
          <div className="mdj-display" style={{ fontSize: 18, fontWeight: 600 }}>Panel del Representante General</div>
        </div>
        <div className="mdj-mono mdj-view-subtitle">Control total del djangue: cuota, periodicidad, mora y turnos.</div>

        <div style={{ marginBottom: 16 }}>
          <IdentityBlock />
        </div>

        <TabBar />
        {activeTab === "monedero" ? (
          <WalletTab compact={false} />
        ) : (
        <>
        <div className="mdj-kpi-grid">
          {kpis.map((k) => (
            <div key={k.label} className="mdj-card mdj-kpi-card">
              <div className="mdj-kpi-label">{k.icon} {k.label}</div>
              <div className="mdj-display mdj-kpi-value">{k.value}</div>
            </div>
          ))}
        </div>

        <div className="mdj-main-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SettingsBlock fullAccess={true} />
            <div className="mdj-card" style={{ padding: 18 }}>
              <div className="mdj-mono" style={{ fontSize: 12, opacity: 0.6, textAlign: "center", marginBottom: 6 }}>{periodLabel(group.tipo, group.periodIndex)} · circulante total {money(totalCirculante)}</div>
              <div style={{ display: "flex", justifyContent: "center" }}><Wheel /></div>
              <ProgressBar />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AlertBanner withActions />
            <div className="mdj-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, marginBottom: 12 }}><Users size={16} /> Integrantes</div>
              <MembersTable showWallet />
            </div>
            <AddMemberBlock />
          </div>
        </div>
        </>
        )}
      </>
    );
  }

  function SecretarioView() {
    const auditTrail = group.foro.filter((f) => f.type !== "chat").slice().reverse().slice(0, 12);
    return (
      <>
        <div className="mdj-view-header">
          <ClipboardList size={18} />
          <div className="mdj-display" style={{ fontSize: 18, fontWeight: 600 }}>Panel del Secretario General</div>
        </div>
        <div className="mdj-mono mdj-view-subtitle">Supervisión de cotizaciones, verificación de pagos y control de mora.</div>

        <TabBar />
        {activeTab === "monedero" ? (
          <WalletTab compact={false} />
        ) : (
        <div className="mdj-main-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AlertBanner withActions />
            <div className="mdj-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, marginBottom: 12 }}><ListChecks size={16} /> Ledger de verificación — {periodLabel(group.tipo, group.periodIndex)}</div>
              <MembersTable showWallet />
            </div>
            <AddMemberBlock />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="mdj-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "center" }}><Wheel size={200} /></div>
              <ProgressBar />
            </div>
            <SettingsBlock fullAccess={false} />
            <div className="mdj-card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Registro de auditoría</div>
              <div className="mdj-audit-trail">
                {auditTrail.map((f) => (
                  <div key={f.id} className="mdj-audit-entry">
                    <span className="mdj-mono" style={{ opacity: 0.5 }}>{timeOf(f.ts)} — </span>{f.text}
                  </div>
                ))}
                {auditTrail.length === 0 && <div className="mdj-mono" style={{ fontSize: 12, opacity: 0.5 }}>Sin eventos todavía.</div>}
              </div>
            </div>
          </div>
        </div>
        )}
      </>
    );
  }

  function IntegranteView() {
    const myIndex = group.members.findIndex((m) => m.id === viewerId);
    const turnsAway = (myIndex - (group.turnIndex % n) + n) % n;
    const status = group.contributions[viewerId]?.status;
    return (
      <>
        <div className="mdj-card mdj-my-turn-card" style={{ background: turnsAway === 0 ? "var(--gold-soft)" : "#fff" }}>
          <div className="mdj-mono" style={{ fontSize: 11, opacity: 0.6 }}>{periodLabel(group.tipo, group.periodIndex)}</div>
          <div className="mdj-display mdj-my-turn-title">
            {turnsAway === 0 ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><PartyPopper size={22} /> ¡Es tu turno de recibir!</span> : `Faltan ${turnsAway} turno${turnsAway > 1 ? "s" : ""} para que te toque a ti`}
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Recibirás hasta {money(group.cuota * n)} cuando se complete tu turno.</div>
        </div>

        <div className="mdj-main-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="mdj-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "center" }}><Wheel size={220} /></div>
              <ProgressBar />
            </div>
            <div className="mdj-card mdj-wallet-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Wallet size={16} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tu billetera: {money(viewer?.wallet)}</div>
              </div>
              {status === "pagado" ? (
                <div className="mdj-chip mdj-chip-teal" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={13} /> Ya cotizaste este periodo</div>
              ) : status === "justificado" ? (
                <div className="mdj-chip mdj-chip-amber" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Bell size={13} /> Retraso notificado — sin penalización</div>
              ) : (
                <div className="mdj-wallet-actions">
                  <button className="mdj-btn mdj-btn-gold" disabled={viewer.wallet < group.cuota} onClick={() => pagarCuota(viewerId)}>Aportar cuota de {money(group.cuota)}</button>
                  {notifyOpenFor === viewerId ? (
                    <div className="mdj-notify-form">
                      <input className="mdj-input" placeholder="Motivo del retraso" value={notifyNote} onChange={(e) => setNotifyNote(e.target.value)} />
                      <button className="mdj-btn mdj-btn-teal" onClick={() => notificarRetraso(viewerId, notifyNote)}>Enviar</button>
                    </div>
                  ) : (
                    <button className="mdj-btn mdj-btn-ghost" onClick={() => setNotifyOpenFor(viewerId)}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Bell size={14} /> No podré cotizar a tiempo — notificar</span>
                    </button>
                  )}
                </div>
              )}
              {viewer.wallet < group.cuota && !status && <div className="mdj-error-msg">Saldo insuficiente en tu billetera personal.</div>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AlertBanner withActions={false} />
            <div className="mdj-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, marginBottom: 12 }}><Users size={16} /> Cómo va el grupo</div>
              <MembersTable showWallet={false} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mdj-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        
        /* Variables */
        .mdj-wrap { 
          --ink:#10202B; --paper:#F1EAD9; --paper2:#E7DCC3; --gold:#C9A227; --gold-soft:#E7C766;
          --teal:#2C6E63; --teal-soft:#DCEAE5; --rust:#A8432E; --rust-soft:#F2DDD6; 
          --amber:#B8790F; --amber-soft:#F1DFB8; --line: rgba(16,32,43,0.12);
          background: var(--paper); color: var(--ink); font-family:'Inter',sans-serif; 
          min-height: 100vh; width: 100%;
        }
        .mdj-display{ font-family:'Fraunces',serif; }
        .mdj-mono{ font-family:'IBM Plex Mono',monospace; }
        
        /* Header */
        .mdj-header{ background: var(--ink); color: var(--paper); padding: 22px 20px 26px; }
        .mdj-header-content{ display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
        .mdj-header-title{ font-size: 26px; font-weight: 600; line-height: 1.1; }
        .mdj-header-slogan{ font-size: 12.5px; opacity: 0.7; font-style: italic; }
        .mdj-viewer-selector{ margin-top: 18px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
        .mdj-logo{ width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(241,234,217,0.35); }
        .mdj-logo-placeholder{ width: 40px; height: 40px; border-radius: 50%; background: var(--gold-soft); color: #4A3A08; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: Fraunces, serif; }
        .mdj-logo-small{ width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line); }
        .mdj-logo-placeholder-small{ width: 28px; height: 28px; border-radius: 50%; background: var(--gold-soft); display: flex; align-items: center; justify-content: center; fontSize: 12px; font-weight: 700; }
        .mdj-logo-preview{ width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line); }
        .mdj-reset-btn{ color: var(--paper) !important; border-color: rgba(241,234,217,0.3) !important; }
        
        /* Cards */
        .mdj-card{ background:#fff; border:1px solid var(--line); border-radius:16px; transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .mdj-card:hover{ box-shadow: 0 4px 12px rgba(16,32,43,0.06); }
        
        /* Chips */
        .mdj-chip{ border-radius:999px; font-size:12px; font-weight:600; padding:3px 10px; letter-spacing:.02em; white-space:nowrap; transition: all 0.2s ease; }
        .mdj-chip-gold{ background: var(--gold-soft); color:#4A3A08; }
        .mdj-chip-teal{ background: var(--teal-soft); color: var(--teal); }
        .mdj-chip-rust{ background: var(--rust-soft); color: var(--rust); }
        .mdj-chip-amber{ background: var(--amber-soft); color: var(--amber); }
        
        /* Buttons */
        .mdj-btn{ border-radius:10px; font-weight:600; font-size:14px; padding:9px 16px; transition: all 0.2s ease; cursor:pointer; border:none; }
        .mdj-btn:active{ transform: scale(0.97); }
        .mdj-btn:disabled{ opacity:.4; cursor:not-allowed; }
        .mdj-btn:hover:not(:disabled){ filter: brightness(0.95); }
        .mdj-btn-gold{ background: var(--gold); color: var(--ink); }
        .mdj-btn-ghost{ background: transparent; color: var(--ink); border:1px solid var(--line); }
        .mdj-btn-teal{ background: var(--teal); color: #fff; }
        .mdj-btn-rust{ background: var(--rust); color: #fff; }
        
        /* Inputs */
        .mdj-select{ border:1px solid var(--line); border-radius:10px; padding:8px 10px; background:#fff; font-size:14px; font-weight:500; transition: border-color 0.2s ease; }
        .mdj-select:focus{ outline: none; border-color: var(--gold); }
        .mdj-input{ border:1px solid var(--line); border-radius:10px; padding:8px 10px; font-size:14px; width:100%; transition: border-color 0.2s ease; }
        .mdj-input:focus{ outline: none; border-color: var(--gold); }
        
        /* Wheel */
        .mdj-wheel{ filter: drop-shadow(0 2px 8px rgba(16,32,43,0.08)); }
        .mdj-track{ fill:none; stroke: var(--line); stroke-width:2; }
        .mdj-node-pending{ fill:#fff; stroke: var(--line); stroke-width:2; transition: all 0.3s ease; }
        .mdj-node-paid{ fill: var(--teal); stroke: var(--teal); animation: pulse 0.5s ease; }
        .mdj-node-current{ fill: var(--gold); stroke: var(--gold); animation: pulse 0.6s ease; }
        .mdj-node-justificado{ fill: var(--amber-soft); stroke: var(--amber); }
        .mdj-check-badge{ animation: pop 0.3s ease; }
        .mdj-node-group:hover .mdj-node-pending{ stroke-width: 3; }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Progress Bar */
        .mdj-progress-wrapper{ margin-top: 12px; }
        .mdj-progress-track{ height: 8px; border-radius: 999px; background: var(--paper2); overflow: hidden; }
        .mdj-progress-fill{ height: 100%; background: var(--teal); transition: width 0.5s ease; }
        
        /* Banner */
        .mdj-banner{ background: var(--rust-soft); border:1px solid rgba(168,67,46,0.35); border-radius:12px; padding:12px 14px; animation: fadeIn 0.3s ease; }
        .mdj-fade-in{ animation: fadeIn 0.3s ease; }
        
        /* Member Row */
        .mdj-member-row{ display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); transition: all 0.2s ease; }
        .mdj-member-row:hover{ border-color: var(--gold); background: var(--paper2) !important; }
        
        /* Tabs */
        .mdj-tab-bar{ display: flex; gap: 6px; margin-bottom: 16px; border-bottom: 1px solid var(--line); }
        .mdj-tab{ display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; padding: 8px 4px; margin-right: 18px; font-size: 12.5px; font-weight: 600; color: rgba(16,32,43,0.45); border-bottom: 2px solid transparent; transition: all 0.2s ease; }
        .mdj-tab-active{ color: var(--ink); border-bottom-color: var(--gold); }
        .mdj-tab:hover{ color: var(--ink); }
        
        /* Wallet */
        .mdj-wallet-hero{ padding: 20px; text-align: center; }
        .mdj-wallet-amount{ font-size: 36px; font-weight: 700; margin-top: 6px; }
        
        /* Stats */
        .mdj-stats-grid{ display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 10px; }
        .mdj-stat-card{ padding: 14px; }
        .mdj-stat-label{ font-size: 11px; opacity: 0.6; }
        .mdj-stat-value{ font-size: 19px; font-weight: 600; margin-top: 4px; }
        
        /* Transactions */
        .mdj-transactions{ display: flex; flex-direction: column; gap: 8px; }
        .mdj-transaction-row{ display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-bottom: 1px dashed var(--line); padding-bottom: 7px; }
        .mdj-transaction-row:last-child{ border-bottom: none; }
        
        /* Foro */
        .mdj-foro-card{ padding: 18px; grid-column: 1 / -1; }
        .mdj-foro-messages{ max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px; }
        .mdj-foro-messages::-webkit-scrollbar{ width: 6px; }
        .mdj-foro-messages::-webkit-scrollbar-thumb{ background: var(--line); border-radius: 999px; }
        .mdj-chat-input-wrapper{ display: flex; gap: 8px; margin-top: 12px; }
        .mdj-bubble{ background: var(--paper2); border-radius: 12px; padding: 8px 12px; font-size: 13px; max-width: 85%; animation: fadeIn 0.2s ease; }
        .mdj-bubble-me{ background: var(--gold-soft); }
        .mdj-sys{ text-align: center; font-size: 12px; opacity: 0.7; margin: 4px 0; }
        .mdj-sys-alert{ text-align: center; font-size: 12px; color: var(--rust); font-weight: 600; margin: 4px 0; }
        .mdj-sys-payout{ text-align: center; font-size: 12px; color: var(--teal); font-weight: 700; margin: 4px 0; }
        
        /* View Headers */
        .mdj-view-header{ display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .mdj-view-subtitle{ font-size: 12px; opacity: 0.6; margin-bottom: 14px; }
        
        /* KPI Grid */
        .mdj-kpi-grid{ display: grid; grid-template-columns: repeat(auto-fit,minmax(150px,1fr)); gap: 10px; margin-bottom: 16px; }
        .mdj-kpi-card{ padding: 14px; }
        .mdj-kpi-label{ display: flex; align-items: center; gap: 6px; opacity: 0.6; font-size: 11px; }
        .mdj-kpi-value{ font-size: 20px; font-weight: 600; margin-top: 4px; }
        
        /* Main Grid */
        .mdj-main-grid{ display: grid; grid-template-columns: minmax(280px,1fr) minmax(280px,1.2fr); gap: 16px; }
        
        /* Settings */
        .mdj-settings-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
        
        /* Forms */
        .mdj-add-member-form{ display: grid; grid-template-columns: 1.4fr 1fr auto; gap: 8px; margin-top: 12px; }
        .mdj-notify-form{ display: flex; gap: 6px; }
        
        /* Wallet Card */
        .mdj-wallet-card{ padding: 18px; }
        .mdj-wallet-actions{ display: flex; flex-direction: column; gap: 8px; }
        
        /* My Turn Card */
        .mdj-my-turn-card{ padding: 20px; margin-bottom: 16px; }
        .mdj-my-turn-title{ font-size: 22px; font-weight: 600; margin-top: 2px; }
        
        /* Audit Trail */
        .mdj-audit-trail{ display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
        .mdj-audit-entry{ font-size: 12px; border-bottom: 1px dashed var(--line); padding-bottom: 6px; }
        .mdj-audit-entry:last-child{ border-bottom: none; }
        
        /* Error Message */
        .mdj-error-msg{ font-size: 12px; color: var(--rust); margin-top: 8px; }
        
        /* Responsive */
        @media (max-width: 768px) {
          .mdj-main-grid{ grid-template-columns: 1fr; }
          .mdj-kpi-grid{ grid-template-columns: repeat(2, 1fr); }
          .mdj-stats-grid{ grid-template-columns: 1fr; }
          .mdj-settings-grid{ grid-template-columns: 1fr; }
          .mdj-add-member-form{ grid-template-columns: 1fr; }
          .mdj-header-content{ flex-direction: column; align-items: stretch; }
          .mdj-reset-btn{ width: 100%; justify-content: center; }
          .mdj-viewer-selector{ flex-direction: column; align-items: stretch; }
          .mdj-tab-label{ display: none; }
          .mdj-header-title{ font-size: 20px; }
          .mdj-wallet-amount{ font-size: 28px; }
        }
        
        @media (max-width: 480px) {
          .mdj-header{ padding: 16px; }
          .mdj-kpi-grid{ grid-template-columns: 1fr; }
          .mdj-transaction-row{ flex-direction: column; align-items: flex-start; gap: 4px; }
          .mdj-member-row{ flex-direction: column; align-items: flex-start; gap: 8px; }
          .mdj-chat-input-wrapper{ flex-direction: column; }
          .mdj-reset-label{ display: none; }
        }
      `}</style>

      <TopBar />

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {role === "Representante" && <RepresentanteView />}
        {role === "Secretario" && <SecretarioView />}
        {role === "Integrante" && <IntegranteView />}
        <ForoSection />
      </div>
    </div>
  );
}
