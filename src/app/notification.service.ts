import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private subscribeAttempted = false;

  constructor(private data: MockDataService, private auth: AuthService) {}

  async requestPermissionAndSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok: false, message: 'Push not supported' };
    // Avoid re-registering/re-posting the subscription (and showing the confirmation notification)
    // on every page navigation — only do the actual subscribe flow once per app session.
    if (this.subscribeAttempted) return { ok: true, subscription: null };
    this.subscribeAttempted = true;
    try {
      let registration: ServiceWorkerRegistration | null = null;
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return { ok: false, message: 'Permission denied' };
      const existing = await registration.pushManager.getSubscription();
      const isNewSubscription = !existing;
      const sub = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.urlBase64ToUint8Array(environment.vapidPublic || '') });
      // send subscription to backend to save (only needed once; backend also upserts by endpoint)
      if (isNewSubscription) {
        try {
          const token = localStorage.getItem('accessToken');
          const headers: any = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = 'Bearer ' + token;
          // Match backend controller: POST /api/push-subscriptions/push
          const resp = await fetch(environment.apiBaseUrl.replace(/\/api\/?$/, '') + '/api/push-subscriptions/push', { method: 'POST', headers, body: JSON.stringify(sub) });
          if (!resp.ok) console.warn('Failed to save subscription to backend, status=', resp.status);
        } catch (e) { console.warn('Failed to save subscription to backend', e); }
      }
      // Return subscription details for debugging UI
      try { return { ok: true, subscription: sub ? JSON.parse(JSON.stringify(sub)) : null }; } catch (e) { return { ok: true, subscription: null }; }
    } catch (e) {
      console.error('subscribe error', e);
      this.subscribeAttempted = false;
      return { ok: false, message: String(e) };
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    if (!base64String) return new Uint8Array();
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
  }
}
