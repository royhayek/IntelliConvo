/**
 * Centralized state management for the widget
 * Provides a single source of truth for widget state with immutable updates
 */

import { WidgetState } from "../types";

export interface WidgetFullState extends WidgetState {
  currentMode: "chat" | "speak";
  emojiPickerVisible: boolean;
  conversationLoaded: boolean;
  loadedMessageCount: number;
  unreadCount: number;
}

type StateChangeListener = (state: WidgetFullState) => void;

export class StateManager {
  private state: WidgetFullState;
  private listeners: Set<StateChangeListener> = new Set();

  constructor(initialState?: Partial<WidgetFullState>) {
    this.state = {
      isOpen: false,
      isConnected: false,
      isTyping: false,
      hasError: false,
      currentMode: "chat",
      emojiPickerVisible: false,
      conversationLoaded: false,
      loadedMessageCount: 0,
      unreadCount: 0,
      ...initialState,
    };
  }

  /**
   * Gets the current state (immutable copy)
   */
  public getState(): Readonly<WidgetFullState> {
    return { ...this.state };
  }

  /**
   * Updates state with partial changes (immutable)
   * @param updates - Partial state updates
   */
  public setState(updates: Partial<WidgetFullState>): void {
    const prevState = this.state;
    this.state = {
      ...prevState,
      ...updates,
    };

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Subscribes to state changes
   * @param listener - Callback function called when state changes
   * @returns Unsubscribe function
   */
  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifies all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error("Error in state listener:", error);
      }
    });
  }

  /**
   * Convenience methods for common state updates
   */

  public setOpen(isOpen: boolean): void {
    this.setState({ isOpen });
  }

  public setConnected(isConnected: boolean): void {
    this.setState({ isConnected });
  }

  public setTyping(isTyping: boolean): void {
    this.setState({ isTyping });
  }

  public setError(hasError: boolean, errorMessage?: string): void {
    this.setState({ hasError, errorMessage });
  }

  public setMode(currentMode: "chat" | "speak"): void {
    this.setState({ currentMode });
  }

  public setEmojiPicker(emojiPickerVisible: boolean): void {
    this.setState({ emojiPickerVisible });
  }

  public setConversationLoaded(conversationLoaded: boolean): void {
    this.setState({ conversationLoaded });
  }

  public setLoadedMessageCount(loadedMessageCount: number): void {
    this.setState({ loadedMessageCount });
  }

  public incrementUnreadCount(): void {
    this.setState({ unreadCount: this.state.unreadCount + 1 });
  }

  public resetUnreadCount(): void {
    this.setState({ unreadCount: 0 });
  }

  /**
   * Resets state to initial values
   */
  public reset(): void {
    this.state = {
      isOpen: false,
      isConnected: false,
      isTyping: false,
      hasError: false,
      currentMode: "chat",
      emojiPickerVisible: false,
      conversationLoaded: false,
      loadedMessageCount: 0,
      unreadCount: 0,
    };
    this.notifyListeners();
  }

  /**
   * Cleanup - removes all listeners
   */
  public cleanup(): void {
    this.listeners.clear();
  }
}
