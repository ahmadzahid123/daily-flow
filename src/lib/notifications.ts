// Notification utility functions
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  const { data: vapidData, error: vapidError } = await supabase.functions.invoke(
    'vapid-public-key'
  );
  const vapidPublicKey = (vapidData as any)?.publicKey as string | undefined;

  if (vapidError || !vapidPublicKey) {
    console.error('VAPID public key not configured', vapidError);
    return null;
  }

  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });
    }
    
    console.log('Push subscription:', JSON.stringify(subscription));

    // Store subscription in database
    const subscriptionJSON = subscription.toJSON();
    const insertData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      subscription: subscriptionJSON as Json
    };
    
    const { error } = await supabase
      .from('push_subscriptions')
      .insert([insertData]);

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Error storing push subscription:', error);
    } else {
      console.log('Push subscription stored successfully');
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

export function showLocalNotification(title: string, body: string, tag?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'task-reminder',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
}

export async function testNotification() {
  const permission = await requestNotificationPermission();
  if (permission) {
    showLocalNotification(
      '🔔 Test Notification',
      'Notifications are working! You will receive task reminders here.'
    );
    return true;
  }
  return false;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
