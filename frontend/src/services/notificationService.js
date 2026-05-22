// OneSignal Web Push Notification Service

const ONESIGNAL_APP_ID = "454dcf3b-18c2-4b30-bf85-b43b67161d92";
const API_URL = import.meta.env.VITE_API_URL || "";

// Dynamically load OneSignal SDK script
export const loadOneSignalSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.OneSignal) {
      resolve(window.OneSignal);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => {
      resolve(window.OneSignal);
    };
    script.onerror = (err) => {
      console.error("Failed to load OneSignal SDK:", err);
      reject(err);
    };
    document.head.appendChild(script);
  });
};

// Initialize OneSignal
export const initializeOneSignal = async () => {
  try {
    await loadOneSignalSDK();
    
    return new Promise((resolve) => {
      window.OneSignal = window.OneSignal || [];
      window.OneSignal.push(async () => {
        await window.OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false, // Custom bell and popup will be used
          },
        });
        console.log("OneSignal initialized successfully");
        resolve(window.OneSignal);
      });
    });
  } catch (error) {
    console.error("OneSignal Initialization Error:", error);
    return null;
  }
};

// Sync push subscription status to our visitor tracking table
export const syncPushSubscription = async ({
  subscriptionStatus,
  subscriptionId,
  lastPromptTime,
  deviceBrowser,
}) => {
  try {
    const sessionId = localStorage.getItem("mrprem_session_id") || 
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    if (!localStorage.getItem("mrprem_session_id")) {
      localStorage.setItem("mrprem_session_id", sessionId);
    }

    const payload = {
      sessionId,
      subscriptionStatus,
      subscriptionId,
      lastPromptTime,
      deviceBrowser,
    };

    const response = await fetch(`${API_URL}/api/track-visitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Sync API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error syncing push subscription with backend:", error);
    return null;
  }
};

// Request Notification Permission and Opt-in
export const requestPushPermission = async () => {
  if (!window.OneSignal || !window.OneSignal.Notifications) {
    return {
      permission: "default",
      isSubscribed: false,
      subscriptionId: null,
      error: "SDK_NOT_LOADED",
    };
  }

  return new Promise((resolve, reject) => {
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(async () => {
      try {
        // Trigger OneSignal permission pop-up
        await window.OneSignal.Notifications.requestPermission();
        
        const permission = window.OneSignal.Notifications.permission;
        const isSubscribed = window.OneSignal.User.PushSubscription.optedIn;
        const subscriptionId = window.OneSignal.User.PushSubscription.id;
        
        // Sync with backend immediately if subscribed
        if (isSubscribed) {
          await syncPushSubscription({
            subscriptionStatus: "subscribed",
            subscriptionId: subscriptionId,
            lastPromptTime: new Date().toISOString(),
            deviceBrowser: navigator.userAgent,
          });
        }
        
        resolve({
          permission,
          isSubscribed,
          subscriptionId,
        });
      } catch (err) {
        console.error("OneSignal requestPermission failed:", err);
        reject(err);
      }
    });
  });
};

// Get current push notification status
export const getNotificationState = async () => {
  // If OneSignal SDK is not fully loaded or initialized yet, return local offline fallback
  if (!window.OneSignal || !window.OneSignal.Notifications) {
    const isSubscribedLocal = localStorage.getItem("mrprem_notification_subscribed") === "true";
    return {
      permission: isSubscribedLocal ? "granted" : "default",
      isSubscribed: isSubscribedLocal,
      subscriptionId: null,
    };
  }

  return new Promise((resolve) => {
    window.OneSignal.push(async () => {
      try {
        const permission = window.OneSignal.Notifications.permission;
        const isSubscribed = window.OneSignal.User.PushSubscription.optedIn;
        const subscriptionId = window.OneSignal.User.PushSubscription.id;
        
        resolve({
          permission,
          isSubscribed,
          subscriptionId,
        });
      } catch (err) {
        console.error("Error fetching notification status:", err);
        resolve({
          permission: "default",
          isSubscribed: false,
          subscriptionId: null,
        });
      }
    });
  });
};
