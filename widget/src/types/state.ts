export interface WidgetState {
  isOpen: boolean;
  isConnected: boolean;
  isTyping: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export type WidgetMode = 'chat' | 'speak';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
