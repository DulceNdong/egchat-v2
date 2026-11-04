// Módulo Recarga Tel. — GETESA, GECOMSA y MUNI
//
// EGChat no tiene canal con las operadoras, así que aquí no se recarga ningún
// teléfono ni se cobra nada: se registra la solicitud (importe 0) y la
// operadora la confirma. Antes este archivo traía tarifas inventadas en
// JavaScript y un saldo de 100 000 XAF que no era el del usuario.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { serviciosAPI, walletAPI, Solicitud, Tarifa } from '../../api';
import { toast } from '../Toast';
import {
  ServiceModuleShell, ServiceHomeGrid, ServiceBanner, OperatorGrid,
  StatusBadge, SupportScreen, EmptyState, PrimaryButton, FormField, Ico,
} from './ServiceModuleUI';
import { t as tr } from '../../translations';

type RScreen = 'home' | 'operators' | 'packages' | 'confirm' | 'success' | 'history' | 'myLines' | 'support';

interface MobileOperator { id: string; name: string; code: string; color: string }

interface Props { visible: boolean; onClose: () => void; }

const DEFAULT_OPERATORS: MobileOperator[] = [
  { id: 'getesa', name: 'GETESA', code: 'GET', color: '#003F8A' },
  { id: 'gecomsa', name: 'GECOMSA', code: 'GEC', color: '#00873E' },
  { id: 'muni', name: 'MUNI', code: 'MUN', color: '#E8320A' },
];

const MOTIVOS = [
  { id: 'saldo', label: 'Saldo' },
  { id: 'datos', label: 'Datos' },
  { id: 'minutos', label: 'Minutos' },
];

const MIN_IMPORTE = 100;

export const RecargaModal: React.FC<Props> = ({ visible, onClose }) => {
  const [screen, setScreen] = useState<RScreen>('home');
  const [selectedOperator, setSelectedOperator] = useState<MobileOperator | null>(null);
  const [motivo, setMotivo] = useState('saldo');
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [phone, setPhone] = useState('');
  const [monto, setMonto] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [recibo, setRecibo] = useState('');
  const [ref, setRef] = useState('');
  const [lines, setLines] = useState<Array<{ number: string; op: string }>>([]);
  const [newLine, setNewLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (visible) { cargarSaldo(); cargarSolicitudes(); cargarTarifas(); return; }
    setScreen('home'); setSelectedOperator(null); setPhone(''); setMonto('');
    setRecibo(''); setRef(''); setMotivo('saldo'); setLoading(false);
  }, [visible]);

  const cargarSaldo = async () => {
    try {
      const r = await walletAPI.getBalance();
      setBalance(Number(r.balance) || 0);
    } catch {
      setBalance(null);
    }
  };

  const cargarSolicitudes = async () => {
    try { setSolicitudes(await serviciosAPI.solicitudes('recarga')); } catch { setSolicitudes([]); }
  };

  // Solo tarifas publicadas en service_tariffs; sin filas, el importe lo escribe el usuario.
  const cargarTarifas = async () => {
    try {
      const res = await serviciosAPI.tarifas();
      setTarifas((res.tarifas || []).filter(x => x.service === 'recarga'));
    } catch {
      setTarifas([]);
    }
  };

  const importe = parseInt(monto.replace(/[^0-9]/g, ''), 10) || 0;
  const puedeEnviar = !!selectedOperator && !!phone.trim() && importe >= MIN_IMPORTE && !loading;

  const solicitar = async () => {
    if (!puedeEnviar) return;
    setLoading(true);
    try {
      const res = await serviciosAPI.solicitud({
        provider: 'recarga',
        tipo: 'recarga',
        referencia: selectedOperator?.id,
        datos: {
          operador: selectedOperator?.name || null,
          numero: phone.trim(),
          motivo,
          importe_declarado: importe,
        },
        external_id: ref || `REA-${selectedOperator?.id || 'op'}-${Date.now()}`,
      });
      setRecibo(res.solicitudId);
      setRef('');
      setMonto('');
      await cargarSolicitudes();
      setScreen('success');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar la solicitud de recarga.');
    } finally {
      setLoading(false);
    }
  };

  const color = selectedOperator?.color || '#07C160';

  const titles: Record<RScreen, string> = {
    home: 'Recarga Tel.', operators: 'Operadores',
    packages: `${selectedOperator?.name || ''} — Recarga`, confirm: 'Confirmar',
    success: tr('svcCompleted'), history: tr('history'), myLines: tr('xtMisLineas'), support: tr('svcSupport'),
  };

  const goBack = () => {
    if (screen === 'home') onClose();
    else if (screen === 'packages') setScreen('operators');
    else if (screen === 'confirm') setScreen('packages');
    else if (screen === 'success') setScreen('history');
    else setScreen('home');
  };

  const homeItems = [
    { id: 'operators', label: tr('xtRecargarSaldo'), desc: 'Solicitud a la operadora', color: '#2E9E6B', bg: '#F0FAF5', icon: Ico.signal('#2E9E6B') },
    { id: 'history', label: tr('history'), desc: `${solicitudes.length} solicitudes`, color: '#6B5BD6', bg: '#F3F1FD', icon: Ico.clock('#6B5BD6') },
    { id: 'myLines', label: tr('xtMisLineas'), desc: `${lines.length} guardadas`, color: '#0E7FA8', bg: '#EDF7FB', icon: Ico.mobile('#0E7FA8') },
    { id: 'support', label: 'Soporte', desc: 'Reportar fallo', color: '#C0392B', bg: '#FDF2F2', icon: Ico.headset('#C0392B') },
  ];

  return (
    <ServiceModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? 'Saldo — Datos — Minutos' : undefined}
      onBack={goBack}
      onClose={onClose}
    >
      {screen === 'home' && (
        <View>
          <ServiceHomeGrid items={homeItems} onPress={id => setScreen(id as RScreen)} />
          <Text style={s.nota}>
            EGChat no tiene canal directo con GETESA, GECOMSA ni MUNI. Aquí se registra la solicitud: la
            operadora la confirma y el cargo se hace después desde el monedero. Al enviar no se debita nada.
          </Text>
          <ServiceBanner
            key={refreshKey}
            label="Operadores disponibles"
            count={DEFAULT_OPERATORS.length}
            suffix="GETESA — GECOMSA — MUNI"
            colors={['#2E9E6B', '#1B7A52']}
            onRefresh={() => { setRefreshKey(k => k + 1); cargarSolicitudes(); cargarSaldo(); }}
          />
        </View>
      )}

      {screen === 'operators' && (
        <OperatorGrid
          items={DEFAULT_OPERATORS.map(op => ({ ...op, color: op.color }))}
          onSelect={id => {
            const op = DEFAULT_OPERATORS.find(o => o.id === id);
            if (!op) return;
            setSelectedOperator(op);
            setRef(`REA-${op.id}-${Date.now()}`);
            setScreen('packages');
          }}
        />
      )}

      {screen === 'packages' && selectedOperator && (
        <View>
          <View style={s.phoneRow}>
            <Text style={s.phoneEmoji}>📞</Text>
            <View style={{ flex: 1 }}>
              <FormField
                placeholder={tr('kyPhoneNumber')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <View style={s.chipRow}>
            {MOTIVOS.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[s.chip, motivo === m.id && { backgroundColor: '#F0FAF5', borderColor: color }]}
                onPress={() => setMotivo(m.id)}
              >
                <Text style={[s.chipText, motivo === m.id && { color, fontWeight: '700' }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormField placeholder="Importe que pides (XAF)" value={monto} onChangeText={setMonto} keyboardType="numeric" />
          {tarifas.length > 0 && (
            <View style={s.pkgCard}>
              <Text style={s.tarifaTitulo}>Tarifas publicadas por la operadora</Text>
              <View style={s.pkgGrid}>
                {tarifas.map(t => (
                  <TouchableOpacity
                    key={t.variant}
                    style={[s.pkgCell, !phone.trim() && s.pkgCellDisabled]}
                    onPress={() => { if (phone.trim()) setMonto(String(Number(t.amount))); }}
                    activeOpacity={phone.trim() ? 0.7 : 1}
                  >
                    <View style={[s.pkgIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' }]}>
                      {Ico.mobile(color)}
                    </View>
                    <Text style={s.pkgName} numberOfLines={2}>{t.variant}</Text>
                    <Text style={[s.pkgPrice, { color }]}>{Number(t.amount).toLocaleString()} XAF</Text>
                    {!!t.concept && <Text style={s.pkgValid}>{t.concept}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <Text style={s.nota}>
            El importe lo escribes tú: es lo que pides a {selectedOperator.name}, no una tarifa de EGChat.
            {balance === null
              ? ' No hemos podido leer tu saldo del monedero.'
              : ` Saldo actual del monedero: ${balance.toLocaleString()} XAF.`}
          </Text>
          {!phone.trim() && <Text style={s.warn}>{tr('svcEnterNumberWarn')}</Text>}
          <PrimaryButton
            label={loading ? tr('processing') : 'Solicitar recarga'}
            onPress={() => setScreen('confirm')}
            disabled={!phone.trim() || importe < MIN_IMPORTE}
            color={color}
          />
        </View>
      )}

      {screen === 'confirm' && selectedOperator && (
        <View>
          <View style={s.confirmCard}>
            {[
              [tr('mznOperatorLabel'), selectedOperator.name],
              [tr('svcNumberLabel'), phone],
              ['Qué pides', MOTIVOS.find(m => m.id === motivo)?.label || motivo],
              ['Importe solicitado', `${importe.toLocaleString()} XAF`],
              ['Saldo del monedero', balance === null ? 'sin datos' : `${balance.toLocaleString()} XAF`],
              ['Estado', 'Pendiente de confirmar'],
            ].map(([l, v]) => (
              <View key={l} style={s.confirmRow}>
                <Text style={s.confirmLabel}>{l}</Text>
                <Text style={s.confirmValue}>{v}</Text>
              </View>
            ))}
          </View>
          {balance !== null && importe > balance && (
            <Text style={s.insufficient}>
              Pides más de lo que hay en el monedero. Puedes registrar la solicitud igualmente; el cargo
              solo se intenta si la operadora la confirma.
            </Text>
          )}
          <Text style={s.nota}>
            Referencia de esta solicitud: {ref || '—'}. Repetir el mismo envío no duplica la solicitud.
          </Text>
          <PrimaryButton
            label={loading ? tr('processing') : 'Registrar solicitud'}
            onPress={solicitar}
            disabled={!puedeEnviar}
            color={color}
          />
        </View>
      )}

      {screen === 'success' && selectedOperator && (
        <View style={s.success}>
          <View style={s.successCircle}><Text style={{ fontSize: 32 }}>📨</Text></View>
          <Text style={s.successTitle}>Solicitud registrada</Text>
          <Text style={s.successSub}>{selectedOperator.name} — {phone}</Text>
          <Text style={s.successSub}>{importe.toLocaleString()} XAF pedidos — Referencia: {recibo}</Text>
          <Text style={s.nota}>
            No se ha cobrado nada. La operadora confirma la recarga y entonces el cargo sale del monedero
            por el libro mayor.
          </Text>
          <TouchableOpacity
            style={[s.doneBtn, { backgroundColor: color }]}
            onPress={() => { setRecibo(''); setPhone(''); setSelectedOperator(null); setScreen('home'); }}
          >
            <Text style={s.doneBtnText}>Listo</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'history' && (
        solicitudes.length === 0 ? (
          <EmptyState emoji="📋" title={tr('xtSinHistorial')} desc={tr('xtTusRecargasApareceranAqui')} />
        ) : solicitudes.map(h => (
          <View key={h.order_ref} style={s.orderCard}>
            <View style={s.orderTop}>
              <View>
                <Text style={s.orderTitle}>{h.payload?.operador || 'Recarga'}</Text>
                <Text style={s.orderSub}>
                  {h.payload?.numero || h.contract_ref} — {Number(h.payload?.importe_declarado || 0).toLocaleString()} XAF pedidos
                </Text>
              </View>
              <StatusBadge status={h.status === 'pending' ? 'pendiente' : h.status} />
            </View>
            <View style={s.orderBottom}>
              <Text style={s.orderDate}>📅 {new Date(h.created_at).toLocaleDateString('es')}</Text>
              <Text style={s.orderAmount}>{Number(h.amount) > 0 ? `${Number(h.amount).toLocaleString()} XAF` : 'Sin cobro'}</Text>
            </View>
          </View>
        ))
      )}

      {screen === 'myLines' && (
        <View>
          <View style={s.addLineRow}>
            <FormField placeholder={tr('xtAnadirNumero240')} value={newLine} onChangeText={setNewLine} keyboardType="phone-pad" />
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => {
                if (!newLine.trim()) return;
                setLines(p => [...p, { number: newLine.trim(), op: selectedOperator?.name || 'sin operador' }]);
                setNewLine('');
              }}
            >
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.nota}>
            Números que guardas en este teléfono para escribirlos más rápido. EGChat no puede comprobar a
            qué línea pertenece cada uno.
          </Text>
          {lines.length === 0 ? (
            <Text style={s.noLines}>{tr('xtSinLineasGuardadas')}</Text>
          ) : lines.map((l, i) => (
            <View key={i} style={s.lineCard}>
              <View>
                <Text style={s.lineNum}>{l.number}</Text>
                <Text style={s.lineOp}>{l.op}</Text>
              </View>
              <TouchableOpacity onPress={() => setLines(p => p.filter((_, j) => j !== i))}>
                <Text style={s.lineDel}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {screen === 'support' && <SupportScreen />}
    </ServiceModuleShell>
  );
};


const s = StyleSheet.create({
  loading: { alignItems: 'center', paddingVertical: 30 },
  nota: { fontSize: 12, color: '#6B7280', lineHeight: 17, marginBottom: 10 },
  tarifaTitulo: { fontSize: 11, fontWeight: '700', color: '#6B7280', padding: 10 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: 'transparent' },
  chipText: { fontSize: 12, color: '#555' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  phoneEmoji: { fontSize: 16 },
  pkgCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  pkgGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F0F2F5' },
  pkgCell: { width: '33.333%', backgroundColor: '#fff', alignItems: 'center', padding: 12, marginBottom: 1 },
  pkgCellDisabled: { opacity: 0.5 },
  pkgIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pkgName: { fontSize: 10, fontWeight: '700', color: '#111827', textAlign: 'center' },
  pkgPrice: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pkgValid: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  warn: { textAlign: 'center', fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 8 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  confirmLabel: { fontSize: 13, color: '#888' },
  confirmValue: { fontSize: 13, fontWeight: '700', color: '#111', maxWidth: '55%', textAlign: 'right' },
  insufficient: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 9, fontSize: 12, color: '#EF4444', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  success: { alignItems: 'center', paddingVertical: 40 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FAF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#888', marginBottom: 4 },
  doneBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 20 },
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  orderSub: { fontSize: 11, color: '#888' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  orderDate: { fontSize: 12, color: '#888' },
  orderAmount: { fontSize: 12, fontWeight: '700', color: '#07C160' },
  addLineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  addBtn: { backgroundColor: '#07C160', borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  noLines: { textAlign: 'center', paddingVertical: 30, color: '#888', fontSize: 13 },
  lineCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineNum: { fontSize: 14, fontWeight: '700', color: '#111' },
  lineOp: { fontSize: 11, color: '#888' },
  lineDel: { color: '#DC2626', fontSize: 16, padding: 4 },
});
