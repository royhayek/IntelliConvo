/**
 * Global window types for the widget
 */

import { WidgetConfig } from './config';

export type WidgetCommand = ['init', WidgetConfig] | [string, ...unknown[]];

export interface IntelligentconvoQueue {
  (...args: unknown[]): void;
  q?: WidgetCommand[];
  _init?: () => void;
}

export interface IntelligentconvoInit {
  (command: 'init', config: WidgetConfig): void;
  (command: string, config?: WidgetConfig): void;
}

export type IntelligentconvoFunction = IntelligentconvoQueue | IntelligentconvoInit;

declare global {
  interface Window {
    intelligentconvo: IntelligentconvoFunction;
  }
}
