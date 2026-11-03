// Re-export ChatHeader as EGChatHeader for backward compatibility
export { default as EGChatHeader } from './chat/ChatHeader';
export type { ChatHeaderProps } from './chat/ChatHeader';

// Weather condition type
export interface WeatherCondition {
  temp: number;
  condition: string;
  icon: string;
}
