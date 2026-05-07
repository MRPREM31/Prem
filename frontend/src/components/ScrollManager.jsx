import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * PRODUCTION-GRADE ScrollManager
 * Mimics high-end platforms (LinkedIn/GitHub) by handling dynamic content 
 * and React rendering lifecycle for perfect scroll restoration.
 */
const ScrollManager = () => {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const isRestoring = useRef(false);

  // 1. Efficiently track scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoring.current) return;
      
      const currentY = window.scrollY;
      // We only save if we are on a valid page state
      if (currentY >= 0) {
        // Precise history-key based storage
        sessionStorage.setItem(`scroll_pos_${pathname}_${key}`, currentY.toString());
        // Path-based fallback
        sessionStorage.setItem(`scroll_pos_${pathname}`, currentY.toString());
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, key]);

  // 2. Advanced Restoration Logic
  useLayoutEffect(() => {
    // Reset: New navigations (PUSH) should start at the top
    if (navigationType !== "POP" && !hash) {
      window.scrollTo(0, 0);
      return;
    }

    // A: Handle Hash Navigation (#id) with precise offset
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        const offset = 85; // Fixed navbar height
        const position = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: position, behavior: "smooth" });
        return;
      }
    }

    // B: Handle BACK/FORWARD (POP) Navigation
    if (navigationType === "POP") {
      const savedY = sessionStorage.getItem(`scroll_pos_${pathname}_${key}`) || 
                    sessionStorage.getItem(`scroll_pos_${pathname}`);
      
      if (savedY) {
        const targetY = parseInt(savedY, 10);
        isRestoring.current = true;

        // B.1: Instant restoration attempt
        window.scrollTo(0, targetY);

        // B.2: THE SECRET SAUCE - ResizeObserver
        // This watches the body height and re-applies scroll whenever the page grows.
        // This solves the problem of "restoring before images/data are loaded".
        const observer = new ResizeObserver(() => {
          if (document.body.scrollHeight >= targetY) {
            window.scrollTo(0, targetY);
          }
        });

        observer.observe(document.body);

        // B.3: Multi-stage timeout fallbacks (Ultimate safety net)
        const safetyTimeouts = [10, 50, 150, 300, 600, 1200, 2500].map(ms => 
          setTimeout(() => {
            window.scrollTo(0, targetY);
            // After 2.5s, we assume the page is fully stable
            if (ms === 2500) isRestoring.current = false;
          }, ms)
        );

        return () => {
          observer.disconnect();
          safetyTimeouts.forEach(clearTimeout);
          isRestoring.current = false;
        };
      }
    }
  }, [pathname, hash, key, navigationType]);

  return null;
};

export default ScrollManager;
