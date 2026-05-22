import { useState, useEffect, useCallback } from "react";
import {
  initializeOneSignal,
  getNotificationState,
  requestPushPermission,
  syncPushSubscription,
} from "../services/notificationService";

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Synchronize state from OneSignal SDK and local storage
  const syncState = useCallback(async () => {
    const state = await getNotificationState();
    setIsSubscribed(state.isSubscribed);
    setPermission(state.permission);
    setSubscriptionId(state.subscriptionId);

    // Smart logic for showing the premium subscription popup
    const dismissedAtStr = localStorage.getItem("mrprem_notification_dismissed_at");
    const isSubscribedLocal = localStorage.getItem("mrprem_notification_subscribed") === "true";
    
    // If browser says granted but state hasn't synced, or local storage says subscribed
    const actuallySubscribed = state.isSubscribed || isSubscribedLocal || state.permission === "granted";
    
    if (actuallySubscribed) {
      setShowPopup(false);
      localStorage.setItem("mrprem_notification_subscribed", "true");
      return;
    }

    if (state.permission === "denied") {
      setShowPopup(false);
      return;
    }

    // Cooldown logic for dismissed popups
    if (dismissedAtStr) {
      const dismissedAt = new Date(dismissedAtStr).getTime();
      const now = Date.now();
      if (now - dismissedAt < COOLDOWN_MS) {
        setShowPopup(false);
        return;
      }
    }

    // If we reach here, user is NOT subscribed and cooldown is over or never shown
    setShowPopup(true);
  }, []);

  // Initialize OneSignal on hook mount
  useEffect(() => {
    let active = true;

    const runInit = async () => {
      const sdk = await initializeOneSignal();
      if (!sdk || !active) return;

      setIsInitialized(true);
      await syncState();

      // Listen to subscription state transitions
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(() => {
        window.OneSignal.Notifications.addEventListener("permissionChange", async () => {
          if (active) await syncState();
        });
        
        // Listen to User Change if available
        if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
          window.OneSignal.User.PushSubscription.addEventListener("change", async () => {
            if (active) await syncState();
          });
        }
      });
    };

    runInit();

    return () => {
      active = false;
    };
  }, [syncState]);

  // Subscribe action
  const subscribe = async () => {
    try {
      const result = await requestPushPermission();
      setIsSubscribed(result.isSubscribed);
      setPermission(result.permission);
      setSubscriptionId(result.subscriptionId);
      
      if (result.isSubscribed) {
        localStorage.setItem("mrprem_notification_subscribed", "true");
        localStorage.removeItem("mrprem_notification_dismissed_at");
        setShowPopup(false);
      }
      return result;
    } catch (error) {
      console.error("Subscription trigger failed:", error);
      return null;
    }
  };

  // Maybe Later action
  const dismiss = () => {
    localStorage.setItem("mrprem_notification_dismissed_at", new Date().toISOString());
    setShowPopup(false);
    
    // Sync dismissal with backend tracking as last prompt shown time
    syncPushSubscription({
      subscriptionStatus: "dismissed",
      subscriptionId: null,
      lastPromptTime: new Date().toISOString(),
      deviceBrowser: navigator.userAgent,
    }).catch(err => console.error("Failed to sync dismissal timestamp:", err));
  };

  return {
    isInitialized,
    isSubscribed,
    permission,
    subscriptionId,
    showPopup,
    subscribe,
    dismiss,
    sync: syncState,
  };
};
