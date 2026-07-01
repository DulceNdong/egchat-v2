// Módulo Bancos — paridad ServiciosModules.tsx web
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GQ_BANKS, GQBank } from '../../data/serviciosFinancieros';
import { FinancialModuleShell, SummaryCard, BankLogo } from './FinancialModuleUI';
import { FormField, PrimaryButton } from './ServiceModuleUI';
import { CardsScreen } from './CardsScreen';

type BkScreen = 'home' | 'detail' | 'transfer' | 'loan' | 'bills' | 'invest' | 'cards' | 'history' | 'success';

interface Props {
  visible: boolean;
  onClose: () => void;
  initScreen?: 'home' | 'cards';
  userBalance?: number;
}

export const BancosModal: React.FC<Props> = ({ visible, onClose, initScreen = 'home', userBalance = 100000 }) => {
  const [screen, setScreen] = useState<BkScreen>(initScreen);
  const [bank, setBank] = useState<GQBank | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [balance, setBalance] = useState(userBalance);
  const [refreshKey, setRefreshKey] = useState(0);
  const [txHistory, setTxHistory] = useState([
    { type: 'in', desc: 'Depósito salario', amount: 150000, date: '01/03/2026' },
    { type: 'out', desc: 'Transferencia a María', amount: 25000, date: '05/03/2026' },
    { type: 'out', desc: 'Pago electricidad', amount: 8500, date: '10/03/2026' },
  ]);

  const banks = useMemo(() => GQ_BANKS.map(b => ({ ...b, accounts: b.accounts.map(a => ({ ...a })) })), [refreshKey]);
  const totalBalance = banks.flatMap(b => b.accounts).reduce((s, a) => s + a.balance, 0);
  const accountsCount = banks.filter(b => b.accounts.length > 0).length;

  useEffect(() => { if (visible) { setScreen(initScreen); setBalance(userBalance); } }, [visible, initScreen, userBalance]);
  useEffect(() => { if (!visible) { setScreen('home'); setBank(null); setForm({}); } }, [visible]);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const grad = bank ? [bank.color, bank.color2] as [string, string] : ['#1485EE', '#0052CC'] as [string, string];

  const back = () => {
    if (screen === 'home' || (screen === 'cards' && !bank)) onClose();
    else if (screen === 'detail') setScreen('home');
    else if (screen === 'cards' && bank) setScreen('detail');
    else setScreen(bank ? 'detail' : 'home');
  };

  const titles: Record<BkScreen, string> = {
    home: 'Bancos', detail: bank?.name || '', transfer: 'Transferencia',
    loan: 'Préstamos', bills: 'Pagar Factura', invest: 'Inversiones',
    cards: bank ? `Tarjetas — ${bank.name}` : 'Mis Tarjetas', history: 'Historial', success: 'Completado',
  };

  const ok = (m: string, txDesc?: string, txAmount?: number, txType?: string) => {
    if (txDesc && txAmount) {
      setTxHistory(p => [{ type: txType || 'out', desc: txDesc, amount: txAmount, date: new Date().toLocaleDateString('es') }, ...p]);
      if (txType === 'out') setBalance(b => b - txAmount);
    }
    setMsg(m); setScreen('success'); setForm({});
  };

  const fixedTop = screen === 'home' ? (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <SummaryCard
        label="Saldo total"
        amount={totalBalance}
        colors={['#4A90D9', '#2563EB']}
        stats={[
          { v: accountsCount, l: 'Cuentas' },
          { v: GQ_BANKS.length, l: 'Bancos' },
          { v: accountsCount, l: 'Tarjetas' },
        ]}
      />
    </View>
  ) : undefined;

  return (
    <FinancialModuleShell
      visible={visible}
      title={titles[screen]}
      subtitle={screen === 'home' ? `Guinea Ecuatorial — ${GQ_BANKS.length} bancos` : screen === 'detail' && bank ? bank.full : undefined}
      onBack={back}
      onClose={onClose}
      fixedTop={fixedTop}
      onRefresh={screen === 'home' ? () => setRefreshKey(k => k + 1) : undefined}
    >
      {screen === 'home' && banks.map(b => (
        <View key={b.id} style={s.bankCard}>
          <View style={[s.bankHeader, { backgroundColor: b.color + '10' }]}>
            <BankLogo bank={b} size={38} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.bankName}>{b.name}</Text>
              <Text style={s.bankMeta}>{b.branches} sucursales — {b.atms} ATMs</Text>
            </View>
            <TouchableOpacity style={[s.verBtn, { backgroundColor: b.color + '15' }]} onPress={() => { setBank(b); setScreen('detail'); }}>
              <Text style={[s.verText, { color: b.color }]}>Ver</Text>
            </TouchableOpacity>
          </View>
          {b.accounts.length > 0 ? (
            <View style={s.accountsWrap}>
              {b.accounts.map((acc, i) => (
                <View key={i} style={s.accRow}>
                  <View style={[s.accIcon, { backgroundColor: b.color + '12' }]}>
                    <Text style={{ fontSize: 14 }}>{acc.type.includes('Ahorro') ? '💰' : '💳'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.accType}>{acc.type}</Text>
                    <Text style={s.accNum}>{acc.number}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.accBal}>{acc.balance.toLocaleString()}</Text>
                    <Text style={s.accCur}>XAF</Text>
                  </View>
                </View>
              ))}
              <View style={[s.accRow, s.cardRow, { borderColor: b.color + '25' }]}>
                <View style={[s.accIcon, { backgroundColor: b.color + '12' }]}><Text>💳</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.accType}>Tarjeta de Débito</Text>
                  <Text style={s.accNum}>**** 4521 — Vence 12/28</Text>
                </View>
                <View style={[s.activeBadge, { backgroundColor: b.color + '12' }]}>
                  <Text style={[s.activeText, { color: b.color }]}>Activa</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={s.noAcc}>
              <Text style={s.noAccText}>Sin cuentas activas</Text>
              <TouchableOpacity style={[s.verBtn, { backgroundColor: b.color + '12' }]} onPress={() => { setBank(b); setScreen('detail'); }}>
                <Text style={[s.verText, { color: b.color }]}>+ Abrir cuenta</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={s.quickActions}>
            {([['Transferir', 'transfer'], ['Pagar', 'bills'], ['Préstamo', 'loan'], ['Invertir', 'invest']] as const).map(([label, sc]) => (
              <TouchableOpacity key={sc} style={s.quickBtn} onPress={() => { setBank(b); setScreen(sc); }}>
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
          </View>
          {bank.accounts.map((a, i) => (
            <LinearGradient key={i} colors={grad} style={s.accGradient}>
              <Text style={s.accGradSub}>{a.type} — {a.number}</Text>
              <Text style={s.accGradAmt}>{a.balance.toLocaleString()} <Text style={s.accGradCur}>XAF</Text></Text>
            </LinearGradient>
          ))}
          <View style={s.actionGrid}>
            {([
              ['transfer', 'Transferir'], ['bills', 'Pagar Factura'], ['loan', 'Préstamos'],
              ['invest', 'Inversiones'], ['cards', 'Tarjetas'], ['history', 'Historial'],
            ] as [BkScreen, string][]).map(([id, label]) => (
              <TouchableOpacity key={id} style={s.actionCell} onPress={() => setScreen(id)}>
                <Text style={s.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {screen === 'transfer' && bank && (
        <View>
          {([
            ['local', 'Transferencia Local', 'Entre cuentas del mismo banco'],
            ['inter', 'Transferencia Interna', 'Entre bancos de Guinea Ec.'],
            ['cemac', 'Transferencia CEMAC', 'Camerún, Gabón, Congo...'],
          ] as const).map(([id, label, sub]) => (
            <TouchableOpacity key={id} style={[s.optionRow, form.tt === id && { borderColor: bank.color }]} onPress={() => setF('tt', id)}>
              <Text style={s.optionTitle}>{label}</Text>
              <Text style={s.optionSub}>{sub}</Text>
            </TouchableOpacity>
          ))}
          {form.tt && (
            <View style={s.formCard}>
              <FormField placeholder="Destinatario / IBAN / Teléfono" value={form.recipient || ''} onChangeText={v => setF('recipient', v)} />
              <FormField placeholder="Monto (XAF)" value={form.amount || ''} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
              <Text style={s.balHint}>Saldo disponible: {balance.toLocaleString()} XAF</Text>
              <PrimaryButton
                label="Confirmar transferencia"
                color={bank.color}
                disabled={!form.recipient || !form.amount}
                onPress={() => {
                  const amt = parseInt(form.amount, 10);
                  if (amt) ok(`Transferencia de ${amt.toLocaleString()} XAF completada.`, `Transferencia a ${form.recipient}`, amt, 'out');
                }}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'loan' && bank && (
        <View>
          {([
            ['personal', 'Préstamo Personal', 'Hasta 5,000,000 XAF', '12% anual'],
            ['negocio', 'Préstamo Negocio', 'Hasta 50,000,000 XAF', '9% anual'],
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
              <PrimaryButton
                label="Solicitar préstamo"
                color={bank.color}
                disabled={!form.amount || !form.months}
                onPress={() => ok(`Solicitud de préstamo por ${parseInt(form.amount, 10).toLocaleString()} XAF enviada a ${bank.name}.`)}
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
              <FormField placeholder="Número de referencia / Contrato" value={form.ref || ''} onChangeText={v => setF('ref', v)} />
              <FormField placeholder="Monto a pagar (XAF)" value={form.amount || ''} onChangeText={v => setF('amount', v)} keyboardType="numeric" />
              <PrimaryButton
                label="Pagar factura"
                color="#C47D2A"
                disabled={!form.ref || !form.amount}
                onPress={() => {
                  const amt = parseInt(form.amount, 10);
                  if (amt) ok(`Pago de factura por ${amt.toLocaleString()} XAF completado.`, `Pago ref.${form.ref}`, amt, 'out');
                }}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'invest' && bank && (
        <View>
          {([
            ['plazo', 'Depósito a Plazo', '3-24 meses', '+6% anual'],
            ['fondos', 'Fondos de Inversión', 'Cartera diversificada', '+8-12% anual'],
            ['bonos', 'Bonos del Estado', 'Renta fija CEMAC', '+5% anual'],
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
              <PrimaryButton
                label="Invertir ahora"
                color="#6B5BD6"
                disabled={!form.amount || !form.months}
                onPress={() => ok(`Inversión de ${parseInt(form.amount, 10).toLocaleString()} XAF registrada en ${bank.name}.`)}
              />
            </View>
          )}
        </View>
      )}

      {screen === 'cards' && <CardsScreen bank={bank || GQ_BANKS[0]} />}

      {screen === 'history' && bank && (
        txHistory.map((h, i) => (
          <View key={i} style={s.txRow}>
            <View style={[s.txIcon, { backgroundColor: h.type === 'in' ? '#F0FDF4' : '#FFF1F2' }]}>
              <Text>{h.type === 'in' ? '↓' : '↑'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txDesc}>{h.desc}</Text>
              <Text style={s.txDate}>{h.date}</Text>
            </View>
            <Text style={[s.txAmt, { color: h.type === 'in' ? '#16A34A' : '#DC2626' }]}>
              {h.type === 'in' ? '+' : '-'}{h.amount.toLocaleString()} XAF
            </Text>
          </View>
        ))
      )}

      {screen === 'success' && (
        <View style={s.success}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
          <Text style={s.successTitle}>Operación completada</Text>
          <Text style={s.successMsg}>{msg}</Text>
          <TouchableOpacity style={[s.doneBtn, { backgroundColor: bank?.color || '#1485EE' }]} onPress={() => setScreen(bank ? 'detail' : 'home')}>
            <Text style={s.doneText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </FinancialModuleShell>
  );
};

const s = StyleSheet.create({
  bankCard: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F2F5' },
  bankHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  bankName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  bankMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  verBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  verText: { fontSize: 11, fontWeight: '700' },
  accountsWrap: { padding: 10 },
  accRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 9, marginBottom: 6 },
  cardRow: { borderWidth: 1, borderStyle: 'dashed' },
  accIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  accType: { fontSize: 12, fontWeight: '600', color: '#374151' },
  accNum: { fontSize: 10, color: '#9CA3AF' },
  accBal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  accCur: { fontSize: 10, color: '#9CA3AF' },
  activeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  activeText: { fontSize: 10, fontWeight: '600' },
  noAcc: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  noAccText: { fontSize: 12, color: '#9CA3AF' },
  quickActions: { flexDirection: 'row', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: '#F0F2F5' },
  quickBtn: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  quickText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12 },
  detailName: { fontSize: 18, fontWeight: '900', color: '#1A2B4A' },
  detailSub: { fontSize: 11, color: '#8A9BB5' },
  detailDesc: { fontSize: 12, color: '#5A7090', lineHeight: 18 },
  accGradient: { borderRadius: 14, padding: 16, marginBottom: 8 },
  accGradSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  accGradAmt: { fontSize: 26, fontWeight: '900', color: '#fff' },
  accGradCur: { fontSize: 13, opacity: 0.8 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionCell: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F0F2F5' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  optionRow: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  optionTitle: { fontSize: 13, fontWeight: '700', color: '#1A2B4A' },
  optionSub: { fontSize: 11, color: '#8A9BB5', marginTop: 2 },
  formCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 4 },
  balHint: { fontSize: 12, color: '#8A9BB5', marginBottom: 8 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8 },
  txIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc: { fontSize: 13, fontWeight: '600', color: '#1A2B4A' },
  txDate: { fontSize: 11, color: '#8A9BB5' },
  txAmt: { fontSize: 14, fontWeight: '700' },
  success: { alignItems: 'center', paddingVertical: 40 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A2B4A', marginBottom: 8 },
  successMsg: { fontSize: 13, color: '#8A9BB5', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  doneBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  doneText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
