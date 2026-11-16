// ══════════════════════════════════════════════════════════════════
// GroupInfoModal — Ficha completa del grupo (normal y djangue)
// Datos: GET /api/chats/:id/info (participantes reales, permisos, cuotas)
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, ScrollView,
  TextInput, Share, Image, useWindowDimensions, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Polyline, Circle, Rect } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { contactsAPI, apiFetch } from '../../api';
import { getFavoriteGroupIds, toggleFavoriteGroup } from '../../utils/favorites';
import { DEFAULT_LABELS, getChatLabels, toggleChatLabel } from '../../services/chatLabels';
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
    grpCover: 'Portada', grpCoverHint: 'Elige cómo cambiar la portada del grupo',
    grpCoverCamera: 'Hacer una foto', grpCoverGallery: 'Elegir de la galería',
    grpCoverRemove: 'Quitar portada', grpCoverEdit: 'Cambiar portada',
    grpCoverUpdated: 'Portada actualizada', grpCoverFailed: 'No se pudo cambiar la portada',
    grpGroupSettings: 'AJUSTES DEL GRUPO',
    grpOrganize: 'ORGANIZAR', grpConversation: 'CONVERSACIÓN', grpDanger: 'PELIGRO Y SALIDA',
    grpFav: 'Favoritos', grpFavOn: 'Fijado arriba en tu lista', grpFavOff: 'Fijar arriba en tu lista',
    grpLabels: 'Etiquetas', grpLabelsNone: 'Sin etiquetas', grpLabelsN: 'etiqueta(s)',
    grpLabelsHint: 'Elige cómo quieres encontrar este grupo',
    grpSearchMsgs: 'Buscar mensajes', grpSearchMsgsSub: 'Encuentra algo dentro del grupo',
    grpStarred: 'Mensajes destacados', grpStarredSub: 'Lo que guardaste para volver',
    grpMedia: 'Multimedia y archivos', grpMediaSub: 'Fotos, vídeos y documentos',
    grpMute: 'Silenciar avisos', grpUnmute: 'Reactivar avisos',
    grpMuteSubOn: 'No sonará hasta que lo reactives', grpMuteSubOff: 'Recibirás cada mensaje',
    grpExport: 'Exportar conversación', grpExportSub: 'Comparte una copia en texto',
    grpClear: 'Vaciar conversación', grpClearSub: 'Borra los mensajes de este dispositivo',
    grpClearConfirm: 'Se borrarán los mensajes guardados en este dispositivo. El grupo y los demás miembros no cambian.',
    grpCleared: 'Conversación vaciada',
    grpLeaveSub: 'Dejarás de recibir sus mensajes',
    grpDelete: 'Eliminar grupo para siempre', grpDeleteSub: 'Se eliminará para todos los participantes',
    grpDeleteConfirm: 'El grupo y sus mensajes se eliminarán para todos. Esta acción no se puede deshacer.',
    grpDjDeleteConfirm: 'Se eliminará el grupo y su conversación. Los pagos y el historial financiero se conservarán.',
    grpDjDeleteBlocked: 'Solo se puede eliminar al terminar el ciclo y liquidar las deudas.',
    grpDjExitSub: 'Consulta y liquida lo que debes antes de salir', grpDjDecision: 'Continuar o salir',
    grpDjCompleted: 'Ciclo completado',
    grpReport: 'Reportar grupo', grpReportSub: 'Avisar al equipo de EGCHAT',
    grpReportDone: 'Ya reportaste este grupo',
    grpReportTitle: 'Reportar grupo', grpReportHint: 'Solo lo verá el equipo de EGCHAT.',
    grpReportSpam: 'Spam o publicidad', grpReportBad: 'Contenido inapropiado',
    grpReportScam: 'Estafa o fraude', grpReportOther: 'Otro motivo',
    grpReportSend: 'Enviar reporte', grpReportSent: 'Reporte enviado. Gracias por cuidar EGCHAT.',
    grpReportFailed: 'No se pudo enviar el reporte',
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
    grpCover: 'Couverture', grpCoverHint: 'Choisis comment changer la couverture du groupe',
    grpCoverCamera: 'Prendre une photo', grpCoverGallery: 'Choisir dans la galerie',
    grpCoverRemove: 'Retirer la couverture', grpCoverEdit: 'Changer la couverture',
    grpCoverUpdated: 'Couverture mise à jour', grpCoverFailed: 'Impossible de changer la couverture',
    grpGroupSettings: 'RÉGLAGES DU GROUPE',
    grpOrganize: 'ORGANISER', grpConversation: 'CONVERSATION', grpDanger: 'DANGER ET SORTIE',
    grpFav: 'Favoris', grpFavOn: 'Épinglé en haut de ta liste', grpFavOff: 'Épingler en haut de ta liste',
    grpLabels: 'Étiquettes', grpLabelsNone: 'Aucune étiquette', grpLabelsN: 'étiquette(s)',
    grpLabelsHint: 'Choisis comment retrouver ce groupe',
    grpSearchMsgs: 'Rechercher des messages', grpSearchMsgsSub: 'Trouve quelque chose dans le groupe',
    grpStarred: 'Messages enregistrés', grpStarredSub: 'Ce que tu as gardé pour y revenir',
    grpMedia: 'Médias et fichiers', grpMediaSub: 'Photos, vidéos et documents',
    grpMute: 'Couper les notifications', grpUnmute: 'Réactiver les notifications',
    grpMuteSubOn: 'Silencieux jusqu’à réactivation', grpMuteSubOff: 'Tu recevras chaque message',
    grpExport: 'Exporter la conversation', grpExportSub: 'Partager une copie en texte',
    grpClear: 'Vider la conversation', grpClearSub: 'Effacer les messages de cet appareil',
    grpClearConfirm: 'Les messages enregistrés sur cet appareil seront effacés. Le groupe et les autres membres ne changent pas.',
    grpCleared: 'Conversation vidée',
    grpLeaveSub: 'Tu ne recevras plus ses messages',
    grpDelete: 'Supprimer définitivement le groupe', grpDeleteSub: 'Il sera supprimé pour tous les participants',
    grpDeleteConfirm: 'Le groupe et ses messages seront supprimés pour tous. Cette action est irréversible.',
    grpDjDeleteConfirm: 'Le groupe et sa conversation seront supprimés. Les paiements et l’historique financier seront conservés.',
    grpDjDeleteBlocked: 'La suppression exige la fin du cycle et le règlement des dettes.',
    grpDjExitSub: 'Consulte et règle ta dette avant de quitter', grpDjDecision: 'Continuer ou quitter',
    grpDjCompleted: 'Cycle terminé',
    grpReport: 'Signaler le groupe', grpReportSub: 'Prévenir l’équipe EGCHAT',
    grpReportDone: 'Tu as déjà signalé ce groupe',
    grpReportTitle: 'Signaler le groupe', grpReportHint: 'Seule l’équipe EGCHAT le verra.',
    grpReportSpam: 'Spam ou publicité', grpReportBad: 'Contenu inapproprié',
    grpReportScam: 'Arnaque ou fraude', grpReportOther: 'Autre motif',
    grpReportSend: 'Envoyer le signalement', grpReportSent: 'Signalement envoyé. Merci de veiller sur EGCHAT.',
    grpReportFailed: 'Impossible d’envoyer le signalement',
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
    grpCover: 'Cover', grpCoverHint: 'Choose how to change the group cover',
    grpCoverCamera: 'Take a photo', grpCoverGallery: 'Choose from gallery',
    grpCoverRemove: 'Remove cover', grpCoverEdit: 'Change cover',
    grpCoverUpdated: 'Cover updated', grpCoverFailed: 'Could not change the cover',
    grpGroupSettings: 'GROUP SETTINGS',
    grpOrganize: 'ORGANIZE', grpConversation: 'CONVERSATION', grpDanger: 'DANGER & EXIT',
    grpFav: 'Favorites', grpFavOn: 'Pinned to the top of your list', grpFavOff: 'Pin to the top of your list',
    grpLabels: 'Labels', grpLabelsNone: 'No labels', grpLabelsN: 'label(s)',
    grpLabelsHint: 'Choose how you want to find this group',
    grpSearchMsgs: 'Search messages', grpSearchMsgsSub: 'Find something inside the group',
    grpStarred: 'Starred messages', grpStarredSub: 'What you saved to come back to',
    grpMedia: 'Media and files', grpMediaSub: 'Photos, videos and documents',
    grpMute: 'Mute notifications', grpUnmute: 'Turn notifications back on',
    grpMuteSubOn: 'Silent until you turn it back on', grpMuteSubOff: 'You will get every message',
    grpExport: 'Export conversation', grpExportSub: 'Share a text copy',
    grpClear: 'Clear conversation', grpClearSub: 'Erase the messages on this device',
    grpClearConfirm: 'Messages saved on this device will be erased. The group and the other members stay the same.',
    grpCleared: 'Conversation cleared',
    grpLeaveSub: 'You will stop receiving its messages',
    grpDelete: 'Delete group permanently', grpDeleteSub: 'It will be deleted for all participants',
    grpDeleteConfirm: 'The group and its messages will be deleted for everyone. This cannot be undone.',
    grpDjDeleteConfirm: 'The group and its conversation will be deleted. Payments and financial history will be preserved.',
    grpDjDeleteBlocked: 'Deletion requires a completed cycle and settled debts.',
    grpDjExitSub: 'Review and settle your debt before leaving', grpDjDecision: 'Continue or leave',
    grpDjCompleted: 'Cycle completed',
    grpReport: 'Report group', grpReportSub: 'Let the EGCHAT team know',
    grpReportDone: 'You already reported this group',
    grpReportTitle: 'Report group', grpReportHint: 'Only the EGCHAT team will see it.',
    grpReportSpam: 'Spam or advertising', grpReportBad: 'Inappropriate content',
    grpReportScam: 'Scam or fraud', grpReportOther: 'Other reason',
    grpReportSend: 'Send report', grpReportSent: 'Report sent. Thanks for looking after EGCHAT.',
    grpReportFailed: 'Could not send the report',
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
    grpCover: 'Capa', grpCoverHint: 'Escolha como mudar a capa do grupo',
    grpCoverCamera: 'Tirar uma foto', grpCoverGallery: 'Escolher da galeria',
    grpCoverRemove: 'Remover capa', grpCoverEdit: 'Mudar capa',
    grpCoverUpdated: 'Capa atualizada', grpCoverFailed: 'Não foi possível mudar a capa',
    grpGroupSettings: 'DEFINIÇÕES DO GRUPO',
    grpOrganize: 'ORGANIZAR', grpConversation: 'CONVERSA', grpDanger: 'PERIGO E SAÍDA',
    grpFav: 'Favoritos', grpFavOn: 'Fixado no topo da tua lista', grpFavOff: 'Fixar no topo da tua lista',
    grpLabels: 'Etiquetas', grpLabelsNone: 'Sem etiquetas', grpLabelsN: 'etiqueta(s)',
    grpLabelsHint: 'Escolhe como queres encontrar este grupo',
    grpSearchMsgs: 'Pesquisar mensagens', grpSearchMsgsSub: 'Encontra algo dentro do grupo',
    grpStarred: 'Mensagens guardadas', grpStarredSub: 'O que guardaste para voltar',
    grpMedia: 'Multimédia e ficheiros', grpMediaSub: 'Fotos, vídeos e documentos',
    grpMute: 'Silenciar notificações', grpUnmute: 'Reativar notificações',
    grpMuteSubOn: 'Silencioso até reativares', grpMuteSubOff: 'Recebes cada mensagem',
    grpExport: 'Exportar conversa', grpExportSub: 'Partilhar uma cópia em texto',
    grpClear: 'Limpar conversa', grpClearSub: 'Apagar as mensagens deste dispositivo',
    grpClearConfirm: 'As mensagens guardadas neste dispositivo serão apagadas. O grupo e os restantes membros não mudam.',
    grpCleared: 'Conversa limpa',
    grpLeaveSub: 'Deixarás de receber as suas mensagens',
    grpDelete: 'Eliminar grupo permanentemente', grpDeleteSub: 'Será eliminado para todos os participantes',
    grpDeleteConfirm: 'O grupo e as suas mensagens serão eliminados para todos. Esta ação é irreversível.',
    grpDjDeleteConfirm: 'O grupo e a conversa serão eliminados. Os pagamentos e o histórico financeiro serão preservados.',
    grpDjDeleteBlocked: 'A eliminação exige o fim do ciclo e a liquidação das dívidas.',
    grpDjExitSub: 'Consulta e liquida o que deves antes de sair', grpDjDecision: 'Continuar ou sair',
    grpDjCompleted: 'Ciclo concluído',
    grpReport: 'Denunciar grupo', grpReportSub: 'Avisar a equipa EGCHAT',
    grpReportDone: 'Já denunciaste este grupo',
    grpReportTitle: 'Denunciar grupo', grpReportHint: 'Só a equipa EGCHAT o verá.',
    grpReportSpam: 'Spam ou publicidade', grpReportBad: 'Conteúdo inapropriado',
    grpReportScam: 'Burla ou fraude', grpReportOther: 'Outro motivo',
    grpReportSend: 'Enviar denúncia', grpReportSent: 'Denúncia enviada. Obrigado por cuidar do EGCHAT.',
    grpReportFailed: 'Não foi possível enviar a denúncia',
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
  owner_id: string;
  name: string;
  logo_url: string | null;
  quota_amount: number;
  currency: string;
  frequency: string;
  current_turn: number;
  total_turns: number;
  status: string;
  cycle_status: string | null;
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
  cover_url: string | null;
  created_by: string | null;
  created_at: string | null;
  broadcast_mode: boolean;
  permissions: GroupPermissions;
  my_role: 'admin' | 'member';
  participants: InfoParticipant[];
  djangue: DjangueSummary | null;
}

const REPORT_REASONS = [
  { key: 'spam', label: 'grpReportSpam' },
  { key: 'inappropriate', label: 'grpReportBad' },
  { key: 'scam', label: 'grpReportScam' },
  { key: 'other', label: 'grpReportOther' },
] as const;
type ReportReason = typeof REPORT_REASONS[number]['key'];

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
  image: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Path d="m21 15-5-5L5 21" />
    </Svg>
  ),
  trash: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  ),
  star: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  ),
  starFill: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <Path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Svg>
  ),
  tag: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Circle cx="7" cy="7" r="1.5" fill={c} />
    </Svg>
  ),
  bell: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  ),
  bellOff: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <Path d="M18.63 13A17.9 17.9 0 0 1 18 8" />
      <Path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
      <Path d="M18 8a6 6 0 0 0-9.33-5" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </Svg>
  ),
  share: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" />
      <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </Svg>
  ),
  flag: (c: string, s = 20) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <Line x1="4" y1="22" x2="4" y2="15" />
    </Svg>
  ),
  chev: (c: string, s = 16) => (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="9 18 15 12 9 6" />
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
  // Acciones que viven en la pantalla del chat: la ficha de grupo las reune
  // aqui para que el menu de tres puntos quede solo en los chats 1:1.
  isMuted?: boolean;
  onToggleMute?: () => void;
  onSearch?: () => void;
  onStarred?: () => void;
  onMedia?: () => void;
  onExportChat?: () => void;
  onClearChat?: () => void;
}

export function GroupInfoModal({
  visible, chat, currentUserId, onClose, onLeft, onAvatarUpdated, onAudioCall, onVideoCall,
  isMuted, onToggleMute, onSearch, onStarred, onMedia, onExportChat, onClearChat,
}: Props) {
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);

  const [favOn, setFavOn] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [showLabels, setShowLabels] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [addSearch, setAddSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const scrollIdentity = height < 600 || fontScale > 1.2;
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const s = useMemo(() => createStyles(C), [C]);

  const isDjangue = !!info?.djangue;
  const isAdmin = info?.my_role === 'admin';
  const isCreator = !!info && String(info.djangue?.owner_id || info.created_by) === String(currentUserId);
  const canDelete = isCreator && !info?.djangue;
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
      setShowCoverMenu(false);
      setShowLabels(false);
      setShowReport(false);
      setReportReason(null);
      setReported(false);
      let vivo = true;
      getFavoriteGroupIds()
        .then(ids => { if (vivo) setFavOn(ids.includes(String(chat.id))); })
        .catch(() => {});
      getChatLabels(String(chat.id))
        .then(ls => { if (vivo) setLabels(ls); })
        .catch(() => {});
      loadInfo();
      return () => { vivo = false; };
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

  // ══ Portada del grupo ══
  const subirPortada = async (origen: 'camara' | 'galeria') => {
    if (!canEdit || !info) return;
    try {
      if (origen === 'camara') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
      }
      const opts = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9] as [number, number],
        quality: 0.7,
        base64: true,
      };
      const r = origen === 'camara'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      const asset = r.assets?.[0];
      if (r.canceled || !asset?.base64) return;
      setUploadingCover(true);
      const mimeType = asset.mimeType || 'image/jpeg';
      const res = await apiFetch<{ cover_url: string }>(`/api/chats/${chat.id}/cover`, {
        method: 'POST',
        body: JSON.stringify({ base64: `data:${mimeType};base64,${asset.base64}`, mimeType }),
      });
      const url = res?.cover_url || `data:${mimeType};base64,${asset.base64}`;
      setInfo(prev => prev ? { ...prev, cover_url: url } : prev);
      toast.success(tt('grpCoverUpdated'));
    } catch (e: any) {
      toast.error(t('error'), e?.message || tt('grpCoverFailed'));
    } finally {
      setUploadingCover(false);
    }
  };

  const quitarPortada = async () => {
    if (!canEdit || !info) return;
    setUploadingCover(true);
    try {
      await apiFetch(`/api/chats/${chat.id}/cover`, { method: 'DELETE' });
      setInfo(prev => prev ? { ...prev, cover_url: null } : prev);
    } catch (e: any) {
      toast.error(t('error'), e?.message || tt('grpCoverFailed'));
    } finally {
      setUploadingCover(false);
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
    if (leaving || deleting) return;
    if (info?.djangue) {
      onClose();
      router.push({ pathname: '/djangue-member', params: { id: info.djangue.id } } as any);
      return;
    }
    Alert.alert(tt('grpLeave'), tt('grpLeaveConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: tt('grpLeave'), style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            await apiFetch(`/api/chats/${chat.id}/leave`, { method: 'POST' });
            onLeft();
          } catch (e: any) { toast.error(e.message || tt('grpActionFailed')); }
          finally { setLeaving(false); }
        },
      },
    ]);
  }, [chat?.id, info?.djangue, leaving, deleting, onClose, onLeft, t, tt]);

  const handleDeleteGroup = useCallback(() => {
    if (!canDelete || deleting || leaving) return;
    Alert.alert(tt('grpDelete'), tt(info?.djangue ? 'grpDjDeleteConfirm' : 'grpDeleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: tt('grpDelete'), style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const url = info?.djangue ? `/api/djangue/${info.djangue.id}/delete` : `/api/chats/${chat.id}?permanent=true`;
            await apiFetch(url, { method: info?.djangue ? 'POST' : 'DELETE' });
            onLeft();
          } catch (e: any) { toast.error(e.message || tt('grpActionFailed')); }
          finally { setDeleting(false); }
        },
      },
    ]);
  }, [canDelete, deleting, leaving, info?.djangue, chat?.id, onLeft, t, tt]);

  // ══ Acciones del grupo: favoritos, etiquetas, conversación y reporte ══
  const handleToggleFavorite = useCallback(async () => {
    try {
      const ids = await toggleFavoriteGroup(String(chat.id));
      setFavOn(ids.includes(String(chat.id)));
      buzz();
    } catch { toast.error(tt('grpActionFailed')); }
  }, [chat?.id, tt]);

  const handleToggleLabel = useCallback(async (labelId: string) => {
    try {
      const next = await toggleChatLabel(String(chat.id), labelId);
      setLabels(next);
      buzz();
    } catch { toast.error(tt('grpActionFailed')); }
  }, [chat?.id, tt]);

  const handleClearChat = useCallback(() => {
    Alert.alert(tt('grpClear'), tt('grpClearConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: tt('grpClear'), style: 'destructive',
        onPress: () => {
          onClose();
          onClearChat?.();
          toast.success(tt('grpCleared'));
        },
      },
    ]);
  }, [onClearChat, onClose, t, tt]);

  const sendReport = useCallback(async () => {
    if (!reportReason || reporting) return;
    setReporting(true);
    try {
      await apiFetch(`/api/chats/${chat.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });
      setReported(true);
      setShowReport(false);
      setReportReason(null);
      toast.success(tt('grpReportSent'));
    } catch (e: any) {
      toast.error(t('error'), e?.message || tt('grpReportFailed'));
    } finally {
      setReporting(false);
    }
  }, [reportReason, reporting, chat?.id, t, tt]);

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
  const djTotal = djangue ? Math.max(1, djangue.paid_count + djangue.pending_count + (djangue.beneficiary ? 1 : 0)) : 1;
  const djPct = djangue ? Math.round((djangue.paid_count / djTotal) * 100) : 0;

  // Portada: foto propia del grupo si existe; si no, la foto del grupo
  // desenfocada. La foto del grupo se monta sobre el borde inferior.
  const renderCover = () => {
    if (!info) return null;
    const imagen = info.cover_url || info.avatar_url;
    return (
      <View style={s.coverWrap}>
        {!!imagen && (
          <Image
            source={{ uri: imagen }}
            blurRadius={info.cover_url ? 0 : 22}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {!!imagen && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.12)' }]} />}

        {canEdit && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCoverMenu(true)}
          />
        )}

        {canEdit && (
          <TouchableOpacity
            style={s.coverEditBtn}
            accessibilityRole="button"
            accessibilityLabel={tt('grpCoverEdit')}
            activeOpacity={0.85}
            onPress={() => setShowCoverMenu(true)}
            disabled={uploadingCover}
          >
            {uploadingCover
              ? <ActivityIndicator size="small" color="#fff" />
              : <>{Ico.camera('#fff', 12)}<Text style={s.coverEditText}>{tt('grpCoverEdit')}</Text></>}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={pickAvatar}
          disabled={!canEdit || uploadingAvatar}
          activeOpacity={0.85}
          style={s.coverAvatarBtn}
        >
          <View style={s.coverAvatarRing}>
            <EGAvatar src={info.avatar_url} name={info.name || 'EG'} size={80} />
          </View>
          {canEdit && (
            <View style={s.avatarBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color={C.textPrimary} />
                : Ico.camera(C.textPrimary, 14)}
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
              placeholderTextColor={C.textSecondary}
            />
            <TouchableOpacity onPress={saveName} style={s.editSaveBtn}>
              {Ico.check(C.textPrimary, 20)}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.nameRow}
            onPress={() => { if (canEdit) { setNameDraft(info.name || ''); setEditingName(true); } }}
            activeOpacity={canEdit ? 0.7 : 1}
          >
            <Text style={[s.groupName, { color: C.textPrimary }]} numberOfLines={2}>{info.name || '—'}</Text>
            {canEdit && Ico.pencil(C.textSecondary)}
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
              placeholderTextColor={C.textSecondary}
            />
            <TouchableOpacity onPress={saveDesc} style={s.editSaveBtn}>
              {Ico.check(C.textPrimary, 20)}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { if (canEdit) { setDescDraft(info.description || ''); setEditingDesc(true); } }}
            activeOpacity={canEdit ? 0.7 : 1}
            style={s.descWrap}
          >
            <Text style={[s.descText, { color: info.description ? C.textSecondary : (canEdit ? (C.textPrimary) : C.textSecondary) }]}>
              {info.description || (canEdit ? tt('grpDescPlaceholder') : '')}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[s.metaLine, { color: C.textSecondary }]}>
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
      { key: 'audio', label: tt('grpAudioCall'), icon: Ico.phone(C.textPrimary, 18), onPress: () => onAudioCall?.() },
      { key: 'video', label: tt('grpVideoCall'), icon: Ico.video(C.textPrimary, 18), onPress: () => onVideoCall?.() },
      { key: 'mensajes', label: tt('grpMessages'), icon: Ico.message(C.textPrimary, 18), onPress: onClose },
    ];
    return (
      <View style={s.callRow}>
        {acciones.map(a => (
          <TouchableOpacity key={a.key} style={s.callPill} activeOpacity={0.7} onPress={a.onPress} accessibilityRole="button" accessibilityLabel={a.label}>
            <View style={s.callPillInner}>
              {a.icon}
              <Text style={s.callPillText}>{a.label}</Text>
            </View>
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
        <View style={s.djCard}>
          <View style={s.djTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.djLabel}>{tt('grpQuota')}</Text>
              <Text style={s.djQuota}>{quota}</Text>
              <Text style={s.djSub}>{tt('grpTurn')} {djangue.current_turn} {tt('grpOf')} {djangue.total_turns} · {tt('grpExpectedPot')}: {pot}</Text>
            </View>
            <View style={s.djStatusPill}>
              <Text style={s.djStatusText}>
                {djangue.status === 'completed' ? tt('grpDjCompleted') : myTurn ? tt('grpMyTurn') : myPaid ? `✓ ${tt('grpPaid')}` : myJustified ? tt('grpJustified') : tt('grpPending')}
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
              <EGAvatar src={djangue.beneficiary.avatar_url} name={djangue.beneficiary.full_name || '?'} size={30} />
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
                      <View style={[s.djStripRing, isBenef && { borderColor: C.textPrimary }, isMe && !isBenef && { borderColor: C.textSecondary }]}>
                        <EGAvatar src={p.avatar_url} name={p.full_name || '?'} size={30} />
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
            {djangue.status === 'active' && !myPaid && !myTurn && (
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
        </View>
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
            style={[s.scopeOpt, active && { backgroundColor: C.textPrimary }]}
            onPress={() => { if (!active) onChange(scope); }}
            activeOpacity={0.8}
          >
            <Text style={[s.scopeOptText, { color: active ? C.bgSecondary : C.textSecondary }]}>
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
          {Ico.shield(C.textPrimary, 16)}
          <Text style={[s.cardTitle, { color: C.textSecondary }]}>{tt('grpPermissions')}</Text>
        </View>

        <View style={[s.permRow, { borderColor: C.borderLight }]}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[s.permTitle, { color: C.textPrimary }]}>{tt('grpPermSend')}</Text>
            {info.broadcast_mode && <Text style={[s.permHint, { color: C.textSecondary }]}>{tt('grpBroadcastBanner')}</Text>}
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
            style={[s.toggle, info.permissions.invite_admins_only && { backgroundColor: C.textPrimary }]}
            hitSlop={{ top: 9, bottom: 9, left: 0, right: 0 }}
            accessibilityRole="switch"
            accessibilityLabel={tt('grpPermInvite')}
            accessibilityState={{ checked: info.permissions.invite_admins_only }}
            activeOpacity={0.8}
          >
            <View style={[s.toggleThumb, info.permissions.invite_admins_only && [s.toggleThumbOn, { backgroundColor: C.bgSecondary }]]} />
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
        icon: Ico.userPlus(C.textPrimary, 19),
        onPress: () => { openAddModal(); },
      });
    }
    if (canInvite) {
      actions.push({
        key: 'invite', label: tt('grpInvite'),
        icon: generatingLink
          ? <ActivityIndicator size="small" color={C.textPrimary} />
          : Ico.link(C.textPrimary, 19),
        onPress: handleInvite, disabled: generatingLink,
      });
    }
    return (
      <View style={[s.quickRow, { backgroundColor: C.bgSecondary }]}>
        {actions.map(a => (
          <TouchableOpacity key={a.key} style={s.quickBtn} onPress={a.onPress} disabled={a.disabled} activeOpacity={0.75}>
            <View style={s.quickCircle}>
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
    const label = d.is_current_beneficiary ? 'grpBeneficiary'
      : d.paid_current_turn ? 'grpPaid'
      : d.has_justified ? 'grpJustified' : 'grpPending';
    return <View style={s.chip}><Text style={[s.chipText, { color: C.textSecondary }]}>{tt(label)}</Text></View>;
  };

  const renderParticipants = () => {
    if (!info) return null;
    return (
      <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
        <View style={[s.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[s.cardTitle, { color: C.textSecondary }]}>{tt('grpParticipants')}</Text>
            <View style={[s.countPill, { backgroundColor: 'transparent' }]}>
              <Text style={[s.countPillText, { color: C.textPrimary }]}>{info.participants.length}</Text>
            </View>
          </View>
        </View>

        <View style={[s.memberSearch, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
          {Ico.search(C.textSecondary, 15)}
          <TextInput
            style={[s.memberSearchInput, { color: C.textPrimary }]}
            placeholder={tt('grpSearchMembers')}
            placeholderTextColor={C.textSecondary}
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
                <EGAvatar src={p.avatar_url} name={p.full_name || p.phone || '?'} size={42} />
                {p.online_status && <View style={s.onlineDot} />}
              </View>
              <View style={s.memberBody}>
                <View style={s.memberTopRow}>
                  <Text style={[s.memberName, { color: C.textPrimary }]} numberOfLines={1}>
                    {p.full_name || p.phone || tt('grpMember')}
                    {isMe ? ` ${tt('grpYou')}` : ''}
                  </Text>
                  {p.is_creator ? (
                    <View style={[s.roleBadge, { backgroundColor: 'transparent' }]}>
                      {Ico.crown(C.textPrimary, 11)}
                      <Text style={[s.roleBadgeText, { color: C.textPrimary }]}>{tt('grpCreator')}</Text>
                    </View>
                  ) : p.role === 'admin' ? (
                    <View style={[s.roleBadge, { backgroundColor: 'transparent' }]}>
                      <Text style={[s.roleBadgeText, { color: C.textPrimary }]}>{tt('grpAdmin')}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={s.memberBottomRow}>
                  {p.djangue?.turn_order != null && (
                    <Text style={[s.turnNum, { color: C.textSecondary }]}>#{p.djangue.turn_order}</Text>
                  )}
                  {p.online_status && <Text style={[s.onlineText, { color: '#10B981' }]}>{tt('grpOnline')}</Text>}
                  {!p.online_status && p.last_seen && (
                    <Text style={[s.onlineText, { color: C.textSecondary }]}>
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
          <Text style={[s.emptyText, { color: C.textSecondary }]}>{tt('grpNoContacts')}</Text>
        )}
      </View>
    );
  };

  // Ajustes del grupo, en bloque aparte y siempre por debajo de los miembros.
  const renderSettings = () => {
    if (!info) return null;
    return (
      <View style={s.settingsBlock}>
        <Text style={[s.sectionLabel, { color: C.textSecondary }]}>{tt('grpGroupSettings')}</Text>
        {renderQuickActions()}
        {renderPermissions()}
      </View>
    );
  };

  // ══ Panel de acciones del grupo ══
  // En 1:1 estas acciones viven en el menú de tres puntos; en grupos el menú
  // desaparece y todo queda aquí, en tarjetas con el lenguaje de EGCHAT.
  const actRow = (opts: {
    key: string;
    icon: React.ReactNode;
    tint: string;
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
    danger?: boolean;
    first?: boolean;
  }) => (
    <TouchableOpacity
      key={opts.key}
      style={[s.actRow, !opts.first && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.borderLight }]}
      onPress={() => { if (!opts.disabled) opts.onPress(); }}
      disabled={opts.disabled}
      activeOpacity={opts.disabled ? 1 : 0.7}
    >
      <View style={s.actIcon}>{opts.icon}</View>
      <View style={s.actBody}>
        <Text style={[s.actTitle, { color: opts.danger ? C.errorText : C.textPrimary }]}>
          {opts.title}
        </Text>
        {!!opts.subtitle && (
          <Text style={[s.actSub, { color: C.textSecondary }]} numberOfLines={2}>{opts.subtitle}</Text>
        )}
      </View>
      {opts.right}
    </TouchableOpacity>
  );

  const switchPill = (on: boolean, color: string) => (
    <View style={[s.actSwitch, on && { backgroundColor: color }]}>
      <View style={[s.actSwitchThumb, on && [s.actSwitchThumbOn, { backgroundColor: C.bgSecondary }]]} />
    </View>
  );

  const renderActions = () => {
    if (!info) return null;
    const accent = C.textPrimary;
    const violet = C.textPrimary;
    const labelsSub = labels.length
      ? `${labels.length} ${tt('grpLabelsN')}`
      : tt('grpLabelsNone');

    return (
      <View style={s.actionBlock}>
        <Text style={[s.sectionLabel, { color: C.textSecondary }]}>{tt('grpOrganize')}</Text>
        <View style={[s.actCard, { backgroundColor: C.bgSecondary }]}>
          {actRow({
            key: 'fav', first: true, tint: C.textPrimary,
            icon: favOn ? Ico.starFill(C.textPrimary, 18) : Ico.star(C.textPrimary, 18),
            title: tt('grpFav'),
            subtitle: favOn ? tt('grpFavOn') : tt('grpFavOff'),
            right: switchPill(favOn, C.textPrimary),
            onPress: handleToggleFavorite,
          })}
          {actRow({
            key: 'labels', tint: violet,
            icon: Ico.tag(violet, 18),
            title: tt('grpLabels'),
            subtitle: labelsSub,
            right: (
              <View style={{ transform: [{ rotate: showLabels ? '90deg' : '0deg' }] }}>
                {Ico.chev(C.textSecondary)}
              </View>
            ),
            onPress: () => { setShowLabels(v => !v); buzz(); },
          })}
          {showLabels && (
            <View style={[s.labelsWrap, { borderColor: C.borderLight }]}>
              <Text style={[s.labelsHint, { color: C.textSecondary }]}>{tt('grpLabelsHint')}</Text>
              <View style={s.labelsRow}>
                {DEFAULT_LABELS.map(l => {
                  const on = labels.includes(l.id);
                  return (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => handleToggleLabel(l.id)}
                      activeOpacity={0.8}
                      style={[s.labelChip, {
                        borderColor: on ? C.textPrimary : C.borderLight,
                        backgroundColor: 'transparent',
                      }]}
                    >
                      {on ? Ico.check(C.textPrimary, 14) : Ico.tag(C.textSecondary, 14)}
                      <Text style={[s.labelText, { color: on ? C.textPrimary : C.textSecondary }]}>{l.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <Text style={[s.sectionLabel, s.sectionGap, { color: C.textSecondary }]}>{tt('grpConversation')}</Text>
        <View style={[s.actCard, { backgroundColor: C.bgSecondary }]}>
          {actRow({
            key: 'search', first: true, tint: accent,
            icon: Ico.search(accent, 18),
            title: tt('grpSearchMsgs'), subtitle: tt('grpSearchMsgsSub'),
            right: Ico.chev(C.textSecondary),
            onPress: () => onSearch?.(),
          })}
          {actRow({
            key: 'starred', tint: C.textPrimary,
            icon: Ico.star(C.textPrimary, 18),
            title: tt('grpStarred'), subtitle: tt('grpStarredSub'),
            right: Ico.chev(C.textSecondary),
            onPress: () => onStarred?.(),
          })}
          {actRow({
            key: 'media', tint: C.textPrimary,
            icon: Ico.image(C.textPrimary, 18),
            title: tt('grpMedia'), subtitle: tt('grpMediaSub'),
            right: Ico.chev(C.textSecondary),
            onPress: () => onMedia?.(),
          })}
          {actRow({
            key: 'mute', tint: C.textPrimary,
            icon: isMuted ? Ico.bellOff(C.textPrimary, 18) : Ico.bell(C.textPrimary, 18),
            title: isMuted ? tt('grpUnmute') : tt('grpMute'),
            subtitle: isMuted ? tt('grpMuteSubOn') : tt('grpMuteSubOff'),
            right: switchPill(!!isMuted, C.textPrimary),
            onPress: () => onToggleMute?.(),
          })}
          {actRow({
            key: 'export', tint: accent,
            icon: Ico.share(accent, 18),
            title: tt('grpExport'), subtitle: tt('grpExportSub'),
            right: Ico.chev(C.textSecondary),
            onPress: () => onExportChat?.(),
          })}
          {actRow({
            key: 'clear', tint: C.textPrimary,
            icon: Ico.trash(C.textPrimary, 18),
            title: tt('grpClear'), subtitle: tt('grpClearSub'),
            right: Ico.chev(C.textSecondary),
            onPress: handleClearChat,
          })}
        </View>

        <Text style={[s.sectionLabel, s.sectionGap, { color: C.textSecondary }]}>{tt('grpDanger')}</Text>
        <View style={[s.actCard, { backgroundColor: C.bgSecondary }]}>
          {actRow({
            key: 'leave', first: true, tint: C.errorText, danger: true,
            icon: Ico.logout(C.errorText, 18),
            title: tt('grpLeave'), subtitle: tt(isDjangue ? 'grpDjExitSub' : 'grpLeaveSub'),
            disabled: leaving || deleting,
            right: leaving ? <ActivityIndicator size="small" color={C.errorText} /> : Ico.chev(C.textSecondary),
            onPress: handleLeave,
          })}
          {isCreator && actRow({
            key: 'delete', tint: C.errorText, danger: true, disabled: !canDelete || deleting || leaving,
            icon: Ico.trash(C.errorText, 18),
            title: tt('grpDelete'), subtitle: tt(canDelete ? 'grpDeleteSub' : 'grpDjDeleteBlocked'),
            right: deleting ? <ActivityIndicator size="small" color={C.errorText} /> : Ico.chev(C.textSecondary),
            onPress: handleDeleteGroup,
          })}
          {actRow({
            key: 'report', tint: C.errorText, danger: !reported, disabled: reported,
            icon: Ico.flag(C.errorText, 18),
            title: tt('grpReport'),
            subtitle: reported ? tt('grpReportDone') : tt('grpReportSub'),
            right: reported ? Ico.check('#10B981', 16) : Ico.chev(C.textSecondary),
            onPress: () => { setReportReason(null); setShowReport(true); buzz(); },
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {visible && <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />}
      <View style={[s.root, { backgroundColor: C.bgPrimary, paddingTop: insets.top }]}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn} accessibilityRole="button" accessibilityLabel={t('back')}>
            {Ico.back(C.textPrimary, 20)}
          </TouchableOpacity>
          <Text style={s.headerTitle}>{tt('grpInfoTitle')}</Text>
          <View style={s.typeBadge}>
            <Text style={s.typeBadgeText}>
              {isDjangue ? tt('grpDjangueBadge') : tt('grpGroupBadge')}
            </Text>
          </View>
        </View>

        {loadState === 'loading' && (
          <View style={s.centerState}>
            <ActivityIndicator size="large" color={C.textPrimary} />
            <Text style={[s.stateText, { color: C.textSecondary }]}>{tt('grpLoading')}</Text>
          </View>
        )}

        {loadState === 'error' && (
          <View style={s.centerState}>
            <Text style={[s.stateText, { color: C.textPrimary }]}>{tt('grpLoadError')}</Text>
            {!!loadDetail && (
              <Text style={[s.stateText, { color: C.textSecondary, fontSize: 12, marginTop: 6 }]}>
                {loadDetail}
              </Text>
            )}
            <TouchableOpacity style={[s.retryBtn, { backgroundColor: C.textPrimary }]} onPress={loadInfo}>
              <Text style={s.retryBtnText}>{tt('grpRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loadState === 'ready' && info && !scrollIdentity && (
          <View style={s.fixedTop}>
            {renderCover()}
            {renderIdentity()}
            {renderCallBar()}
          </View>
        )}

        {loadState === 'ready' && info && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: scrollIdentity ? 0 : 14, paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {scrollIdentity && (
              <View style={s.fixedTop}>
                {renderCover()}
                {renderIdentity()}
                {renderCallBar()}
              </View>
            )}
            {!isAdmin && info.broadcast_mode && (
              <View style={[s.broadcastBanner, { backgroundColor: C.bgSecondary }]}>
                {Ico.megaphone(C.textSecondary, 16)}
                <Text style={[s.broadcastText, { color: C.textSecondary }]}>{tt('grpBroadcastBanner')}</Text>
              </View>
            )}
            {renderDjangueCard()}
            {renderParticipants()}
            {renderSettings()}
            {renderActions()}
          </ScrollView>
        )}

        {/* Menú de portada (capa dentro del modal, igual que el panel de añadir) */}
        {showCoverMenu && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', zIndex: 30 }]}>
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
              activeOpacity={1}
              onPress={() => setShowCoverMenu(false)}
            />
            <ScrollView
              style={{ flexGrow: 0, maxHeight: height - insets.top, backgroundColor: C.bgPrimary, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
              contentContainerStyle={[s.coverSheet, { paddingBottom: insets.bottom + 12 }]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[s.sheetGrab, { backgroundColor: C.borderLight }]} />
              <Text style={[s.sheetTitle, { color: C.textPrimary }]}>{tt('grpCover')}</Text>
              <Text style={[s.sheetHint, { color: C.textSecondary }]}>{tt('grpCoverHint')}</Text>

              <View style={[s.sheetGroup, { backgroundColor: C.bgSecondary }]}>
                <TouchableOpacity
                  style={s.sheetRow}
                  activeOpacity={0.75}
                  onPress={() => { setShowCoverMenu(false); subirPortada('camara'); }}
                >
                  <View style={s.sheetIcon}>
                    {Ico.camera(C.textPrimary, 17)}
                  </View>
                  <Text style={[s.sheetRowText, { color: C.textPrimary }]}>{tt('grpCoverCamera')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.sheetRow, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.borderLight }]}
                  activeOpacity={0.75}
                  onPress={() => { setShowCoverMenu(false); subirPortada('galeria'); }}
                >
                  <View style={s.sheetIcon}>
                    {Ico.image(C.textPrimary, 18)}
                  </View>
                  <Text style={[s.sheetRowText, { color: C.textPrimary }]}>{tt('grpCoverGallery')}</Text>
                </TouchableOpacity>

                {!!info?.cover_url && (
                  <TouchableOpacity
                    style={[s.sheetRow, { borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.borderLight }]}
                    activeOpacity={0.75}
                    onPress={() => { setShowCoverMenu(false); quitarPortada(); }}
                  >
                    <View style={s.sheetIcon}>
                      {Ico.trash(C.errorText, 17)}
                    </View>
                    <Text style={[s.sheetRowText, { color: C.errorText }]}>{tt('grpCoverRemove')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[s.sheetCancel, { backgroundColor: C.bgSecondary }]}
                activeOpacity={0.8}
                onPress={() => setShowCoverMenu(false)}
              >
                <Text style={[s.sheetCancelText, { color: C.textPrimary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Hoja de reporte: motivo + envío al equipo de EGCHAT */}
        {showReport && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', zIndex: 40 }]}>
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
              activeOpacity={1}
              onPress={() => { if (!reporting) setShowReport(false); }}
            />
            <ScrollView
              style={{ flexGrow: 0, maxHeight: height - insets.top, backgroundColor: C.bgPrimary, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
              contentContainerStyle={[s.coverSheet, { paddingBottom: insets.bottom + 12 }]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[s.sheetGrab, { backgroundColor: C.borderLight }]} />
              <Text style={[s.sheetTitle, { color: C.textPrimary }]}>{tt('grpReportTitle')}</Text>
              <Text style={[s.sheetHint, { color: C.textSecondary }]}>{tt('grpReportHint')}</Text>

              <View style={[s.sheetGroup, { backgroundColor: C.bgSecondary }]}>
                {REPORT_REASONS.map((r, i) => {
                  const on = reportReason === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[s.sheetRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.borderLight }]}
                      activeOpacity={0.75}
                      onPress={() => { setReportReason(r.key); buzz(); }}
                    >
                      <View style={[s.reportRadio, on && { borderColor: C.errorText }]}>
                        {on && <View style={s.reportRadioDot} />}
                      </View>
                      <Text style={[s.sheetRowText, { color: C.textPrimary, flex: 1 }]}>{tt(r.label)}</Text>
                      {Ico.flag(C.errorText, 15)}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[s.reportSend, (!reportReason || reporting) && { opacity: 0.5 }]}
                activeOpacity={0.85}
                disabled={!reportReason || reporting}
                onPress={sendReport}
              >
                {reporting
                  ? <ActivityIndicator size="small" color={C.textPrimary} />
                  : <Text style={s.reportSendText}>{tt('grpReportSend')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.sheetCancel, { backgroundColor: C.bgSecondary }]}
                activeOpacity={0.8}
                onPress={() => { if (!reporting) setShowReport(false); }}
              >
                <Text style={[s.sheetCancelText, { color: C.textPrimary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Panel añadir participantes (capa dentro del mismo modal: evita
          modales anidados, que en iOS no siempre se presentan) */}
      {showAdd && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bgPrimary, paddingTop: insets.top, zIndex: 20 }]}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={s.headerBtn} accessibilityRole="button" accessibilityLabel={t('cancel')}>
              {Ico.close(C.textPrimary, 20)}
            </TouchableOpacity>
            <Text style={s.headerTitle}>{tt('grpAddPeople')}</Text>
            <TouchableOpacity
              onPress={confirmAdd}
              disabled={selected.size === 0 || adding}
              style={[s.addConfirmBtn, (selected.size === 0 || adding) && { opacity: 0.45 }]}
            >
              {adding
                ? <ActivityIndicator size="small" color={C.textPrimary} />
                : <Text style={s.addConfirmText}>{tt('grpAddMembers')}{selected.size > 0 ? ` (${selected.size})` : ''}</Text>}
            </TouchableOpacity>
          </View>

          <View style={[s.memberSearch, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', marginHorizontal: 12, marginTop: 10 }]}>
            {Ico.search(C.textSecondary, 15)}
            <TextInput
              style={[s.memberSearchInput, { color: C.textPrimary }]}
              placeholder={t('chtSearchDots')}
              placeholderTextColor={C.textSecondary}
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
                  <View style={[s.selectCircle, isSel && { backgroundColor: C.textPrimary, borderColor: C.textPrimary }]}>
                    {isSel && Ico.check(C.bgSecondary, 13)}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={[s.emptyText, { color: C.textSecondary }]}>{tt('grpNoContacts')}</Text>}
          />
        </View>
      )}
    </Modal>
  );
}

const createStyles = (C: typeof Colors) => StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgSecondary,
    paddingHorizontal: 8, paddingVertical: 4, gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: C.textPrimary },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8, color: C.textSecondary },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  stateText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 26, paddingVertical: 11, borderRadius: 22 },
  retryBtnText: { color: C.bgSecondary, fontSize: 15, fontWeight: '700' },

  // Cabecera fija: portada + identidad + accesos directos
  fixedTop: { backgroundColor: 'transparent' },
  coverWrap: { height: 104, backgroundColor: C.bgTertiary },
  coverEditBtn: {
    position: 'absolute', top: 10, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, minHeight: 44, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  coverEditText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  coverAvatarBtn: {
    position: 'absolute', alignSelf: 'center', bottom: -40,
    width: 80, height: 80,
  },
  coverAvatarRing: {
    width: 80, height: 80, borderRadius: 40, overflow: 'hidden',
    borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#fff',
  },
  identity: { alignItems: 'center', paddingTop: 46, paddingHorizontal: 20 },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.bgSecondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6, minHeight: 44 },
  groupName: { fontSize: 18, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8, paddingHorizontal: 12, width: '100%', justifyContent: 'center' },
  editInput: { flex: 1, maxWidth: 320, fontSize: 15, fontWeight: '600', borderBottomWidth: 1.5, paddingBottom: 4, textAlign: 'center' },
  descInput: { fontSize: 12.5, fontWeight: '400', minHeight: 30, textAlign: 'center' },
  editSaveBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  descWrap: { paddingHorizontal: 24, minHeight: 44, justifyContent: 'center' },
  descText: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  metaLine: { fontSize: 12, marginTop: 8, textAlign: 'center' },

  // Accesos directos (fijos bajo la identidad)
  callRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  callPill: { flex: 1 },
  callPillInner: {
    minHeight: 44, borderRadius: 10, flexDirection: 'row', padding: 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  callPillText: { color: C.textPrimary, fontSize: 12, fontWeight: '500', flexShrink: 1 },

  // Ajustes del grupo (bloque inferior)
  settingsBlock: { marginTop: 8 },
  sectionLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 1.1,
    marginHorizontal: 26, marginBottom: 8,
  },

  // Menú de portada
  coverSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, paddingHorizontal: 16 },
  sheetGrab: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '600', marginLeft: 2 },
  sheetHint: { fontSize: 11.5, marginTop: 3, marginBottom: 12, marginLeft: 2 },
  sheetGroup: { borderRadius: 16, overflow: 'hidden' },
  sheetRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 13 },
  sheetIcon: { width: 26, alignItems: 'center', justifyContent: 'center' },
  sheetRowText: { fontSize: 13.5, fontWeight: '600' },
  sheetCancel: { marginTop: 8, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  sheetCancelText: { fontSize: 13.5, fontWeight: '700' },

  // Banner broadcast
  broadcastBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginBottom: 4, borderRadius: 12, padding: 10,
  },
  broadcastText: { fontSize: 11.5, fontWeight: '600', flex: 1 },

  // Tarjeta djangue
  djCardWrap: { paddingHorizontal: 14, marginBottom: 12 },
  djCard: { borderRadius: 16, padding: 16, backgroundColor: C.bgSecondary, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
  djTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  djLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '600', letterSpacing: 0.4 },
  djQuota: { fontSize: 24, fontWeight: '600', color: C.textPrimary, marginTop: 2 },
  djSub: { fontSize: 11, color: C.textSecondary, marginTop: 3 },
  djStatusPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 150 },
  djStatusText: { fontSize: 12, fontWeight: '600', color: C.textPrimary, textAlign: 'center' },
  djProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 },
  djProgressTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' },
  djProgressFill: { height: 7, borderRadius: 4, backgroundColor: C.textPrimary },
  djProgressText: { fontSize: 11.5, fontWeight: '600', color: C.textPrimary },
  djProgressLabel: { fontSize: 12, color: C.textSecondary, marginTop: 4 },
  djBenefRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgTertiary, borderRadius: 14,
    padding: 10, marginTop: 14,
  },
  djBenefLabel: { fontSize: 12, color: C.textSecondary },
  djBenefName: { fontSize: 13.5, fontWeight: '700', color: C.textPrimary, marginTop: 1 },
  djBenefAmount: { backgroundColor: C.bgTertiary, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 6 },
  djBenefAmountText: { fontSize: 11.5, fontWeight: '600', color: C.textPrimary },
  djStripLabel: { fontSize: 12, color: C.textSecondary, marginTop: 12, marginBottom: 7 },
  djStrip: { gap: 10, paddingRight: 8 },
  djStripItem: { alignItems: 'center', gap: 3 },
  djStripRing: { borderWidth: 2, borderColor: 'transparent', borderRadius: 18, padding: 1 },
  djStripNum: { fontSize: 9.5, fontWeight: '700', color: C.textSecondary },
  djActionsRow: { gap: 8, marginTop: 14 },
  djBtnGold: {
    flex: 1, backgroundColor: C.bgTertiary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  djBtnGoldText: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  djBtnGhost: {
    borderWidth: 1.2, borderColor: C.border, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  djBtnGhostText: { fontSize: 12.5, fontWeight: '700', color: C.textPrimary },

  // Acciones rápidas
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginHorizontal: 14, borderRadius: 14, paddingVertical: 12, marginBottom: 10,
  },
  quickBtn: { alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 76, minHeight: 48 },
  quickCircle: {
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, fontWeight: '600' },

  // Tarjetas
  card: { marginHorizontal: 14, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 10 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardTitle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  countPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countPillText: { fontSize: 11, fontWeight: '600' },

  // Permisos
  permRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth,
  },
  permTitle: { fontSize: 13, fontWeight: '600' },
  permHint: { fontSize: 12, marginTop: 2 },
  scopePicker: { flexDirection: 'row', borderRadius: 10, padding: 2 },
  scopeOpt: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center', borderRadius: 8 },
  scopeOptText: { fontSize: 11, fontWeight: '700' },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#CBD5E1', justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#fff' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Participantes
  memberSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, marginBottom: 4, minHeight: 44,
  },
  memberSearchInput: { flex: 1, fontSize: 13, padding: 0 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth,
  },
  memberBody: { flex: 1, gap: 2 },
  memberTopRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  memberName: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  memberBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  turnNum: { fontSize: 12, fontWeight: '700' },
  onlineText: { fontSize: 12 },
  onlineDot: {
    position: 'absolute', right: 0, bottom: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff',
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2.5,
  },
  roleBadgeText: { fontSize: 9.5, fontWeight: '600' },
  chip: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3.5, marginLeft: 5 },
  chipText: { fontSize: 9.5, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 14 },
  selectCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.8, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  addConfirmBtn: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 7, marginRight: 4,
    minHeight: 44, justifyContent: 'center',
  },
  addConfirmText: { color: C.textPrimary, fontSize: 12.5, fontWeight: '600' },

  // Acciones del grupo (organizar / conversación / peligro)
  actionBlock: { marginTop: 4 },
  sectionGap: { marginTop: 8 },
  actCard: { marginHorizontal: 14, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  actRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  actIcon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  actBody: { flex: 1, minWidth: 0 },
  actTitle: { fontSize: 14, fontWeight: '600' },
  actSub: { fontSize: 12, marginTop: 2, lineHeight: 14 },
  actSwitch: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: '#CBD5E1',
    justifyContent: 'center', paddingHorizontal: 2, marginLeft: 6,
  },
  actSwitchThumb: { width: 21, height: 21, borderRadius: 11, backgroundColor: '#fff' },
  actSwitchThumbOn: { alignSelf: 'flex-end' },

  // Etiquetas
  labelsWrap: {
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  labelsHint: { fontSize: 12, marginBottom: 9 },
  labelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  labelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  labelText: { fontSize: 11.5, fontWeight: '700' },

  // Reporte
  reportRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  reportRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.errorText },
  reportSend: {
    marginTop: 8, borderRadius: 14, paddingVertical: 13, minHeight: 48,
    alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  reportSendText: { color: C.textPrimary, fontSize: 13.5, fontWeight: '600' },
});
