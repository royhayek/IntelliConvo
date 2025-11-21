import { WidgetSettings } from '../types/settings';
import { WidgetConfig } from '../types/config';

/**
 * LauncherRenderer handles rendering of the launcher button
 * that opens/closes the chat widget
 */
export class LauncherRenderer {
  private settings: WidgetSettings | null;
  private config: WidgetConfig;

  constructor(settings: WidgetSettings | null, config: WidgetConfig) {
    this.settings = settings;
    this.config = config;
  }

  /**
   * Renders the launcher button HTML element
   * @param onToggle - Callback function when button is clicked
   * @returns The created button element
   */
  public renderButton(onToggle: () => void): HTMLButtonElement {
    const position = this.settings?.launcherPosition || this.config.position || 'bottom-right';
    const tooltip = this.settings?.launcherTooltip || 'Open chat';
    const shape = this.settings?.launcherShape || 'circle';
    const animation = this.settings?.launcherAnimation || 'pulse';

    const button = document.createElement('button');
    button.id = 'intelligentconvo-button';
    button.className = `intelligentconvo-button intelligentconvo-${position} intelligentconvo-shape-${shape} intelligentconvo-animation-${animation}`;
    button.setAttribute('aria-label', tooltip);
    button.setAttribute('title', this.settings?.launcherShowTooltip ? tooltip : '');
    button.setAttribute('role', 'button');

    // All launcher styles are now handled via CSS variables set in applySettings()

    button.innerHTML = `
      <div class="intelligentconvo-button-inner">
        ${this.getLauncherIcon()}
        ${this.settings?.launcherShowBadge ? `<span class="intelligentconvo-badge">0</span>` : ''}
      </div>
      ${this.settings?.launcherText ? `<span class="intelligentconvo-launcher-text">${this.settings.launcherText}</span>` : ''}
    `;

    button.addEventListener('click', () => {
      onToggle();
    });

    button.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    });

    return button;
  }

  /**
   * Gets the launcher icon HTML based on settings
   * @returns HTML string for the launcher icon
   */
  public getLauncherIcon(): string {
    if (!this.settings) {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
      </svg>`;
    }

    if (this.settings.launcherCustomIconUrl) {
      return `<img src="${this.settings.launcherCustomIconUrl}" alt="Chat" width="24" height="24" />`;
    }

    const icons: Record<string, string> = {
      chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
      </svg>`,
      message: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
      </svg>`,
      help: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7S10 7.9 10 9H8C8 6.79 9.79 5 12 5S16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z" fill="currentColor"/>
      </svg>`,
      support: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 1C5.9 1 1 5.9 1 12S5.9 23 12 23 23 18.1 23 12 18.1 1 12 1ZM12 21C7 21 3 17 3 12S7 3 12 3 21 7 21 12 17 21 12 21ZM12 11C10.3 11 9 9.7 9 8S10.3 5 12 5 15 6.3 15 8 13.7 11 12 11ZM12 13C14.7 13 20 14.3 20 17V19H4V17C4 14.3 9.3 13 12 13Z" fill="currentColor"/>
      </svg>`,
    };

    return icons[this.settings.launcherIcon] || icons.chat;
  }

  /**
   * Updates the internal settings reference
   * @param settings - New widget settings
   */
  public updateSettings(settings: WidgetSettings | null): void {
    this.settings = settings;
  }
}
