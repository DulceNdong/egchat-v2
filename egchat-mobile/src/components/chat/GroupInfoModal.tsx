// ══════════════════════════════════════════════════════════════════
// GroupInfoModal — Ficha completa del grupo (normal y djangue)
// Datos: GET /api/chats/:id/info (participantes reales, permisos, cuotas)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, ScrollView,
  TextInput, Share, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { contactsAPI, apiFetch } from '../../api';
import { EGAvatar } from '../ui';
import { toast } from '../Toast';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';
import { useTranslation } from '../../context/LanguageContext';

// ── Textos de la ficha (ES/FR/EN/PT) ───────────────────────────────
type LangCode = 'es' | 'fr' | 'en' | 'pt';
const STR: Record<LangCode, Record<string, string>> = {
  es: {
    grpInfoTitle: 'Info del grupo', grpGroupBadge: 'GRUPO', grpDjangueBadge: 'DJANGUE',
    grpLoading: 'Cargando…', grpLoadError: 'No se pudo cargar la info del grupo', grpRetry: 'Reintentar',
    grpYou: '(tú)', grpCreator: 'Creador', grpAdmin: 'Admin', grpMember: 'Miembro',
    grpOnline: 'en línea', grpParticipants: 'PARTICIPANTES', grpSearchMembers: 'Buscar participantes',
    grpAddMembers: 'Añadir', grpLeave: 'Salir del grupo', grpInvite: 'Enlace',
    grpPanel: 'Panel', grpPayQuota: 'Pagar cuota',
    grpPermissions: 'PERMISOS DEL GRUPO', grpPermSend: 'Enviar mensajes', grpPermEditInfo: 'Editar información',
    grpPermAddMembers: 'Añadir miembros', grpPermInvite: 'Generar enlace de invitación',
    grpOptAll: 'Todos', grpOptAdmins: 'Solo admins',
    grpDescPlaceholder: 'Añadir descripción del grupo', grpNameLabel: 'Nombre del grupo', grpSave: 'Guardar',
    grpBroadcastBanner: 'Solo los administradores pueden escribir en este grupo',
    grpGenerating: 'Generando…', grpTapShare: 'Toca para compartir', grpGenerateShare: 'Generar y compartir',
    grpQuota: 'Cuota del turno', grpCollected: 'Recaudado este turno', grpBeneficiary: 'Recibe este turno',
    grpMyStatus: 'Tu estado', grpPaid: 'Pagado', grpPending: 'Pendiente', grpJustified: 'Justificado',
    grpMyTurn: '¡Es tu turno de recibir!', grpPayMyQuota: 'Pagar mi cuota', grpViewPanel: 'Ver panel del djangue',
    grpTurnOrder: 'Orden de turnos', grpExpectedPot: 'Bote del turno', grpTurn: 'Turno',
    grpMakeAdmin: 'Hacer administrador', grpRemoveAdmin: 'Quitar administrador', grpRemoveMember: 'Expulsar del grupo',
    grpLeaveShort: 'Salir', grpOf: 'de',
    grpAddPeople: 'Añadir participantes', grpNoContacts: 'No hay contactos para añadir',
    grpPhotoUpdated: 'Foto del grupo actualizada', grpPhotoFailed: 'No se pudo actualizar la foto',
    grpSettingsSaved: 'Ajustes guardados', grpSettingsFailed: 'No se pudieron guardar los ajustes',
    grpMemberAdded: 'participante(s) añadidos', grpMemberRemoved: 'Participante expulsado',
    grpActionFailed: 'No se pudo completar la acción', grpLeaveConfirm: '¿Seguro que quieres salir de este grupo?',
    grpCreated: 'Creado el', grpResults: 'resultados',
    grpAudioCall: 'Llamada', grpVideoCall: 'Vídeo', grpMessages: 'Mensajes',
  },
  fr: {
    grpInfoTitle: 'Infos du groupe', grpGroupBadge: 'GROUPE', grpDjangueBadge: 'DJANGUE',
    grpLoading: 'Chargement…', grpLoadError: 'Impossible de charger les infos du groupe', grpRetry: 'Réessayer',
    grpYou: '(vous)', grpCreator: 'Créateur', grpAdmin: 'Admin', grpMember: 'Membre',
    grpOnline: 'en ligne', grpParticipants: 'PARTICIPANTS', grpSearchMembers: 'Rechercher des participants',
    grpAddMembers: 'Ajouter', grpLeave: 'Quitter le groupe', grpInvite: 'Lien',
    grpPanel: 'Panneau', grpPayQuota: 'Payer la cotisation',
    grpPermissions: 'PERMISSIONS DU GROUPE', grpPermSend: 'Envoyer des messages', grpPermEditInfo: 'Modifier les infos',
    grpPermAddMembers: 'Ajouter des membres', grpPermInvite: 'Générer le lien d’invitation',
    grpOptAll: 'Tous', grpOptAdmins: 'Admins only',
    grpDescPlaceholder: 'Ajouter une description', grpNameLabel: 'Nom du groupe', grpSave: 'Enregistrer',
    grpBroadcastBanner: 'Seuls les administrateurs peuvent écrire dans ce groupe',
    grpGenerating: 'Génération…', grpTapShare: 'Appuyer pour partager', grpGenerateShare: 'Générer et partager',
    grpQuota: 'Cotisation du tour', grpCollected: 'Collecté ce tour', grpBeneficiary: 'Reçoit ce tour',
    grpMyStatus: 'Ton statut', grpPaid: 'Payé', grpPending: 'En attente', grpJustified: 'Justifié',
    grpMyTurn: 'C’est ton tour de recevoir !', grpPayMyQuota: 'Payer ma cotisation', grpViewPanel: 'Voir le panneau Djangue',
    grpTurnOrder: 'Ordre des tours', grpExpectedPot: 'Cagnotte du tour', grpTurn: 'Tour',
    grpMakeAdmin: 'Rendre administrateur', grpRemoveAdmin: 'Retirer admin', grpRemoveMember: 'Exclure du groupe',
    grpLeaveShort: 'Quitter', grpOf: 'sur',
    grpAddPeople: 'Ajouter des participants', grpNoContacts: 'Aucun contact à ajouter',
    grpPhotoUpdated: 'Photo du groupe mise à jour', grpPhotoFailed: 'Échec de la mise à jour de la photo',
    grpSettingsSaved: 'Réglages enregistrés', grpSettingsFailed: 'Échec de l’enregistrement',
    grpMemberAdded: 'participant(s) ajouté(s)', grpMemberRemoved: 'Participant exclu',
    grpActionFailed: 'Action impossible', grpLeaveConfirm: 'Quitter ce groupe ?',
    grpCreated: 'Créé le', grpResults: 'résultats',
    grpAudioCall: 'Appel', grpVideoCall: 'Vidéo', grpMessages: 'Messages',
  },
  en: {
    grpInfoTitle: 'Group info', grpGroupBadge: 'GROUP', grpDjangueBadge: 'DJANGUE',
    grpLoading: 'Loading…', grpLoadError: 'Could not load group info', grpRetry: 'Retry',
    grpYou: '(you)', grpCreator: 'Creator', grpAdmin: 'Admin', grpMember: 'Member',
    grpOnline: 'online', grpParticipants: 'PARTICIPANTS', grpSearchMembers: 'Search participants',
    grpAddMembers: 'Add', grpLeave: 'Leave group', grpInvite: 'Link',
    grpPanel: 'Panel', grpPayQuota: 'Pay quota',
    grpPermissions: 'GROUP PERMISSIONS', grpPermSend: 'Send messages', grpPermEditInfo: 'Edit group info',
    grpPermAddMembers: 'Add members', grpPermInvite: 'Generate invite link',
    grpOptAll: 'Everyone', grpOptAdmins: 'Admins only',
    grpDescPlaceholder: 'Add group description', grpNameLabel: 'Group name', grpSave: 'Save',
    grpBroadcastBanner: 'Only admins can write in this group',
    grpGenerating: 'Generating…', grpTapShare: 'Tap to share', grpGenerateShare: 'Generate and share',
    grpQuota: 'Turn quota', grpCollected: 'Collected this turn', grpBeneficiary: 'Receives this turn',
    grpMyStatus: 'Your status', grpPaid: 'Paid', grpPending: 'Pending', grpJustified: 'Justified',
    grpMyTurn: 'It’s your turn to receive!', grpPayMyQuota: 'Pay my quota', grpViewPanel: 'Open djangue panel',
    grpTurnOrder: 'Turn order', grpExpectedPot: 'Turn pot', grpTurn: 'Turn',
    grpMakeAdmin: 'Make admin', grpRemoveAdmin: 'Remove admin', grpRemoveMember: 'Remove from group',
    grpLeaveShort: 'Leave', grpOf: 'of',
    grpAddPeople: 'Add participants', grpNoContacts: 'No contacts to add',
    grpPhotoUpdated: 'Group photo updated', grpPhotoFailed: 'Could not update photo',
    grpSettingsSaved: 'Settings saved', grpSettingsFailed: 'Could not save settings',
    grpMemberAdded: 'participant(s) added', grpMemberRemoved: 'Participant removed',
    grpActionFailed: 'Could not complete the action', grpLeaveConfirm: 'Leave this group?',
    grpCreated: 'Created on', grpResults: 'results',
    grpAudioCall: 'Call', grpVideoCall: 'Video', grpMessages: 'Messages',
  },
  pt: {
    grpInfoTitle: 'Info do grupo', grpGroupBadge: 'GRUPO', grpDjangueBadge: 'DJANGUE',
    grpLoading: 'Carregando…', grpLoadError: 'Não foi possível carregar a info do grupo', grpRetry: 'Tentar de novo',
    grpYou: '(você)', grpCreator: 'Criador', grpAdmin: 'Admin', grpMember: 'Membro',
    grpOnline: 'online', grpParticipants: 'PARTICIPANTES', grpSearchMembers: 'Buscar participantes',
    grpAddMembers: 'Adicionar', grpLeave: 'Sair do grupo', grpInvite: 'Link',
    grpPanel: 'Painel', grpPayQuota: 'Pagar quota',
    grpPermissions: 'PERMISSÕES DO GRUPO', grpPermSend: 'Enviar mensagens', grpPermEditInfo: 'Editar informações',
    grpPermAddMembers: 'Adicionar membros', grpPermInvite: 'Gerar link de convite',
    grpOptAll: 'Todos', grpOptAdmins: 'Só admins',
    grpDescPlaceholder: 'Adicionar descrição do grupo', grpNameLabel: 'Nome do grupo', grpSave: 'Guardar',
    grpBroadcastBanner: 'Só os administradores podem escrever neste grupo',
    grpGenerating: 'Gerando…', grpTapShare: 'Toque para partilhar', grpGenerateShare: 'Gerar e partilhar',
    grpQuota: 'Quota do turno', grpCollected: 'Recolhido este turno', grpBeneficiary: 'Recebe este turno',
    grpMyStatus: 'O teu estado', grpPaid: 'Pago', grpPending: 'Pendente', grpJustified: 'Justificado',
    grpMyTurn: 'É a tua vez de receber!', grpPayMyQuota: 'Pagar a minha quota', grpViewPanel: 'Ver painel do djangue',
    grpTurnOrder: 'Ordem dos turnos', grpExpectedPot: 'Pote do turno', grpTurn: 'Turno',
    grpMakeAdmin: 'Tornar administrador', grpRemoveAdmin: 'Remover admin', grpRemoveMember: 'Expulsar do grupo',
    grpLeaveShort: 'Sair', grpOf: 'de',
    grpAddPeople: 'Adicionar participantes', grpNoContacts: 'Sem contactos para adicionar',
    grpPhotoUpdated: 'Foto do grupo atualizada', grpPhotoFailed: 'Não foi possível atualizar a foto',
    grpSettingsSaved: 'Definições guardadas', grpSettingsFailed: 'Não foi possível guardar',
    grpMemberAdded: 'participante(s) adicionados', grpMemberRemoved: 'Participante expulso',
    grpActionFailed: 'Não foi possível concluir a ação', grpLeaveConfirm: 'Sair deste grupo?',
    grpCreated: 'Criado em', grpResults: 'resultados',
    grpAudioCall: 'Chamada', grpVideoCall: 'Vídeo', grpMessages: 'Mensagens',
  },
};

const LOCALES: Record<LangCode, string> = { es: 'es-ES', fr: 'fr-FR', en: 'en-GB', pt: 'pt-PT' };

// ── Modelo de datos (espejo de GET /api/chats/:id/info) ────────────
type PermScope = 'admins' | 'all';
interface DjMemberState {
  turn_order: number | null;
  paid_current_turn: boolean;
  has_justified: boolean;
  is_current_beneficiary: boolean;
}
interface InfoParticipant {
  user_id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: 'admin' | 'member';
  is_creator: boolean;
  online_status: boolean;
  last_seen: string | null;
  djangue: DjMemberState | null;
}
interface GroupPermissions {
  edit_info: PermScope;
  add_members: PermScope;
  invite_admins_only: boolean;
}
interface DjangueSummary {
  id: string;
  name: string;
  logo_url: string | null;
  quota_amount: number;
  currency: string;
  frequency: string;
  current_turn: number;
  total_turns: number;
  status: string;
  period_end_date: string | null;
  beneficiary: { user_id: string; full_name: string | null; avatar_url: string | null } | null;
  paid_count: number;
  pending_count: number;
  expected_payout: number;
  my: DjMemberState | null;
}
interface GroupInfo {
  id: string;
  type: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string | null;
  broadcast_mode: boolean;
  permissions: GroupPermissions;
  my_role: 'admin' | 'member';
  participants: InfoParticipant[];
  djangue: DjangueSummary | null;
}

const DJ_GRADIENT = ['#312E81', '#6D28D9'] as const;
const GOLD = '#F5B942';

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);

const buzz = () => { try { Haptics.selectionAsync(); } catch { /* sin hápticos */ } };

const fmtAmount = (n: number, currency: string, locale: string): string => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
};

// ── Iconos SVG ─────────────────────────────────────────────────────
const Ico = {
  back: (c = '#fff', s = 22) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1="19" y1="12" x2="5" y2="12" /><Polyline points="12 19 5 12 12 5" />
    </Svg>
  ),
  close: (c = '#fff', s = 22) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.5} strokeLinecap="round">
      <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
  camera: (c = '#fff', s = 16) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  ),
  pencil: (c: string, s = 14) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Svg>
  ),
  check: (c = '#00C8A0', s = 18) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
  userPlus: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Line x1="19" y1="8" x2="19" y2="14" /><Line x1="22" y1="11" x2="16" y2="11" />
    </Svg>
  ),
  link: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Svg>
  ),
  logout: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" /><Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  ),
  megaphone: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m3 11 18-5v12L3 14v-3z" /><Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </Svg>
  ),
  shield: (c: string, s = 18) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  ),
  crown: (c: string, s = 12) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <Path d="M5 20h14v2H5zM17.2 4.6l-2.2 3.2-2.5-3.8a1 1 0 0 0-1 0L8.9 7.8 6.7 4.6c-.6-.8-1.9-.3-1.8.7l1.4 9.7h10.4l1.4-9.7c.1-1-1.2-1.5-1.9-.7z" />
    </Svg>
  ),
  coins: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="8" cy="8" r="6" /><Path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><Path d="M7 6h1v4" /><Path d="m16.71 13.88.7.71-2.82 2.82" />
    </Svg>
  ),
  search: (c: string, s = 16) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="11" cy="11" r="8" /><Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  ),
  card: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><Line x1="1" y1="10" x2="23" y2="10" />
    </Svg>
  ),
  phone: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  video: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M23 7l-7 5 7 5V7z" /><Rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </Svg>
  ),
  message: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  ),
};

interface Props {
  visible: boolean;
  chat: any;
  currentUserId: string;
  onClose: () => void;
  onLeft: () => void;
  onAvatarUpdated?: (url: string) => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
}

export function GroupInfoModal({ visible, chat, currentUserId, onClose, onLeft, onAvatarUpdated, onAudioCall, onVideoCall }: Props) {
  const { t, language } = useTranslation();
  const lang: LangCode = (['es', 'fr', 'en', 'pt'].includes(language) ? language : 'es') as LangCode;
  const tt = useCallback((k: string) => STR[lang][k] || STR.es[k] || k, [lang]);
  const locale = LOCALES[lang];

  const [info, setInfo] = useState<GroupInfo | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadDetail, setLoadDetail] = useState<string | null>(null);

  const [nameDraft, setNameDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const isDjangue = !!info?.djangue;
  const isAdmin = info?.my_role === 'admin';
  const canEdit = !!info && (isAdmin || info.permissions.edit_info === 'all');
  const canAdd = !!info && (isAdmin || info.permissions.add_members === 'all');
  const canInvite = !!info && (!info.permissions.invite_admins_only || isAdmin);

  const loadInfo = useCallback(async () => {
    if (!chat?.id) return;
    setLoadState('loading');
    setLoadDetail(null);
    try {
      const data = await withTimeout(apiFetch<GroupInfo>(`/api/chats/${chat.id}/info`), 25000);
      setInfo(data);
      setLoadState('ready');
    } catch (e: any) {
      const det = [e?.status ? `HTTP ${e.status}` : '', e?.message || ''].filter(Boolean).join(' · ');
      setLoadDetail(det || String(e));
      setLoadState('error');
    }
  }, [chat?.id]);

  useEffect(() => {
    if (visible && chat?.id) {
      setMemberSearch('');
      setInviteLink(null);
      loadInfo();
    }
  }, [visible, chat?.id, loadInfo]);

  // ══ Foto del grupo ══
  const pickAvatar = async () => {
    if (!canEdit || !info) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (r.canceled || !r.assets[0]?.base64) return;
    const asset = r.assets[0];
    setUploadingAvatar(true);
    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const res = await apiFetch<{ avatar_url: string }>(`/api/chats/${chat.id}/avatar`, {
        method: 'POST',
        body: JSON.stringify({ base64: `data:${mimeType};base64,${asset.base64}`, mimeType }),
      });
      const url = res?.avatar_url || `data:${mimeType};base64,${asset.base64}`;
      setInfo(prev => prev ? { ...prev, avatar_url: url } : prev);
      onAvatarUpdated?.(url);
      toast.success(tt('grpPhotoUpdated'));
    } catch (e: any) {
      toast.error(t('error'), e?.message || tt('grpPhotoFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ══ Nombre / descripción ══
  const saveName = async () => {
    const name = nameDraft.trim();
    if (!info || !name || name === info.name) { setEditingName(false); return; }
    const prev = info.name;
    setInfo(i => i ? { ...i, name } : i);
    setEditingName(false);
    try {
      await apiFetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch {
      setInfo(i => i ? { ...i, name: prev } : i);
      toast.error(tt('grpActionFailed'));
    }
  };

  const saveDesc = async () => {
    if (!info) return;
    const description = descDraft.trim();
    const prev = info.description;
    setInfo(i => i ? { ...i, description: description || null } : i);
    setEditingDesc(false);
    if (description === (prev || '')) return;
    try {
      await apiFetch(`/api/chats/${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
    } catch {
      setInfo(i => i ? { ...i, description: prev } : i);
      toast.error(tt('grpActionFailed'));
    }
  };

  // ══ Permisos ══
  const patchSettings = useCallback(async (body: Record<string, unknown>, optimistic: (i: GroupInfo) => GroupInfo) => {
    if (!info) return;
    const prev = info;
    setInfo(optimistic(info));
    try {
      const res = await apiFetch<{ permissions: GroupPermissions; broadcast_mode: boolean }>(
        `/api/chats/${chat.id}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      setInfo(i => i ? { ...i, permissions: res?.permissions || i.permissions, broadcast_mode: res?.broadcast_mode ?? i.broadcast_mode } : i);
      buzz();
    } catch {
      setInfo(prev);
      toast.error(tt('grpSettingsFailed'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, chat?.id]);

  const setSendScope = (scope: PermScope) =>
    patchSettings({ broadcast_mode: scope === 'admins' }, i => ({ ...i, broadcast_mode: scope === 'admins' }));
  const setEditInfoScope = (scope: PermScope) =>
    patchSettings({ edit_info: scope }, i => ({ ...i, permissions: { ...i.permissions, edit_info: scope } }));
  const setAddMembersScope = (scope: PermScope) =>
    patchSettings({ add_members: scope }, i => ({ ...i, permissions: { ...i.permissions, add_members: scope } }));
  const setInviteAdminsOnly = (value: boolean) =>
    patchSettings({ invite_admins_only: value }, i => ({ ...i, permissions: { ...i.permissions, invite_admins_only: value } }));

  // ══ Enlace de invitación ══
  const handleInvite = useCallback(async () => {
    if (!info) return;
    if (inviteLink) {
      Share.share({ message: `${t('chtInvitePrefix')} "${info.name}" ${t('chtInviteSuffix')}\n${inviteLink}` });
      return;
    }
    setGeneratingLink(true);
    try {
      const data = await apiFetch<{ link?: string; invite_link?: string }>(`/api/chats/${chat.id}/invite-link`, { method: 'POST' });
      const link = data?.link || data?.invite_link || `https://egchat.app/join/${chat.id}`;
      setInviteLink(link);
      Share.share({ message: `${t('chtInvitePrefix')} "${info.name}" ${t('chtInviteSuffix')}\n${link}` });
    } catch (e: any) {
      toast.error(t('error'), e?.message || tt('grpActionFailed'));
    } finally {
      setGeneratingLink(false);
    }
  }, [info, inviteLink, chat?.id, t, tt]);

  // ══ Participantes ══
  const openMemberActions = useCallback((member: InfoParticipant) => {
    if (!info) return;
    if (!isAdmin || member.user_id === currentUserId) return;
    const opts: any[] = [];
    if (!member.is_creator) {
      opts.push({
        text: member.role === 'admin' ? tt('grpRemoveAdmin') : tt('grpMakeAdmin'),
        onPress: async () => {
          try {
            await apiFetch(`/api/chats/${chat.id}/participants/${member.user_id}/role`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: member.role === 'admin' ? 'member' : 'admin' }),
            });
            loadInfo();
          } catch { toast.error(tt('grpActionFailed')); }
        },
      });
      opts.push({
        text: tt('grpRemoveMember'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(tt('grpRemoveMember'), member.full_name || member.phone, [
            { text: t('cancel'), style: 'cancel' },
            {
              text: tt('grpRemoveMember'), style: 'destructive',
              onPress: async () => {
                try {
                  await apiFetch(`/api/chats/${chat.id}/participants/${member.user_id}`, { method: 'DELETE' });
                  toast.success(tt('grpMemberRemoved'));
                  loadInfo();
                } catch { toast.error(tt('grpActionFailed')); }
              },
            },
          ]);
        },
      });
    }
    opts.push({ text: t('cancel'), style: 'cancel' });
    Alert.alert(member.full_name || member.phone, undefined, opts);
  }, [info, isAdmin, currentUserId, chat?.id, loadInfo, t, tt]);

  const visibleParticipants = useMemo(() => {
    if (!info) return [];
    const q = memberSearch.trim().toLowerCase();
    if (!q) return info.participants;
    return info.participants.filter(p =>
      (p.full_name || '').toLowerCase().includes(q) || (p.phone || '').includes(q));
  }, [info, memberSearch]);

  // ══ Salir del grupo ══
  const handleLeave = useCallback(() => {
    Alert.alert(tt('grpLeave'), tt('grpLeaveConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: tt('grpLeave'), style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/chats/${chat.id}/leave`, { method: 'POST' });
            onLeft();
          } catch { toast.error(tt('grpActionFailed')); }
        },
      },
    ]);
  }, [chat?.id, onLeft, t, tt]);

  // ══ Añadir miembros (multi-selección) ══
  const openAddModal = useCallback(async () => {
    setShowAdd(true);
    setSelected(new Set());
    try {
      const data = await contactsAPI.getAll();
      const memberIds = new Set((info?.participants || []).map(p => p.user_id));
      setContacts((Array.isArray(data) ? data : []).filter(
        (c: any) => !memberIds.has(String(c.contact_user_id || c.user_id || c.id))
      ));
    } catch { toast.error(t('chtLoadContactsFailed')); }
  }, [info?.participants, t]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    buzz();
  };

  const confirmAdd = useCallback(async () => {
    if (!selected.size) return;
    setAdding(true);
    let ok = 0;
    for (const uid of selected) {
      try {
        await apiFetch(`/api/chats/${chat.id}/participants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: uid }),
        });
        ok++;
      } catch { /* se reporta al final con el recuento de ok */ }
    }
    setAdding(false);
    setShowAdd(false);
    if (ok > 0) {
      toast.success(`${ok} ${tt('grpMemberAdded')}`);
      loadInfo();
    } else {
      toast.error(tt('grpActionFailed'));
    }
  }, [selected, chat?.id, loadInfo, tt]);

  const filteredContacts = contacts.filter(c => {
    if (!addSearch) return true;
    const name = c.full_name || c.users?.full_name || c.phone || '';
    return String(name).toLowerCase().includes(addSearch.toLowerCase());
  });

  // ══ Navegación a pantallas de djangue ══
  const goDjangue = (path: '/djangue-pay' | '/djangue-secretary' | '/djangue-member') => {
    const id = info?.djangue?.id;
    if (!id) return;
    onClose();
    setTimeout(() => router.push({ pathname: path as any, params: { id } } as any), 250);
  };

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────
  const djangue = info?.djangue || null;
  const gradientColors: readonly [string, string] = isDjangue ? DJ_GRADIENT : ['#00C8A0', '#00B4E6'];
  const djTotal = djangue ? Math.max(1, djangue.paid_count + djangue.pending_count + (djangue.beneficiary ? 1 : 0)) : 1;
  const djPct = djangue ? Math.round((djangue.paid_count / djTotal) * 100) : 0;

  // Portada: la propia foto del grupo, desenfocada, con el degradado encima.
  // La foto del grupo se monta sobre el borde inferior de la portada.
  const renderCover = () => {
    if (!info) return null;
    return (
      <View style={s.coverWrap}>
        {!!info.avatar_url && (
          <Image source={{ uri: info.avatar_url }} blurRadius={22} style={StyleSheet.absoluteFillObject} />
        )}
        <LinearGradient
          colors={isDjangue
            ? [`${DJ_GRADIENT[0]}E0`, `${DJ_GRADIENT[1]}F2`]
            : ['rgba(0,200,160,0.88)', 'rgba(0,180,230,0.95)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity
          onPress={pickAvatar}
          disabled={!canEdit || uploadingAvatar}
          activeOpacity={0.85}
          style={s.coverAvatarBtn}
        >
          <View style={s.coverAvatarRing}>
            <EGAvatar src={info.avatar_url} name={info.name || 'EG'} size={88} />
          </View>
          {canEdit && (
            <View style={[s.avatarBadge, isDjangue && { backgroundColor: GOLD }]}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#312E81" />
                : Ico.camera('#312E81', 14)}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderIdentity = () => {
    if (!info) return null;
    const created = info.created_at
      ? new Date(info.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
      : null;
    return (
      <View style={s.identity}>
        {editingName ? (
          <View style={s.editRow}>
            <TextInput
              style={[s.editInput, { color: C.textPrimary, borderColor: C.borderLight }]}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={saveName}
              placeholder={tt('grpNameLabel')}
              placeholderTextColor={C.textTertiary}
            />
            <TouchableOpacity onPress={saveName} style={s.editSaveBtn}>
              {Ico.check(isDjangue ? '#6D28D9' : '#00C8A0', 20)}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.nameRow}
            onPress={() => { if (canEdit) { setNameDraft(info.name || ''); setEditingName(true); } }}
            activeOpacity={canEdit ? 0.7 : 1}
          >
            <Text style={[s.groupName, { color: C.textPrimary }]} numberOfLines={2}>{info.name || '—'}</Text>
            {canEdit && Ico.pencil(C.textTertiary)}
          </TouchableOpacity>
        )}

        {editingDesc ? (
          <View style={s.editRow}>
            <TextInput
              style={[s.editInput, s.descInput, { color: C.textPrimary, borderColor: C.borderLight }]}
              value={descDraft}
              onChangeText={setDescDraft}
              autoFocus
              multiline
              maxLength={140}
              placeholder={tt('grpDescPlaceholder')}
              placeholderTextColor={C.textTertiary}
            />
            <TouchableOpacity onPress={saveDesc} style={s.editSaveBtn}>
              {Ico.check(isDjangue ? '#6D28D9' : '#00C8A0', 20)}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { if (canEdit) { setDescDraft(info.description || ''); setEditingDesc(true); } }}
            activeOpacity={canEdit ? 0.7 : 1}
            style={s.descWrap}
          >
            <Text style={[s.descText, { color: info.description ? C.textTertiary : (canEdit ? (isDjangue ? '#6D28D9' : '#00B4E6') : C.textTertiary) }]}>
              {info.description || (canEdit ? tt('grpDescPlaceholder') : '')}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[s.metaLine, { color: C.textTertiary }]}>
          {info.participants.length} {info.participants.length !== 1 ? t('chtParticipantPlural') : t('chtParticipantSingular')}
          {created ? ` · ${tt('grpCreated')} ${created}` : ''}
        </Text>
      </View>
    );
  };

  // Accesos directos fijos: llamada de voz, videollamada y volver al chat.
  const renderCallBar = () => {
    if (!info) return null;
    const acciones = [
      { key: 'audio', label: tt('grpAudioCall'), icon: Ico.phone('#fff', 19), onPress: () => onAudioCall?.(), relleno: true },
      { key: 'video', label: tt('grpVideoCall'), icon: Ico.video('#fff', 19), onPress: () => onVideoCall?.(), relleno: true },
      { key: 'mensajes', label: tt('grpMessages'), icon: Ico.message(isDjangue ? DJ_GRADIENT[1] : '#00A98B', 19), onPress: onClose, relleno: false },
    ];
    return (
      <View style={s.callRow}>
        {acciones.map(a => (
          <TouchableOpacity key={a.key} style={s.callPill} activeOpacity={0.85} onPress={a.onPress}>
            {a.relleno ? (
              <LinearGradient
                colors={[gradientColors[0], gradientColors[1]]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.callPillInner}
              >
                {a.icon}
                <Text style={s.callPillText}>{a.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[s.callPillInner, { backgroundColor: C.bgSecondary }]}>
                {a.icon}
                <Text style={[s.callPillText, { color: C.textPrimary }]}>{a.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDjangueCard = () => {
    if (!info || !djangue) return null;
    const my = djangue.my;
    const myTurn = !!my?.is_current_beneficiary;
    const myPaid = !!my?.paid_current_turn;
    const myJustified = !!my?.has_justified;
    const quota = fmtAmount(djangue.quota_amount, djangue.currency, locale);
    const pot = fmtAmount(djangue.expected_payout, djangue.currency, locale);
    const ordered = info.participants
      .filter(p => p.djangue && p.djangue.turn_order != null)
      .sort((a, b) => (a.djangue!.turn_order || 0) - (b.djangue!.turn_order || 0));

    return (
      <View style={s.djCardWrap}>
        <LinearGradient colors={[DJ_GRADIENT[0], DJ_GRADIENT[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.djCard}>
          <View style={s.djTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.djLabel}>{tt('grpQuota')}</Text>
              <Text style={s.djQuota}>{quota}</Text>
              <Text style={s.djSub}>{tt('grpTurn')} {djangue.current_turn} {tt('grpOf')} {djangue.total_turns} · {tt('grpExpectedPot')}: {pot}</Text>
            </View>
            <View style={[s.djStatusPill, myTurn ? s.djPillGold : myPaid ? s.djPillGreen : myJustified ? s.djPillAmber : s.djPillRed]}>
              <Text style={s.djStatusText}>
                {myTurn ? tt('grpMyTurn') : myPaid ? `✓ ${tt('grpPaid')}` : myJustified ? tt('grpJustified') : tt('grpPending')}
              </Text>
            </View>
          </View>

          {/* Progreso de cobro del turno */}
          <View style={s.djProgressRow}>
            <View style={s.djProgressTrack}>
              <View style={[s.djProgressFill, { width: `${djPct}%` }]} />
            </View>
            <Text style={s.djProgressText}>{djangue.paid_count}/{djTotal}</Text>
          </View>
          <Text style={s.djProgressLabel}>{tt('grpCollected')}</Text>

          {/* Beneficiario del turno */}
          {djangue.beneficiary && (
            <View style={s.djBenefRow}>
              <EGAvatar src={djangue.beneficiary.avatar_url} name={djangue.beneficiary.full_name || '?'} size={34} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={s.djBenefLabel}>{tt('grpBeneficiary')}</Text>
                <Text style={s.djBenefName}>{djangue.beneficiary.full_name || '—'}</Text>
              </View>
              <View style={s.djBenefAmount}>
                <Text style={s.djBenefAmountText}>{pot}</Text>
              </View>
            </View>
          )}

          {/* Orden de turnos */}
          {ordered.length > 0 && (
            <View>
              <Text style={s.djStripLabel}>{tt('grpTurnOrder')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.djStrip}>
                {ordered.map(p => {
                  const isBenef = !!p.djangue?.is_current_beneficiary;
                  const isMe = p.user_id === currentUserId;
                  return (
                    <View key={p.user_id} style={s.djStripItem}>
                      <View style={[s.djStripRing, isBenef && { borderColor: GOLD }, isMe && !isBenef && { borderColor: '#2DD4BF' }]}>
                        <EGAvatar src={p.avatar_url} name={p.full_name || '?'} size={34} />
                      </View>
                      <Text style={s.djStripNum}>#{p.djangue?.turn_order}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Acciones del djangue */}
          <View style={s.djActionsRow}>
            {!myPaid && !myTurn && (
              <TouchableOpacity style={s.djBtnGold} onPress={() => goDjangue('/djangue-pay')} activeOpacity={0.85}>
                <Text style={s.djBtnGoldText}>{tt('grpPayMyQuota')} · {quota}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.djBtnGhost, myPaid || myTurn ? { flex: 1 } : null]}
              onPress={() => goDjangue(isAdmin ? '/djangue-secretary' : '/djangue-member')}
              activeOpacity={0.85}
            >
              <Text style={s.djBtnGhostText}>{tt('grpViewPanel')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const ScopePicker = ({ value, onChange }: { value: PermScope; onChange: (s: PermScope) => void }) => (
    <View style={[s.scopePicker, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
      {(['all', 'admins'] as PermScope[]).map(scope => {
        const active = value === scope;
        return (
          <TouchableOpacity
            key={scope}
            style={[s.scopeOpt, active && { backgroundColor: isDjangue ? DJ_GRADIENT[1] : '#00C8A0' }]}
            onPress={() => { if (!active) onChange(scope); }}
            activeOpacity={0.8}
          >
            <Text style={[s.scopeOptText, { color: active ? '#fff' : C.textTertiary }]}>
              {scope === 'all' ? tt('grpOptAll') : tt('grpOptAdmins')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderPermissions = () => {
    if (!info || !isAdmin) return null;
    return (
      <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
        <View style={s.cardTitleRow}>
          {Ico.shield(isDjangue ? '#6D28D9' : '#00B4E6', 16)}
          <Text style={[s.cardTitle, { color: C.textTertiary }]}>{tt('grpPermissions')}</Text>
        </View>

        <View style={[s.permRow, { borderColor: C.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[s.permTitle, { color: C.textPrimary }]}>{tt('grpPermSend')}</Text>
            {info.broadcast_mode && <Text style={[s.permHint, { color: C.textTertiary }]}>{tt('grpBroadcastBanner')}</Text>}
          </View>
          <ScopePicker value={info.broadcast_mode ? 'admins' : 'all'} onChange={setSendScope} />
        </View>

        <View style={[s.permRow, { borderColor: C.borderLight }]}>
          <Text style={[s.permTitle, { color: C.textPrimary, flex: 1, paddingRight: 10 }]}>{tt('grpPermEditInfo')}</Text>
          <ScopePicker value={info.permissions.edit_info} onChange={setEditInfoScope} />
        </View>

        <View style={[s.permRow, { borderColor: C.borderLight }]}>
          <Text style={[s.permTitle, { color: C.textPrimary, flex: 1, paddingRight: 10 }]}>{tt('grpPermAddMembers')}</Text>
          <ScopePicker value={info.permissions.add_members} onChange={setAddMembersScope} />
        </View>

        <View style={[s.permRow, { borderColor: C.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[s.permTitle, { color: C.textPrimary }]}>{tt('grpPermInvite')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setInviteAdminsOnly(!info.permissions.invite_admins_only)}
            style={[s.toggle, info.permissions.invite_admins_only && { backgroundColor: isDjangue ? DJ_GRADIENT[1] : '#00B4E6' }]}
            activeOpacity={0.8}
          >
            <View style={[s.toggleThumb, info.permissions.invite_admins_only && s.toggleThumbOn]} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => {
    if (!info) return null;
    const actions: { key: string; icon: React.ReactNode; label: string; onPress: () => void; disabled?: boolean }[] = [];
    if (canAdd) {
      actions.push({
        key: 'add', label: tt('grpAddMembers'),
        icon: Ico.userPlus(isDjangue ? '#6D28D9' : '#00C8A0'),
        onPress: () => { openAddModal(); },
      });
    }
    if (canInvite) {
      actions.push({
        key: 'invite', label: tt('grpInvite'),
        icon: generatingLink
          ? <ActivityIndicator size="small" color={isDjangue ? '#6D28D9' : '#00B4E6'} />
          : Ico.link(isDjangue ? '#6D28D9' : '#00B4E6'),
        onPress: handleInvite, disabled: generatingLink,
      });
    }
    actions.push({
      key: 'leave', label: tt('grpLeaveShort'),
      icon: Ico.logout('#ef4444'),
      onPress: handleLeave,
    });
    return (
      <View style={[s.quickRow, { backgroundColor: C.bgSecondary }]}>
        {actions.map(a => (
          <TouchableOpacity key={a.key} style={s.quickBtn} onPress={a.onPress} disabled={a.disabled} activeOpacity={0.75}>
            <View style={[s.quickCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff' }]}>
              {a.icon}
            </View>
            <Text style={[s.quickLabel, { color: C.textPrimary }]} numberOfLines={1}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const paymentChip = (p: InfoParticipant) => {
    if (!p.djangue) return null;
    const d = p.djangue;
    if (d.is_current_beneficiary) {
      return <View style={[s.chip, { backgroundColor: `${GOLD}26` }]}><Text style={[s.chipText, { color: GOLD }]}>★ {tt('grpBeneficiary')}</Text></View>;
    }
    if (d.paid_current_turn) {
      return <View style={[s.chip, { backgroundColor: '#10B98122' }]}><Text style={[s.chipText, { color: '#10B981' }]}>✓ {tt('grpPaid')}</Text></View>;
    }
    if (d.has_justified) {
      return <View style={[s.chip, { backgroundColor: '#F59E0B22' }]}><Text style={[s.chipText, { color: '#D97706' }]}>{tt('grpJustified')}</Text></View>;
    }
    return <View style={[s.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}><Text style={[s.chipText, { color: C.textTertiary }]}>{tt('grpPending')}</Text></View>;
  };

  const renderParticipants = () => {
    if (!info) return null;
    return (
      <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
        <View style={[s.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[s.cardTitle, { color: C.textTertiary }]}>{tt('grpParticipants')}</Text>
            <View style={[s.countPill, { backgroundColor: isDjangue ? `${DJ_GRADIENT[1]}22` : '#00C8A022' }]}>
              <Text style={[s.countPillText, { color: isDjangue ? DJ_GRADIENT[1] : '#00C8A0' }]}>{info.participants.length}</Text>
            </View>
          </View>
        </View>

        <View style={[s.memberSearch, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
          {Ico.search(C.textTertiary, 15)}
          <TextInput
            style={[s.memberSearchInput, { color: C.textPrimary }]}
            placeholder={tt('grpSearchMembers')}
            placeholderTextColor={C.textTertiary}
            value={memberSearch}
            onChangeText={setMemberSearch}
          />
        </View>

        {visibleParticipants.map(p => {
          const isMe = p.user_id === currentUserId;
          return (
            <TouchableOpacity
              key={p.user_id}
              style={[s.memberRow, { borderColor: C.borderLight }]}
              onPress={() => openMemberActions(p)}
              onLongPress={() => openMemberActions(p)}
              activeOpacity={isAdmin && !isMe ? 0.7 : 1}
            >
              <View>
                <EGAvatar src={p.avatar_url} name={p.full_name || p.phone || '?'} size={46} />
                {p.online_status && <View style={s.onlineDot} />}
              </View>
              <View style={s.memberBody}>
                <View style={s.memberTopRow}>
                  <Text style={[s.memberName, { color: C.textPrimary }]} numberOfLines={1}>
                    {p.full_name || p.phone || tt('grpMember')}
                    {isMe ? ` ${tt('grpYou')}` : ''}
                  </Text>
                  {p.is_creator ? (
                    <View style={[s.roleBadge, { backgroundColor: `${GOLD}26` }]}>
                      {Ico.crown(GOLD, 11)}
                      <Text style={[s.roleBadgeText, { color: GOLD }]}>{tt('grpCreator')}</Text>
                    </View>
                  ) : p.role === 'admin' ? (
                    <View style={[s.roleBadge, { backgroundColor: isDjangue ? `${DJ_GRADIENT[1]}22` : '#00C8A022' }]}>
                      <Text style={[s.roleBadgeText, { color: isDjangue ? DJ_GRADIENT[1] : '#00C8A0' }]}>{tt('grpAdmin')}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={s.memberBottomRow}>
                  {p.djangue?.turn_order != null && (
                    <Text style={[s.turnNum, { color: C.textTertiary }]}>#{p.djangue.turn_order}</Text>
                  )}
                  {p.online_status && <Text style={[s.onlineText, { color: '#10B981' }]}>{tt('grpOnline')}</Text>}
                  {!p.online_status && p.last_seen && (
                    <Text style={[s.onlineText, { color: C.textTertiary }]}>
                      {new Date(p.last_seen).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </View>
              </View>
              {paymentChip(p)}
            </TouchableOpacity>
          );
        })}
        {visibleParticipants.length === 0 && (
          <Text style={[s.emptyText, { color: C.textTertiary }]}>{tt('grpNoContacts')}</Text>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>

        {/* Header */}
        <LinearGradient colors={[gradientColors[0], gradientColors[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn} accessibilityLabel="back">
            {Ico.back()}
          </TouchableOpacity>
          <Text style={s.headerTitle}>{tt('grpInfoTitle')}</Text>
          <View style={[s.typeBadge, isDjangue ? { backgroundColor: GOLD } : { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <Text style={[s.typeBadgeText, isDjangue && { color: '#312E81' }]}>
              {isDjangue ? tt('grpDjangueBadge') : tt('grpGroupBadge')}
            </Text>
          </View>
        </LinearGradient>

        {loadState === 'loading' && (
          <View style={s.centerState}>
            <ActivityIndicator size="large" color={isDjangue ? DJ_GRADIENT[1] : Colors.accent} />
            <Text style={[s.stateText, { color: C.textTertiary }]}>{tt('grpLoading')}</Text>
          </View>
        )}

        {loadState === 'error' && (
          <View style={s.centerState}>
            <Text style={[s.stateText, { color: C.textPrimary }]}>{tt('grpLoadError')}</Text>
            {!!loadDetail && (
              <Text style={[s.stateText, { color: C.textTertiary, fontSize: 12, marginTop: 6 }]}>
                {loadDetail}
              </Text>
            )}
            <TouchableOpacity style={[s.retryBtn, { backgroundColor: isDjangue ? DJ_GRADIENT[1] : '#00C8A0' }]} onPress={loadInfo}>
              <Text style={s.retryBtnText}>{tt('grpRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loadState === 'ready' && info && (
          <View style={s.fixedTop}>
            {renderCover()}
            {renderIdentity()}
            {renderCallBar()}
          </View>
        )}

        {loadState === 'ready' && info && (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
            {!isAdmin && info.broadcast_mode && (
              <View style={[s.broadcastBanner, { backgroundColor: isDjangue ? `${DJ_GRADIENT[1]}14` : '#F59E0B14' }]}>
                {Ico.megaphone(isDjangue ? DJ_GRADIENT[1] : '#D97706', 16)}
                <Text style={[s.broadcastText, { color: isDjangue ? DJ_GRADIENT[1] : '#D97706' }]}>{tt('grpBroadcastBanner')}</Text>
              </View>
            )}
            {renderDjangueCard()}
            {renderQuickActions()}
            {renderPermissions()}
            {renderParticipants()}

            {/* Salir (fila destructiva inferior, estilo WhatsApp) */}
            <TouchableOpacity
              style={[s.leaveRow, { backgroundColor: C.bgSecondary }]}
              onPress={handleLeave}
              activeOpacity={0.8}
            >
              {Ico.logout('#ef4444', 18)}
              <Text style={s.leaveText}>{tt('grpLeave')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Panel añadir participantes (capa dentro del mismo modal: evita
          modales anidados, que en iOS no siempre se presentan) */}
      {showAdd && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bgPrimary, paddingTop: insets.top, zIndex: 20 }]}>
          <LinearGradient colors={[gradientColors[0], gradientColors[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.header}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={s.headerBtn} accessibilityLabel="close">
              {Ico.close()}
            </TouchableOpacity>
            <Text style={s.headerTitle}>{tt('grpAddPeople')}</Text>
            <TouchableOpacity
              onPress={confirmAdd}
              disabled={selected.size === 0 || adding}
              style={[s.addConfirmBtn, (selected.size === 0 || adding) && { opacity: 0.45 }]}
            >
              {adding
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.addConfirmText}>{tt('grpAddMembers')}{selected.size > 0 ? ` (${selected.size})` : ''}</Text>}
            </TouchableOpacity>
          </LinearGradient>

          <View style={[s.memberSearch, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', marginHorizontal: 12, marginTop: 10 }]}>
            {Ico.search(C.textTertiary, 15)}
            <TextInput
              style={[s.memberSearchInput, { color: C.textPrimary }]}
              placeholder={t('chtSearchDots')}
              placeholderTextColor={C.textTertiary}
              value={addSearch}
              onChangeText={setAddSearch}
            />
          </View>

          <FlatList
            data={filteredContacts}
            keyExtractor={c => String(c.contact_user_id || c.user_id || c.id)}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => {
              const id = String(item.contact_user_id || item.user_id || item.id);
              const name = item.full_name || item.users?.full_name || item.phone || tt('grpMember');
              const avatar = item.avatar_url || item.users?.avatar_url;
              const isSel = selected.has(id);
              return (
                <TouchableOpacity style={[s.memberRow, { borderColor: C.borderLight, paddingHorizontal: 14 }]} onPress={() => toggleSelect(id)} activeOpacity={0.75}>
                  <EGAvatar src={avatar} name={name} size={44} />
                  <Text style={[s.memberName, { color: C.textPrimary, flex: 1, marginLeft: 12 }]} numberOfLines={1}>{name}</Text>
                  <View style={[s.selectCircle, isSel && { backgroundColor: isDjangue ? DJ_GRADIENT[1] : '#00C8A0', borderColor: isDjangue ? DJ_GRADIENT[1] : '#00C8A0' }]}>
                    {isSel && Ico.check('#fff', 13)}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={[s.emptyText, { color: C.textTertiary }]}>{tt('grpNoContacts')}</Text>}
          />
        </View>
      )}
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, paddingBottom: 14, paddingTop: 10, gap: 6,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff', marginLeft: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#fff' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 26, paddingVertical: 11, borderRadius: 22 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Cabecera fija: portada + identidad + accesos directos
  fixedTop: { backgroundColor: 'transparent' },
  coverWrap: {
    height: 96,
    marginTop: -14, // se une a la barra de título (mismo degradado)
  },
  coverAvatarBtn: {
    position: 'absolute', alignSelf: 'center', bottom: -44,
    width: 88, height: 88,
  },
  coverAvatarRing: {
    width: 88, height: 88, borderRadius: 44, overflow: 'hidden',
    borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff',
  },
  identity: { alignItems: 'center', paddingTop: 52, paddingHorizontal: 20 },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  groupName: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, paddingHorizontal: 12, width: '100%', justifyContent: 'center' },
  editInput: { flex: 1, maxWidth: 320, fontSize: 17, fontWeight: '600', borderBottomWidth: 1.5, paddingBottom: 4, textAlign: 'center' },
  descInput: { fontSize: 14, fontWeight: '400', minHeight: 34, textAlign: 'center' },
  editSaveBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  descWrap: { marginTop: 6, paddingHorizontal: 32 },
  descText: { fontSize: 13.5, textAlign: 'center', lineHeight: 19 },
  metaLine: { fontSize: 12.5, marginTop: 10 },

  // Accesos directos (fijos bajo la identidad)
  callRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  callPill: { flex: 1 },
  callPillInner: {
    height: 44, borderRadius: 22, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  callPillText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Banner broadcast
  broadcastBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginBottom: 4, borderRadius: 12, padding: 10,
  },
  broadcastText: { fontSize: 12.5, fontWeight: '600', flex: 1 },

  // Tarjeta djangue
  djCardWrap: { paddingHorizontal: 14, marginBottom: 12 },
  djCard: { borderRadius: 22, padding: 18 },
  djTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  djLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', letterSpacing: 0.4 },
  djQuota: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 2 },
  djSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  djStatusPill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, maxWidth: 150 },
  djPillGold: { backgroundColor: GOLD },
  djPillGreen: { backgroundColor: '#10B981' },
  djPillAmber: { backgroundColor: '#F59E0B' },
  djPillRed: { backgroundColor: 'rgba(255,255,255,0.16)' },
  djStatusText: { fontSize: 11.5, fontWeight: '800', color: '#fff', textAlign: 'center' },
  djProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  djProgressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  djProgressFill: { height: 8, borderRadius: 4, backgroundColor: GOLD },
  djProgressText: { fontSize: 12.5, fontWeight: '800', color: '#fff' },
  djProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 5 },
  djBenefRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
    padding: 10, marginTop: 14,
  },
  djBenefLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  djBenefName: { fontSize: 14.5, fontWeight: '700', color: '#fff', marginTop: 1 },
  djBenefAmount: { backgroundColor: GOLD, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  djBenefAmountText: { fontSize: 12.5, fontWeight: '800', color: '#312E81' },
  djStripLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 14, marginBottom: 8 },
  djStrip: { gap: 12, paddingRight: 8 },
  djStripItem: { alignItems: 'center', gap: 4 },
  djStripRing: { borderWidth: 2, borderColor: 'transparent', borderRadius: 20, padding: 1 },
  djStripNum: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  djActionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  djBtnGold: {
    flex: 1, backgroundColor: GOLD, borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
  },
  djBtnGoldText: { fontSize: 14, fontWeight: '800', color: '#312E81' },
  djBtnGhost: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  djBtnGhostText: { fontSize: 13.5, fontWeight: '700', color: '#fff' },

  // Acciones rápidas
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginHorizontal: 14, borderRadius: 18, paddingVertical: 14, marginBottom: 12,
  },
  quickBtn: { alignItems: 'center', gap: 7, minWidth: 72 },
  quickCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  quickLabel: { fontSize: 11.5, fontWeight: '600' },

  // Tarjetas
  card: { marginHorizontal: 14, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  countPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countPillText: { fontSize: 11, fontWeight: '800' },

  // Permisos
  permRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  permTitle: { fontSize: 14.5, fontWeight: '600' },
  permHint: { fontSize: 11.5, marginTop: 2 },
  scopePicker: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  scopeOpt: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 9 },
  scopeOptText: { fontSize: 12, fontWeight: '700' },
  toggle: { width: 46, height: 27, borderRadius: 14, backgroundColor: '#CBD5E1', justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Participantes
  memberSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 6,
  },
  memberSearchInput: { flex: 1, fontSize: 14, padding: 0 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth,
  },
  memberBody: { flex: 1, gap: 2 },
  memberTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  memberBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  turnNum: { fontSize: 11.5, fontWeight: '700' },
  onlineText: { fontSize: 11.5 },
  onlineDot: {
    position: 'absolute', right: 0, bottom: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff',
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  roleBadgeText: { fontSize: 10.5, fontWeight: '800' },
  chip: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 6 },
  chipText: { fontSize: 10.5, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14 },
  selectCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  addConfirmBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 4,
  },
  addConfirmText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },

  // Salir
  leaveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 14, borderRadius: 18, paddingVertical: 15,
  },
  leaveText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});
