import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";
import { Bell, BellOff, BellRing, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export const NotificationBell = () => {
  const { isSubscribed, permission, subscribe } = useNotifications();
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleBellClick = async () => {
    if (isSubscribed) {
      toast.success("You are already subscribed to notifications! 🚀", {
        style: {
          background: "#121214",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      });
      return;
    }

    toast.loading("Opening subscription request...", { id: "sub-bell-toast" });
    const result = await subscribe();
    if (result && result.isSubscribed) {
      toast.success("Successfully subscribed to notifications! 🔔", { id: "sub-bell-toast" });
    } else if (result && result.permission === "denied") {
      toast.error("Notification permission was denied. Please reset permissions in your browser. 🔒", { id: "sub-bell-toast" });
    } else {
      toast.dismiss("sub-bell-toast");
    }
  };

  return (
    <div 
      className="notification-bell-container"
      onMouseEnter={() => { setHovered(true); setShowTooltip(true); }}
      onMouseLeave={() => { setHovered(false); setShowTooltip(false); }}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBellClick}
        className={`bell-nav-btn ${isSubscribed ? "subscribed" : "unsubscribed"}`}
        aria-label="Toggle Push Notifications"
      >
        <AnimatePresence mode="wait">
          {isSubscribed ? (
            <motion.div
              key="bell-subscribed"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <BellRing size={20} className="bell-active-icon" />
              <span className="bell-glow-dot"></span>
            </motion.div>
          ) : permission === "denied" ? (
            <motion.div
              key="bell-denied"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <BellOff size={20} className="bell-disabled-icon" />
            </motion.div>
          ) : (
            <motion.div
              key="bell-default"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: hovered ? [0, -15, 15, -15, 15, 0] : 0,
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Bell size={20} className="bell-inactive-icon" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Glassmorphic Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bell-tooltip-glass"
          >
            <div className="tooltip-indicator"></div>
            {isSubscribed ? (
              <div className="tooltip-content subscribed">
                <Check size={14} className="text-emerald-400" />
                <span>Notifications Active</span>
              </div>
            ) : permission === "denied" ? (
              <div className="tooltip-content blocked">
                <span>Permission Blocked</span>
              </div>
            ) : (
              <div className="tooltip-content prompt">
                <span>Subscribe to updates</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
