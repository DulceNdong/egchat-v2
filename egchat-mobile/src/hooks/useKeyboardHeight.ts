/**
 * useKeyboardHeight
 *
 * keyboardVisible: true desde que el teclado EMPIEZA a subir,
 *                 false solo cuando TERMINA de bajar (keyboardDidHide).
 *                 Esto evita el salto de padding durante la animación de bajada.
 *
 * keyboardHeight: altura final del teclado.
 * panelHeight:    última altura medida (nunca 0).
 */
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const lastHeightRef = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      // WillShow: el teclado EMPIEZA a subir → activar visible inmediatamente
      const onWillShow = (e: any) => {
        const h = e.endCoordinates?.height ?? 0;
        if (h > 50) {
          lastHeightRef.current = h;
          setKeyboardHeight(h);
          setKeyboardVisible(true);
        }
      };

      // DidHide: el teclado TERMINÓ de bajar → desactivar visible
      // Usar Did (no Will) para que el padding vuelva solo cuando
      // la animación de bajada ya completó — sin salto visual
      const onDidHide = () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      };

      const s1 = Keyboard.addListener('keyboardWillShow', onWillShow);
      const s2 = Keyboard.addListener('keyboardDidHide', onDidHide);
      return () => { s1.remove(); s2.remove(); };
    } else {
      const onShow = (e: any) => {
        const h = e.endCoordinates?.height ?? 0;
        if (h > 50) {
          lastHeightRef.current = h;
          setKeyboardHeight(h);
          setKeyboardVisible(true);
        }
      };
      const onHide = () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      };
      const s1 = Keyboard.addListener('keyboardDidShow', onShow);
      const s2 = Keyboard.addListener('keyboardDidHide', onHide);
      return () => { s1.remove(); s2.remove(); };
    }
  }, []);

  const panelHeight = lastHeightRef.current;
  return { keyboardHeight, keyboardVisible, panelHeight };
}
