/**
 * Global window types for the widget
 */

import { WidgetConfig } from './config';

export type WidgetCommand = ['init', WidgetConfig] | [string, ...unknown[]];

export interface IntelliConvoQueue {
  (...args: unknown[]): void;
  q?: WidgetCommand[];
  _init?: () => void;
}

export interface IntelliConvoInit {
  (command: 'init', config: WidgetConfig): void;
  (command: string, config?: WidgetConfig): void;
}

export type IntelliConvoFunction = IntelliConvoQueue | IntelliConvoInit;

declare global {
  interface Window {
    intelliconvo: IntelliConvoFunction;
  }
}
