import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../hooks/useNotifications";
import { BellRing, X } from "lucide-react";
import toast from "react-hot-toast";

export const SubscriptionPopup = () => {
  const { showPopup, subscribe, dismiss } = useNotifications();

  const handlePopupSubscribe = async () => {
    toast.loading("Opening subscription request...", { id: "sub-popup-toast" });
    const result = await subscribe();
    if (result && result.isSubscribed) {
      toast.success("Successfully subscribed to notifications! 🔔", { id: "sub-popup-toast" });
    } else if (result && result.permission === "denied") {
      toast.error("Notification permission was denied. Please reset permissions in your browser. 🔒", { id: "sub-popup-toast" });
    } else if (result && result.error === "SDK_NOT_LOADED") {
      toast.error("Could not connect to notification service. Please disable your adblocker/Brave Shield or try over HTTPS! 🛡️", { id: "sub-popup-toast" });
    } else {
      toast.dismiss("sub-popup-toast");
    }
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <div className="subscription-popup-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="subscription-popup-card"
          >
            {/* Close Button */}
            <button className="popup-close-btn" onClick={dismiss} aria-label="Close popup">
              <X size={18} />
            </button>

            {/* Glowing Bell Icon Header */}
            <div className="popup-icon-container">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
                }}
                transition={{
                  repeat: Infinity,
                  repeatDelay: 3,
                  duration: 0.8,
                }}
                className="glowing-bell-ring"
              >
                <BellRing size={40} className="bell-svg-glow" />
              </motion.div>
            </div>

            {/* Card Content */}
            <h3 className="popup-title">🔔 Stay Updated</h3>
            <p className="popup-message">
              Subscribe to receive important portfolio updates, new projects, achievements, and maintenance announcements.
            </p>

            {/* Action Buttons */}
            <div className="popup-btn-group">
              <button className="popup-btn-secondary" onClick={dismiss}>
                Maybe Later
              </button>
              <button className="popup-btn-primary" onClick={handlePopupSubscribe}>
                <span>Subscribe</span>
                <span className="btn-glow-layer"></span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionPopup;
