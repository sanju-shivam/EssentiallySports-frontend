import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications.asObservable();

  show(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const current = this.notifications.value;
    this.notifications.next([newNotification, ...current]);

    // Auto-hide after 5 seconds if autoHide is true
    if (notification.autoHide !== false) {
      setTimeout(() => this.remove(newNotification.id), 5000);
    }
  }

  remove(id: string) {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  clear() {
    this.notifications.next([]);
  }

  // Convenience methods
  success(title: string, message: string, autoHide = true) {
    this.show({ type: 'success', title, message, autoHide });
  }

  error(title: string, message: string, autoHide = false) {
    this.show({ type: 'error', title, message, autoHide });
  }

  warning(title: string, message: string, autoHide = true) {
    this.show({ type: 'warning', title, message, autoHide });
  }

  info(title: string, message: string, autoHide = true) {
    this.show({ type: 'info', title, message, autoHide });
  }
}