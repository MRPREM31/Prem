import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmNotificationModal = ({ isOpen, onCancel, onConfirm, titleText = "Send Push Notification" }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="confirm-modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="confirm-modal-card"
          >
            {/* Header Close */}
            <button className="confirm-close-btn" onClick={onCancel} aria-label="Close modal">
              <X size={18} />
            </button>

            {/* Warning Icon Container */}
            <div className="confirm-icon-box">
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="warning-pulse-container"
              >
                <AlertTriangle size={32} className="warning-svg-icon" />
              </motion.div>
            </div>

            {/* Title & Body */}
            <h3 className="confirm-title">{titleText}</h3>
            <p className="confirm-message">
              Are you sure you want to notify all subscribers about this update?
              This notification will be sent to all subscribed users.
            </p>

            {/* Action Buttons */}
            <div className="confirm-btn-group">
              <button className="confirm-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button className="confirm-btn-primary" onClick={onConfirm}>
                <span>Yes, Send Notification</span>
                <span className="confirm-btn-glow"></span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmNotificationModal;
