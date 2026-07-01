// Mis Tarjetas — abre módulo Bancos en pantalla cards (paridad web)
import React from 'react';
import { BancosModal } from './BancosModal';

interface Props { visible: boolean; onClose: () => void; }

export const TarjetasModal: React.FC<Props> = ({ visible, onClose }) => (
  <BancosModal visible={visible} onClose={onClose} initScreen="cards" />
);
