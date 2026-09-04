/**
 * KeyboardModal — wrapper de Modal que evita que el teclado tape los inputs.
 * Úsalo en lugar de <Modal> cuando el contenido tenga TextInput.
 *
 * Uso:
 *   <KeyboardModal visible={...} onClose={...}>
 *     <View style={sheet}>...</View>
 *   </KeyboardModal>
 */
import React from 'react';
import {
  Modal, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, ModalProps,
} from 'react-native';

interface KeyboardModalProps extends Omit<ModalProps, 'transparent'> {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Si el sheet está en la parte inferior (default: true) */
  sheetFromBottom?: boolean;
}

export const KeyboardModal: React.FC<KeyboardModalProps> = ({
  visible,
  onClose,
  children,
  sheetFromBottom = true,
  animationType = 'slide',
  ...rest
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
      {...rest}
    >
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <Pressable
          style={[s.overlay, sheetFromBottom && s.overlayBottom]}
          onPress={onClose}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const s = StyleSheet.create({
  flex:          { flex: 1 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayBottom: { justifyContent: 'flex-end' },
});

export default KeyboardModal;
