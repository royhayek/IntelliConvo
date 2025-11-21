import { Message } from './message';

export interface WidgetConfig {
  siteId: string;
  mode?: 'button' | 'widget';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  apiUrl?: string;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  customStyles?: Partial<CSSStyleDeclaration>;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  loadSettingsFromServer?: boolean;
}
