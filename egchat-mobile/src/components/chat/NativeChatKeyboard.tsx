import React from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleProp,
  UIManager,
  ViewStyle,
} from 'react-native';

type NativeEvent<T> = { nativeEvent: T };

export interface NativeChatKeyboardProps {
  text: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  style?: StyleProp<ViewStyle>;
}

type NativeProps = {
  text: string;
  onChangeText?: (event: NativeEvent<{ text: string }>) => void;
  onSubmit?: (event: NativeEvent<Record<string, never>>) => void;
  style?: StyleProp<ViewStyle>;
};

const componentName = 'EGChatKeyboardView';
export const isNativeChatKeyboardAvailable = Platform.OS !== 'web' && !!UIManager.getViewManagerConfig?.(componentName);
export const NATIVE_CHAT_KEYBOARD_HEIGHT = Platform.OS === 'ios' ? 291 : 252;
const NativeKeyboard = isNativeChatKeyboardAvailable
  ? requireNativeComponent<NativeProps>(componentName)
  : null;

export function NativeChatKeyboard({
  text,
  onChangeText,
  onSubmit,
  style,
}: NativeChatKeyboardProps) {
  if (!NativeKeyboard) return null;

  return (
    <NativeKeyboard
      style={[{ height: NATIVE_CHAT_KEYBOARD_HEIGHT }, style]}
      text={text}
      onChangeText={event => onChangeText(event.nativeEvent.text)}
      onSubmit={() => onSubmit?.()}
    />
  );
}
