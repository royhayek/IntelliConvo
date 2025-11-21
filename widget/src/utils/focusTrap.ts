/**
 * Focus trap utility for modal accessibility
 * Ensures keyboard navigation stays within modal when open
 */

export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Activates the focus trap
   */
  public activate(): void {
    // Store current active element to restore later
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Find all focusable elements
    this.updateFocusableElements();

    // Focus the first element
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }

    // Add keyboard listener
    this.keydownHandler = (e: KeyboardEvent) => this.handleKeydown(e);
    this.element.addEventListener('keydown', this.keydownHandler);
  }

  /**
   * Deactivates the focus trap and restores focus
   */
  public deactivate(): void {
    // Remove keyboard listener
    if (this.keydownHandler) {
      this.element.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    // Restore focus to previous element
    if (this.previousActiveElement && this.previousActiveElement.focus) {
      this.previousActiveElement.focus();
    }
  }

  /**
   * Updates the list of focusable elements
   */
  private updateFocusableElements(): void {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    this.focusableElements = Array.from(
      this.element.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
  }

  /**
   * Handles keyboard events for focus trapping
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') {
      return;
    }

    // Update focusable elements in case DOM changed
    this.updateFocusableElements();

    if (this.focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab: moving backwards
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }
}
