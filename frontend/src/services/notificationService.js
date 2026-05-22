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

// Asynchronously and safely fetch the initialized OneSignal instance with a timeout failsafe
export const getOneSignalInstance = (timeoutMs = 4000) => {
  return new Promise((resolve, reject) => {
    // If window.OneSignal and Notifications namespace are already available, resolve immediately
    if (window.OneSignal && window.OneSignal.Notifications) {
      resolve(window.OneSignal);
      return;
    }

    // Safeguard timeout to prevent hanging UI if blocked by Brave Shield/uBlock/etc.
    const timer = setTimeout(() => {
      reject(new Error("ONESIGNAL_TIMEOUT"));
    }, timeoutMs);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignalInstance) => {
      clearTimeout(timer);
      if (OneSignalInstance && OneSignalInstance.Notifications) {
        resolve(OneSignalInstance);
      } else {
        reject(new Error("ONESIGNAL_NOT_AVAILABLE"));
      }
    });
  });
};

// Initialize OneSignal
export const initializeOneSignal = async () => {
  try {
    await loadOneSignalSDK();
    
    return new Promise((resolve) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false, // Custom bell and popup will be used
            },
          });
          console.log("OneSignal initialized successfully");
        } catch (initErr) {
          // Ignore "Already initialized" error warnings from OneSignal
          console.log("OneSignal init status:", initErr.message || initErr);
        }
        resolve(OneSignal);
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
  try {
    // Wait for OneSignal instance (4-second timeout)
    const OneSignal = await getOneSignalInstance(4000);
    
    // Trigger OneSignal permission pop-up
    await OneSignal.Notifications.requestPermission();
    
    const permission = OneSignal.Notifications.permission;
    const isSubscribed = OneSignal.User?.PushSubscription?.optedIn || false;
    const subscriptionId = OneSignal.User?.PushSubscription?.id || null;
    
    // Sync with backend immediately if subscribed
    if (isSubscribed) {
      syncPushSubscription({
        subscriptionStatus: "subscribed",
        subscriptionId: subscriptionId,
        lastPromptTime: new Date().toISOString(),
        deviceBrowser: navigator.userAgent,
      }).catch(err => console.error("Background subscription sync failed:", err));
    }
    
    return {
      permission,
      isSubscribed,
      subscriptionId,
    };
  } catch (err) {
    console.error("OneSignal requestPermission failed or timed out:", err);
    return {
      permission: "default",
      isSubscribed: false,
      subscriptionId: null,
      error: "SDK_NOT_LOADED",
    };
  }
};

// Get current push notification status
export const getNotificationState = async () => {
  try {
    // Short 1.5s timeout for status checks to prevent slow site boots
    const OneSignal = await getOneSignalInstance(1500);
    
    const permission = OneSignal.Notifications.permission;
    const isSubscribed = OneSignal.User?.PushSubscription?.optedIn || false;
    const subscriptionId = OneSignal.User?.PushSubscription?.id || null;
    
    return {
      permission,
      isSubscribed,
      subscriptionId,
    };
  } catch (err) {
    // Fallback to local storage on timeout or load block (e.g. adblocker)
    const isSubscribedLocal = localStorage.getItem("mrprem_notification_subscribed") === "true" ||
      localStorage.getItem("notification_subscribed") === "true";
    return {
      permission: isSubscribedLocal ? "granted" : "default",
      isSubscribed: isSubscribedLocal,
      subscriptionId: null,
    };
  }
};

// Safely broadcast a push notification directly from the frontend (Vercel client-side fallback)
export const sendFrontendPushNotification = async ({ title, message, url }) => {
  const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

  if (!apiKey) {
    console.warn("[OneSignal Frontend REST] VITE_ONESIGNAL_REST_API_KEY is not defined in frontend env. Attempting public backend broadcast fallback...");
    try {
      const response = await fetch(`${API_URL}/api/notifications/send-public`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, message, url }),
      });
      if (!response.ok) {
        throw new Error(`Backend public broadcast route failed with status ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error("[OneSignal Frontend REST] Public backend broadcast fallback failed:", err);
      throw err;
    }
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: title },
        included_segments: ["Subscribed Users"],
        url: url || "https://mrprem.in",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors ? data.errors.join(", ") : "OneSignal API Error");
    }
    console.log("[OneSignal Frontend REST] Push notification broadcasted successfully directly from browser:", data);
    return data;
  } catch (err) {
    console.error("[OneSignal Frontend REST] Direct frontend API broadcast failed:", err);
    throw err;
  }
};
