/**
 * Push Notification Configuration
 * 
 * Use this file to customize how and when visitors are prompted to subscribe to push notifications.
 */
const notificationConfig = {
  // Set to true to automatically prompt unsubscribed visitors with the glassmorphic subscription popup.
  // Set to false to disable all automatic subscription popups (only allowing users to subscribe manually via the navbar bell).
  enableAutoPopup: false,

  // Cooldown period in days before prompting the user again after they click "Maybe Later" (Dismiss)
  cooldownDays: 7,
};

export default notificationConfig;
