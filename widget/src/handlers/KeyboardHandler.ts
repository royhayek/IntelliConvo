import { WidgetSettings } from '../types';

export interface KeyboardHandlerDependencies {
  settings: WidgetSettings | null;
}

export class KeyboardHandler {
  private dependencies: KeyboardHandlerDependencies;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(dependencies: KeyboardHandlerDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Sets up keyboard navigation for the chat window
   */
  public setupKeyboardNavigation(): void {
    if (!this.dependencies.settings?.enableKeyboardNavigation) return;

    const chatWindow = document.getElementById('intelligentconvo-chat-window');
    if (!chatWindow) return;

    // Remove existing handler if any
    if (this.keydownHandler) {
      chatWindow.removeEventListener('keydown', this.keydownHandler);
    }

    // Get all focusable elements
    const focusableSelector = 'button, input, [tabindex]:not([tabindex="-1"])';

    this.keydownHandler = (e: KeyboardEvent) => {
      const focusables = Array.from(chatWindow.querySelectorAll(focusableSelector)) as HTMLElement[];
      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'Tab':
          // Default tab behavior, but trap focus in modal
          if (e.shiftKey && currentIndex === 0) {
            e.preventDefault();
            focusables[focusables.length - 1]?.focus();
          } else if (!e.shiftKey && currentIndex === focusables.length - 1) {
            e.preventDefault();
            focusables[0]?.focus();
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < focusables.length - 1) {
            focusables[currentIndex + 1]?.focus();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            focusables[currentIndex - 1]?.focus();
          }
          break;

        case 'Home':
          if (e.ctrlKey) {
            e.preventDefault();
            focusables[0]?.focus();
          }
          break;

        case 'End':
          if (e.ctrlKey) {
            e.preventDefault();
            focusables[focusables.length - 1]?.focus();
          }
          break;
      }
    };

    chatWindow.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Cleanup method to remove event listeners
   */
  public cleanup(): void {
    const chatWindow = document.getElementById('intelligentconvo-chat-window');
    if (chatWindow && this.keydownHandler) {
      chatWindow.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
  }
}
