/**
 * Toast notification utility for user feedback
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
}

export class Toast {
  private static container: HTMLElement | null = null;
  private static activeToasts: Set<HTMLElement> = new Set();

  /**
   * Shows a toast notification
   * @param options - Toast options
   */
  public static show(options: ToastOptions): void {
    const {
      message,
      type = 'info',
      duration = 3000,
      position = 'bottom',
    } = options;

    // Create container if it doesn't exist
    if (!this.container) {
      this.createContainer(position);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `intelligentconvo-toast intelligentconvo-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    // Add to container
    this.container?.appendChild(toast);
    this.activeToasts.add(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('intelligentconvo-toast-show');
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
  }

  /**
   * Removes a toast notification
   * @param toast - Toast element to remove
   */
  private static remove(toast: HTMLElement): void {
    if (!this.activeToasts.has(toast)) {
      return;
    }

    toast.classList.remove('intelligentconvo-toast-show');
    toast.classList.add('intelligentconvo-toast-hide');

    // Remove from DOM after animation
    setTimeout(() => {
      toast.remove();
      this.activeToasts.delete(toast);

      // Remove container if no active toasts
      if (this.activeToasts.size === 0 && this.container) {
        this.container.remove();
        this.container = null;
      }
    }, 300);
  }

  /**
   * Creates the toast container
   * @param position - Position of the container
   */
  private static createContainer(position: 'top' | 'bottom'): void {
    this.container = document.createElement('div');
    this.container.className = `intelligentconvo-toast-container intelligentconvo-toast-${position}`;
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.container);
  }

  /**
   * Clears all active toasts
   */
  public static clearAll(): void {
    this.activeToasts.forEach(toast => {
      this.remove(toast);
    });
  }

  /**
   * Convenience methods for different toast types
   */
  public static info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }

  public static success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  public static warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  public static error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration });
  }
}
