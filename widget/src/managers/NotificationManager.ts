import { DEFAULT_NOTIFICATION_SOUND, DEFAULT_SOUND_VOLUME, NOTIFICATION_AUTO_CLOSE_TIMEOUT, NOTIFICATION_TAG } from '../constants';

interface WidgetSettings {
  enableSoundNotifications?: boolean;
  soundNotificationUrl?: string;
  soundVolume?: number;
  enableDesktopNotifications?: boolean;
  headerAvatarUrl?: string;
}

interface WidgetState {
  isOpen: boolean;
}

export class NotificationManager {
  private notificationAudio: HTMLAudioElement | null = null;
  private notificationPermission: NotificationPermission = 'default';
  private settings: WidgetSettings | null = null;
  private state: WidgetState;
  private openChat: () => void;

  constructor(
    state: WidgetState,
    openChat: () => void
  ) {
    this.state = state;
    this.openChat = openChat;
  }

  public setSettings(settings: WidgetSettings | null): void {
    this.settings = settings;
  }

  public initializeNotifications(): void {
    // Initialize audio for sound notifications
    if (this.settings?.enableSoundNotifications) {
      const soundUrl = this.settings?.soundNotificationUrl || DEFAULT_NOTIFICATION_SOUND;
      this.notificationAudio = new Audio(soundUrl);
      this.notificationAudio.volume = this.settings?.soundVolume || DEFAULT_SOUND_VOLUME;
    }

    // Request desktop notification permission
    if (this.settings?.enableDesktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          this.notificationPermission = permission;
        });
      } else {
        this.notificationPermission = Notification.permission;
      }
    }
  }

  public playNotificationSound(): void {
    if (this.settings?.enableSoundNotifications && this.notificationAudio && !this.state.isOpen) {
      this.notificationAudio.currentTime = 0;
      this.notificationAudio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  public showDesktopNotification(title: string, body: string): void {
    if (
      this.settings?.enableDesktopNotifications &&
      this.notificationPermission === 'granted' &&
      !this.state.isOpen &&
      !document.hasFocus()
    ) {
      const notification = new Notification(title, {
        body,
        icon: this.settings?.headerAvatarUrl || undefined,
        tag: NOTIFICATION_TAG,
      });

      notification.onclick = () => {
        window.focus();
        this.openChat();
        notification.close();
      };

      // Auto close notification
      setTimeout(() => notification.close(), NOTIFICATION_AUTO_CLOSE_TIMEOUT);
    }
  }
}
