import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * PRODUCTION-GRADE ScrollManager
 * Mimics high-end platforms (LinkedIn/GitHub) by handling dynamic content 
 * and React rendering lifecycle for perfect scroll restoration.
 */
const ScrollManager = () => {
  const { pathname, hash, key, state } = useLocation();
  const navigationType = useNavigationType();
  const isRestoring = useRef(false);

  // 1. Precise Scroll Tracking
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoring.current) return;
      
      const currentY = window.scrollY;
      if (currentY >= 0) {
        sessionStorage.setItem(`scroll_pos_${pathname}_${key}`, currentY.toString());
        sessionStorage.setItem(`scroll_pos_${pathname}`, currentY.toString());
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, key]);

  // 2. Intelligent Restoration Logic
  useLayoutEffect(() => {
    const isReturning = state?.fromPortfolio === true || navigationType === "POP";
    const savedY = state?.scrollY || 
                  sessionStorage.getItem(`scroll_pos_${pathname}_${key}`) || 
                  sessionStorage.getItem(`scroll_pos_${pathname}`);
    const lastSection = state?.section || sessionStorage.getItem("lastSection");

    // A: RESET TO TOP (Only for fresh visits)
    if (!isReturning && !hash && navigationType === "PUSH") {
      isRestoring.current = true;
      window.scrollTo(0, 0);
      setTimeout(() => { isRestoring.current = false; }, 100);
      return;
    }

    // B: RESTORE POSITION
    if (isReturning && (savedY || lastSection)) {
      isRestoring.current = true;

      const performScroll = () => {
        if (savedY) {
          window.scrollTo({ top: parseInt(savedY, 10), behavior: "instant" });
        } else if (lastSection && pathname === "/") {
          const element = document.getElementById(lastSection);
          if (element) {
            const offset = 85;
            const position = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: position, behavior: "instant" });
          }
        }
      };

      // 1. Instant attempt
      performScroll();

      // 2. Watch for content expansion (images, etc)
      const observer = new ResizeObserver(() => {
        performScroll();
      });
      observer.observe(document.body);

      // 3. Multi-stage retry loop (Final safety)
      const safetyNet = [10, 50, 150, 300, 600, 1200, 2500].map(ms => 
        setTimeout(() => {
          performScroll();
          if (ms === 2500) {
            isRestoring.current = false;
            // Clean up session storage markers
            sessionStorage.removeItem("lastSection");
          }
        }, ms)
      );

      return () => {
        observer.disconnect();
        safetyNet.forEach(clearTimeout);
        isRestoring.current = false;
      };
    }

    // C: HASH NAVIGATION
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        const offset = 85;
        const position = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: position, behavior: "smooth" });
      }
    }
  }, [pathname, hash, key, navigationType, state]);

  return null;
};

export default ScrollManager;
