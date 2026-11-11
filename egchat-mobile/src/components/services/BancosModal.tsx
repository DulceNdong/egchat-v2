// Módulo Bancos — directorio de bancos de Guinea Ecuatorial + solicitudes.
//
// EGChat no tiene conexión con los sistemas de estos bancos: no conocemos
// cuentas, saldos ni movimientos, así que aquí no se enseñan balances.
// Las acciones (transferir, préstamo, factura, invertir, tarjeta) se registran
// como solicitudes con importe 0 y las confirma el banco.
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GQ_BANKS, GQBank } from '../../data/serviciosFinancieros';
import { serviciosAPI, Solicitud } from '../../api';
import { toast } from '../Toast';
import { FinancialModuleShell, BankLogo } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { CardsScreen } from './CardsScreen';
import { useTranslation } from '../../context/LanguageContext';
import { t as tr } from '../../translations';

type BkScreen = 'home' | 'detail' | 'transfer' | 'loan' | 'bills' | 'invest' | 'cards' | 'requests' | 'success';

interface Props {
  visible: boolean;
  onClose: () => void;
  initScreen?: 'home' | 'cards';
}

const TIPO_LABEL: Record<string, string> = {
  transferencia: 'Transferencia',
  prestamo: 'Préstamo',
  aviso_pago: 'Pago de factura',
  inversion: 'Inversión',
  tarjeta: 'Tarjeta',
};

export const BancosModal: React.FC<Props> = ({ visible, onClose, initScreen = 'home' }) => {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<BkScreen>(initScreen);
  const [bank, setBank] = useState<GQBank | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [recibo, setRecibo] = useState({ ref: '', msg: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => { if (visible) setScreen(initScreen); }, [visible, initScreen]);
  useEffect(() => { if (visible) { cargarSolicitudes(); return; } setScreen('home'); setBank(null); setForm({}); }, [visible]);

  const cargarSolicitudes = async () => {
    try { setSolicitudes(await serviciosAPI.solicitudes('bancos')); } catch { setSolicitudes([]); }
  };

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const grad = bank ? [bank.color, bank.color2] as [string, string] : ['#1485EE', '#0052CC'] as [string, string];

  const back = () => {
    if (screen === 'home' || (screen === 'cards' && !bank)) onClose();
    else if (screen === 'detail') setScreen('home');
    else if (screen === 'cards' && bank) setScreen('detail');
    else setScreen(bank ? 'detail' : 'home');
  };

  const titles: Record<BkScreen, string> = {
    home: t('banks'), detail: bank?.name || '', transfer: t('svcTransfer'),
    loan: t('svcLoans'), bills: t('svcPayBill'), invest: t('svcInvestments'),
    cards: bank ? `${t('cards')} — ${bank.name}` : t('svcMyCards'), requests: t('history'), success: t('svcCompleted'),
  };

  // Registrar la solicitud en el servidor. Nada de esto debita el monedero:
  // el banco es quien confirma y ejecuta después.
  const enviar = async (tipo: string, datos: Record<string, any>) => {
    if (!bank || sending) return;
    setSending(true);
    try {
      const res = await serviciosAPI.solicitud({
        provider: 'bancos',
        tipo,
        referencia: bank.id,
        datos: { banco: bank.name, ...datos },
        external_id: form.ref || `BAN-${bank.id}-${tipo}-${Date.now()}`,
      });
      setRecibo({ ref: res.solicitudId, msg: res.message });
      await cargarSolicitudes();
      setForm({});
      setScreen('success');
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo registrar la solicitud.');
    } finally {
      setSending(false);
    }
  };

  const abrirFlujo = (b: GQBank, sc: BkScreen) => {
    setBank(b);
    setF('ref', `BAN-${b.id}-${sc}-${Date.now()}`);
    setScreen(sc);
  };

  const fixedTop = screen === 'home' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <LinearGradient colors={['#1A2B4A', '#2563EB']} style={s.aviso}>
        <Text style={s.avisoTitle}>Directorio bancario</Text>
        <Text style={s.avisoText}>
          EGChat no tiene conexión con sus sistemas: los saldos y movimientos de tus cuentas no
          aparecen aquí porque no los conocemos. Las operaciones quedan como solicitud pendiente
          hasta que el banco la confirme.
        </Text>
      </LinearGradient>
    </View>
  ) : undefined;

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? `${t('svcEquatorialGuinea')} — ${GQ_BANKS.length} ${t('svcBanksWord')}` : screen === 'detail' && bank ? bank.full : undefined}
      onBack={back}
      onClose={onClose}
      fixedTop={fixedTop}
      onRefresh={screen === 'home' || screen === 'requests' ? cargarSolicitudes : undefined}
    >
      {screen === 'home' && GQ_BANKS.map(b => (
        <View key={b.id} style={s.bankCard}>
          <View style={s.bankHeader}>
            <BankLogo bank={b} size={38} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.bankName}>{b.name}</Text>
              <Text style={s.bankMeta}>{b.branches} {t('svcBranches')} — {b.atms} ATMs</Text>
            </View>
            <TouchableOpacity style={s.verBtn} onPress={() => { setBank(b); setScreen('detail'); }}>
              <Text style={[s.verText, { color: b.color }]}>{t('svcView')}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.quickActions}>
            {([['Transferir', 'transfer'], ['Pagar', 'bills'], [tr('xtPrestamo'), 'loan'], ['Invertir', 'invest'], [t('cards'), 'cards']] as const).map(([label, sc]) => (
              <TouchableOpacity key={sc} style={s.quickBtn} onPress={() => abrirFlujo(b, sc)}>
                <Text style={s.quickText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {screen === 'detail' && bank && (
        <View>
          <View style={s.detailCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <BankLogo bank={bank} size={60} />
              <View>
                <Text style={s.detailName}>{bank.name}</Text>
                <Text style={s.detailSub}>Fundado en {bank.founded} — SWIFT: {bank.swift}</Text>
              </View>
            </View>
            <Text style={s.detailDesc}>{bank.desc}</Text>
            <View style={s.contactRow}>
              <TouchableOpacity style={s.contactBtn} onPress={() => { if (bank.phone) openCall(bank.phone); }}>
                <Text style={[s.contactText, { color: bank.color }]}>{tr('phone')}: {bank.phone}</Text>
              </TouchableOpacity>
            </View>
            {solicitudes.filter(o => o.contract_ref === bank.id).length > 0 && (
              <Text style={s.misSolicitudes}>
                {solicitudes.filter(o => o.contract_ref === bank.id).length} solicitudes tuyas en {bank.name}
              </Text>
            )}
          </View>
          <View style={s.actionGrid}>
            {([
              ['transfer', 'Transferir'], ['bills', tr('xtPagarFactura')], ['loan', 'Préstamos'],
              ['invest', t('svcInvestments')], ['cards', t('cards')], ['requests', t('history')],
            ] as [BkScreen, string][]).map(([id, label]) => (
              <TouchableOpacity key={id} style={s.actionCell} onPress={() => (id === 'requests' ? setScreen(id) : abrirFlujo(bank, id))}>
                <Text style={s.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {screen === 'transfer' && bank && (
        <View>
          {([
            ['local', 'Transferencia Local', tr('xtEntreCuentasDelMismoBanco')],
            ['inter', 'Transferencia Interna', tr('xtEntreBancosDeGuineaEc')],
            ['cemac', 'Transferencia CEMAC', tr('xtCamerunGabonCongo')],
          ] as const).map(([id, label, sub]) => (
            <TouchableOpacity key={id} style={[s.optionRow, form.tt === id && { borderColor: bank.color }]} onPress={() => setF('tt', id)}>
              <Text style={s.optionTitle}>{label}</Text>
              <Text style={s.optionSub}>{sub}</Text>
            </TouchableOpacity>
          ))}
          {form.tt && (
            <View style={s.formCard}>
              <FormField placeholder={tr('xtDestinatarioIBANTelefono')} value={form.recipient || ''} onChangeText={v => setF('recipient', v)} />
              <FormField placeholder="Monto (XAF)" value={form.amount || ''} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
              <Text style={s.note}>Se envía la orden al banco. No se debita tu monedero hasta que el banco la ejecute.</Text>
              <PrimaryButton
                label={sending ? 'Enviando…' : tr('xtConfirmarTransferencia2')}
                color={bank.color}
                disabled={!form.recipient || !(parseInt(form.amount, 10) > 0) || sending}
                onPress={() => enviar('transferencia', {
                  clase: form.tt,
                  destinatario: form.recipient,
                  importe_declarado: parseInt(form.amount, 10),
                })}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'loan' && bank && (
        <View>
          <Text style={s.note}>
            Los importes maximos y el interes son orientativos: EGChat no tiene las condiciones de {bank.name},
            el banco las fija en su estudio. Lo que envias es la solicitud.
          </Text>
          {([
            ['personal', tr('xtPrestamoPersonal'), 'Hasta 5,000,000 XAF', '12% anual'],
            ['negocio', tr('xtPrestamoNegocio'), 'Hasta 50,000,000 XAF', '9% anual'],
          ] as const).map(([id, label, sub, rate]) => (
            <TouchableOpacity key={id} style={[s.optionRow, form.lt === id && { borderColor: '#2E9E6B' }]} onPress={() => setF('lt', id)}>
              <Text style={s.optionTitle}>{label}</Text>
              <Text style={s.optionSub}>{sub} — <Text style={{ color: '#2E9E6B', fontWeight: '600' }}>{rate}</Text></Text>
            </TouchableOpacity>
          ))}
          {form.lt && (
            <View style={s.formCard}>
              <FormField placeholder="Monto solicitado (XAF)" value={form.amount || ''} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
              <FormField placeholder="Plazo en meses (6-60)" value={form.months || ''} onChangeText={v => setF('months', v)} keyboardType="numeric" />
              <Text style={s.note}>El tipo y el plazo los confirma el banco tras estudiar tu expediente.</Text>
              <PrimaryButton
                label={sending ? 'Enviando…' : tr('xtSolicitarPrestamo')}
                color={bank.color}
                disabled={!form.amount || !form.months || sending}
                onPress={() => enviar('prestamo', {
                  clase: form.lt,
                  monto_solicitado: parseInt(form.amount, 10),
                  plazo_meses: parseInt(form.months, 10),
                })}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'bills' && bank && (
        <View>
          {([['Electricidad', 'elec'], ['Agua', 'agua'], ['Internet', 'internet']] as const).map(([label, id]) => (
            <TouchableOpacity key={id} style={[s.optionRow, form.bt === id && { borderColor: '#C47D2A' }]} onPress={() => setF('bt', id)}>
              <Text style={s.optionTitle}>{label}</Text>
            </TouchableOpacity>
          ))}
          {form.bt && (
            <View style={s.formCard}>
              <FormField placeholder={t('svcRefContractUpper')} value={form.ref2 || ''} onChangeText={v => setF('ref2', v)} />
              <FormField placeholder={tr('xtMontoAPagarXAF')} value={form.amount || ''} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
              <Text style={s.note}>
                Es un aviso al banco con el importe que tú declaras. Si quieres pagar ahora desde el
                monedero, usa el módulo de facturas: ahí el cargo sí es real.
              </Text>
              <PrimaryButton
                label={sending ? 'Registrando…' : `${t('svcPayBill')} ${form.amount ? `${parseInt(form.amount, 10).toLocaleString()} XAF` : ''}`}
                color="#C47D2A"
                disabled={!form.ref2 || !(parseInt(form.amount, 10) > 0) || sending}
                onPress={() => enviar('aviso_pago', {
                  proveedor: form.bt,
                  contrato: form.ref2,
                  importe_declarado: parseInt(form.amount, 10),
                })}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'invest' && bank && (
        <View>
          {([
            ['plazo', tr('xtDepositoAPlazo'), '3-24 meses', '+6% anual'],
            ['fondos', tr('xtFondosDeInversion'), 'Cartera diversificada', '+8-12% anual'],
            ['bonos', tr('xtBonosDelEstado'), 'Renta fija CEMAC', '+5% anual'],
          ] as const).map(([id, label, sub, rate]) => (
            <TouchableOpacity key={id} style={[s.optionRow, form.it === id && { borderColor: '#6B5BD6' }]} onPress={() => setF('it', id)}>
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>{label}</Text>
                <Text style={s.optionSub}>{sub}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B5BD6' }}>{rate}</Text>
            </TouchableOpacity>
          ))}
          {form.it && (
            <View style={s.formCard}>
              <FormField placeholder="Monto a invertir (XAF)" value={form.amount || ''} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
              <FormField placeholder="Plazo en meses" value={form.months || ''} onChangeText={v => setF('months', v)} keyboardType="numeric" />
              <Text style={s.note}>La rentabilidad y la apertura de la posición las fija el banco.</Text>
              <PrimaryButton
                label={sending ? 'Registrando…' : 'Registrar intención de inversión'}
                color="#6B5BD6"
                disabled={!form.amount || !form.months || sending}
                onPress={() => enviar('inversion', {
                  producto: form.it,
                  monto: parseInt(form.amount, 10),
                  plazo_meses: parseInt(form.months, 10),
                })}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'cards' && <CardsScreen bank={bank || GQ_BANKS[0]} onCambios={cargarSolicitudes} />}

      {screen === 'requests' && (
        solicitudes.length === 0 ? (
          <Text style={s.note}>Todavía no has registrado ninguna solicitud en ningún banco.</Text>
        ) : solicitudes.map(o => (
          <View key={o.order_ref} style={s.txRow}>
            <View style={[s.txIcon, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E5E7EB' }]}>
              <Text>{o.status === 'completed' ? '✓' : '·'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{TIPO_LABEL[o.service_type] || o.service_type} — {o.payload?.banco || o.contract_ref}</Text>
              <Text style={s.txDate}>{o.order_ref} · {new Date(o.created_at).toLocaleDateString('es')}</Text>
            </View>
            <Text style={[s.txAmt, { color: Number(o.amount) > 0 ? '#DC2626' : '#6B7280' }]}>
              {Number(o.amount) > 0 ? `${Number(o.amount).toLocaleString()} XAF` : 'Sin cobro'}
            </Text>
          </View>
        ))
      )}

      {screen === 'success' && (
        <View style={s.success}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📨</Text>
          <Text style={s.successTitle}>Solicitud registrada</Text>
          <Text style={s.successMsg}>{recibo.msg}</Text>
          <View style={s.refBox}>
            <Text style={s.refLbl}>Referencia</Text>
            <Text style={s.refVal}>{recibo.ref}</Text>
          </View>
          <Text style={s.note}>No se ha cobrado nada todavía. El banco la revisará y te confirmará.</Text>
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: bank?.color || '#1485EE' }]} onPress={() => setScreen(bank ? 'detail' : 'home')}>
            <Text style={s.doneText}>{tr('djhBack')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </FinancialModuleShell>
  );
};

const openCall = (phone: string) => {
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {});
};

const s = StyleSheet.create({
  aviso: { borderRadius: 14, padding: 14 },
  avisoTitle: { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 4 },
  avisoText: { fontSize: 11.5, color: 'rgba(255,255,255,0.85)', lineHeight: 16 },
  bankCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F2F5' },
  bankHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  bankName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  bankMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  verBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#E5E7EB' },
  verText: { fontSize: 11, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 6, padding: 8 },
  quickBtn: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  quickText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12 },
  detailName: { fontSize: 18, fontWeight: '900', color: '#1A2B4A' },
  detailSub: { fontSize: 11, color: '#8A9BB5' },
  detailDesc: { fontSize: 12, color: '#5A7090', lineHeight: 18 },
  contactRow: { marginTop: 10 },
  contactBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 6 },
  contactText: { fontSize: 12, fontWeight: '700' },
  misSolicitudes: { fontSize: 11, color: '#8A9BB5', marginTop: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionCell: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F0F2F5' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  optionRow: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  optionTitle: { fontSize: 13, fontWeight: '700', color: '#1A2B4A' },
  optionSub: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 4 },
  note: { fontSize: 11.5, color: '#8A9BB5', lineHeight: 16, marginBottom: 10 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8 },
  txIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 13, fontWeight: '600', color: '#1A2B4A' },
  txDate: { fontSize: 10, color: '#8A9BB5', marginTop: 2 },
  txAmt: { fontSize: 13, fontWeight: '700' },
  success: { alignItems: 'center', paddingVertical: 40 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A', marginBottom: 8 },
  successMsg: { fontSize: 13, color: '#8A9BB5', textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
  refBox: { backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, alignItems: 'center' },
  refLbl: { fontSize: 10, color: '#9CA3AF' },
  refVal: { fontSize: 13, fontWeight: '800', color: '#1A2B4A', marginTop: 2 },
  doneBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  doneText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
